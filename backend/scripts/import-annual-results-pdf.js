/**
 * Import students + annual results from Nayab school PDF.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mysql = require('mysql2/promise');
const { calculateGrade, calculatePercentage } = require('../src/utils/gradeCalculator');
const { getMonthlyFee } = require('../src/utils/feeCalculator');
const { normalizeStudentId } = require('../src/utils/nameParser');
const { parsePdfStudents } = require('./parse-pdf-students');

const PDF_PATH = process.argv[2] || path.join(__dirname, '../../../Nayab_English_Grammar_Annual_Result_2025-26_Class_Wise.pdf');
const ACADEMIC_YEAR = '2025-2026';
const EXAM_NAME = 'Annual Examination 2025-26';
const SUBJECTS_6 = ['English', 'Urdu', 'Mathematics', 'Islamiat', 'Computer', 'General Science'];
const SUBJECTS_7 = [...SUBJECTS_6, 'Sindhi'];
const FEMALE_RE = /fatima|ayesha|zainab|mariam|amna|kinza|hira|sana|kanwal|bushra|fiza|hania|maham|maira|meerab|esha|inshirah|aliya|anabia|anaya|barira|divya|erha|eshal|hadia|hiba|humaira|hurain|ifra|iman|inza|iqra|jaweria|khirad|komal|madiha|mahnoor|manahil|mehak|misbah|momina|muniza|nimra|noor|parshant|rabia|raiba|rameen|saba|safa|sahara|sehrish|seerat|shifa|sumaira|syeda|tasnain|tooba|ujala|unaiza|urwa|wardah|yashfa|zunaira|aiza|aiman|alina|alisha|ambara|anaum|areeba|areej|aysha|bisma|dua|emaan|falak|hansa|hareem|huria|kashaf|khushbo|maheen|maiza|meesha|meeral|minal|momna|muntaha|nehal|palku|raima|samiha|sawera|shanzay|shijra|saira|sadaf|sadim|sain|warisha|wajeeha|zoha|abiha|afifa|alishba|anchal|ankeet|artika|dua|emaan|eshaal|hanan|hooriya|hurain|inshirah|kinza|maham|maria|maryam|mehtab|nadia|nimrah|parshant|rabia|rameen|sehar|shanka|shanzay|summaiya|virat|wardah|zainab|zaliha|zohra|zunaira|bhagia|kartika|kanika|mehkasha|minha|umm|um-|um /i;

async function run() {
  if (!fs.existsSync(PDF_PATH)) { console.error('PDF not found:', PDF_PATH); process.exit(1); }

  console.log('Reading PDF:', PDF_PATH);
  const pdfData = await pdf(fs.readFileSync(PDF_PATH));
  const classData = parsePdfStudents(pdfData.text).map((c) => ({
    ...c,
    students: c.students.map((s) => ({ ...s, gender: FEMALE_RE.test(s.fullName) ? 'Female' : 'Male' })),
  }));

  const total = classData.reduce((s, c) => s + c.students.length, 0);
  console.log(`Parsed ${classData.length} classes, ${total} students:`);
  classData.forEach((c) => console.log(`  ${c.name}: ${c.students.length} (${c.hasSindhi ? 7 : 6} subj)`));

  if (total < 50) { console.error('Too few students parsed.'); process.exit(1); }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms', multipleStatements: true,
  });

  await connection.query(fs.readFileSync(path.join(__dirname, '../database/migrations/002_student_features.sql'), 'utf8')).catch(() => {});

  console.log('\nClearing old student data...');
  await connection.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of ['results', 'fees', 'attendance', 'promotion_logs', 'student_leaving_certificates', 'students', 'exams', 'subjects', 'classes']) {
    await connection.query(`DELETE FROM ${t}`);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS=1');

  const allClassNames = [...new Set(['Nursery', 'KG1', 'KG2', '9th', '10th', ...classData.map((c) => c.name)])];
  const classIdMap = {};
  for (const name of allClassNames) {
    const [r] = await connection.query('INSERT INTO classes (name, section, academic_year, capacity) VALUES (?, ?, ?, ?)', [name, 'A', ACADEMIC_YEAR, 120]);
    classIdMap[name] = r.insertId;
  }

  let totalStudents = 0, totalResults = 0;
  const seenGrGlobal = new Set();
  for (const cls of classData) {
    const classId = classIdMap[cls.name];
    const subList = cls.hasSindhi ? SUBJECTS_7 : SUBJECTS_6;
    const subjectIds = {};
    for (const sub of subList) {
      const [sr] = await connection.query('INSERT INTO subjects (name, class_id, max_marks) VALUES (?, ?, 100)', [sub, classId]);
      subjectIds[sub] = sr.insertId;
    }
    const [er] = await connection.query('INSERT INTO exams (name, academic_year, class_id, is_published) VALUES (?, ?, ?, 1)', [EXAM_NAME, ACADEMIC_YEAR, classId]);
    const examId = er.insertId;

    let roll = 1;
    for (const st of cls.students) {
      if (!st.marks?.length || st.marks.some((m) => Number.isNaN(parseFloat(m)))) continue;
      const sid = normalizeStudentId(st.grNo);
      if (!sid || seenGrGlobal.has(sid)) continue;
      seenGrGlobal.add(sid);
      const [ins] = await connection.query(
        `INSERT INTO students (student_id, roll_number, full_name, father_name, gender, date_of_birth, class_id, section, admission_date, fee_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'A', ?, 'pending')`,
        [sid, roll++, String(st.fullName).slice(0, 120), String(st.fatherName).slice(0, 120), st.gender, st.dob, classId, st.doAdm]
      );
      for (let j = 0; j < subList.length; j++) {
        const obtained = parseFloat(st.marks[j]);
        if (Number.isNaN(obtained)) continue;
        const pct = calculatePercentage(obtained, 100);
        await connection.query(
          `INSERT INTO results (student_id, subject_id, exam_id, marks_obtained, max_marks, percentage, grade, entered_by) VALUES (?, ?, ?, ?, 100, ?, ?, 1)`,
          [ins.insertId, subjectIds[subList[j]], examId, obtained, pct, calculateGrade(pct)]
        );
        totalResults++;
      }
      await connection.query(`INSERT INTO fees (student_id, fee_type, amount, status, due_date, academic_year) VALUES (?, 'Monthly Fee', ?, 'pending', CURDATE(), ?)`,
        [ins.insertId, getMonthlyFee(cls.name), ACADEMIC_YEAR]);
      totalStudents++;
    }
  }

  await connection.query(`INSERT INTO school_settings (setting_key, setting_value) VALUES ('fee_structure', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
    ['Nursery to KG1: Rs. 2,000/month\nKG2 to Class 8: Rs. 1,800/month\nClass 9 & 10: Rs. 2,500/month']);

  await connection.end();
  console.log(`\n✅ Done! ${totalStudents} students, ${totalResults} result records imported.`);
}

run().catch((e) => { console.error('Import failed:', e.message); process.exit(1); });
