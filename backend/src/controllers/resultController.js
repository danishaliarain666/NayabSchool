const pool = require('../config/db');
const { sortClasses } = require('../utils/classOrder');
const { calculateGrade, calculatePercentage } = require('../utils/gradeCalculator');
const { assignPositions, aggregateRows } = require('../utils/resultAggregate');
const {
  createResultPdfStream,
  renderResultCard,
  computeMarksheetPageHeight,
  fetchTermResults,
} = require('../utils/resultCardPdf');

async function fetchResultRows(classId, examId) {
  let where = 's.is_active = 1';
  const params = [];
  if (classId) {
    where += ' AND s.class_id = ?';
    params.push(classId);
  }
  if (examId) {
    where += ' AND r.exam_id = ?';
    params.push(examId);
  }
  const [rows] = await pool.query(
    `SELECT r.*, s.id AS student_db_id, s.full_name, s.roll_number, sub.name AS subject_name, e.name AS exam_name,
            CONCAT(c.name, ' - ', c.section) AS class_name
     FROM results r
     JOIN students s ON r.student_id = s.id
     JOIN subjects sub ON r.subject_id = sub.id
     JOIN exams e ON r.exam_id = e.id
     JOIN classes c ON s.class_id = c.id
     WHERE ${where}
     ORDER BY c.name, s.roll_number, sub.name`,
    params
  );
  return rows;
}

exports.getSummaries = async (req, res, next) => {
  try {
    const { classId, examId, page = 1, byClass = '0' } = req.query;
    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required.' });
    }

    let effectiveClassId = classId;
    let paginationMeta = {};

    if (byClass === '1' && !classId) {
      const [classRows] = await pool.query('SELECT id, name, section FROM classes WHERE is_active = 1');
      const sorted = sortClasses(classRows);
      const pageIndex = Math.max(0, parseInt(page, 10) - 1);
      if (!sorted.length || pageIndex >= sorted.length) {
        return res.json({
          success: true,
          data: [],
          pagination: { page: parseInt(page, 10), totalPages: sorted.length, byClass: true, currentClass: null },
        });
      }
      effectiveClassId = String(sorted[pageIndex].id);
      paginationMeta = {
        byClass: true,
        currentClass: sorted[pageIndex],
        totalPages: sorted.length,
        page: parseInt(page, 10),
      };
    }

    if (!effectiveClassId) {
      return res.status(400).json({ success: false, message: 'Select a class or use class pages.' });
    }

    let effectiveExamId = examId;
    const [[examRow]] = await pool.query('SELECT id, class_id FROM exams WHERE id = ?', [examId]);
    if (!examRow || String(examRow.class_id) !== String(effectiveClassId)) {
      const [alt] = await pool.query(
        'SELECT id FROM exams WHERE class_id = ? ORDER BY created_at DESC LIMIT 1',
        [effectiveClassId]
      );
      effectiveExamId = alt[0]?.id || examId;
    }

    const rows = await fetchResultRows(effectiveClassId, effectiveExamId);
    const withMarks = assignPositions(aggregateRows(rows));

    const [classStudents] = await pool.query(
      `SELECT s.id AS student_id, s.roll_number, s.full_name, CONCAT(c.name, ' - ', c.section) AS class_name
       FROM students s JOIN classes c ON s.class_id = c.id
       WHERE s.class_id = ? AND s.is_active = 1 ORDER BY s.roll_number`,
      [effectiveClassId]
    );
    const byId = Object.fromEntries(withMarks.map((a) => [String(a.student_id), a]));
    const aggregated = classStudents.map((s) => byId[String(s.student_id)] || {
      student_id: s.student_id,
      roll_number: s.roll_number,
      full_name: s.full_name,
      class_name: s.class_name,
      total_obtained: 0,
      total_max: 0,
      percentage: 0,
      grade: '—',
      position: '',
      rank: 0,
      subject_count: 0,
    });

    const clsMeta = paginationMeta.currentClass || classStudents[0];
    res.json({
      success: true,
      data: aggregated,
      effectiveExamId,
      pagination: paginationMeta.byClass
        ? paginationMeta
        : {
            byClass: false,
            currentClass: clsMeta
              ? { id: effectiveClassId, name: clsMeta.class_name?.split(' - ')[0] || clsMeta.name, section: clsMeta.class_name?.split(' - ')[1] || clsMeta.section }
              : null,
          },
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentDetail = async (req, res, next) => {
  try {
    const { studentId, examId } = req.query;
    if (!studentId || !examId) {
      return res.status(400).json({ success: false, message: 'studentId and examId required.' });
    }
    const [rows] = await pool.query(
      `SELECT r.id, r.marks_obtained, r.max_marks, sub.name AS subject_name, e.name AS exam_name
       FROM results r
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN exams e ON r.exam_id = e.id
       WHERE r.student_id = ? AND r.exam_id = ?
       ORDER BY sub.name`,
      [studentId, examId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { classId, examId } = req.query;
    let where = 's.is_active = 1';
    const params = [];
    if (classId) { where += ' AND s.class_id = ?'; params.push(classId); }
    if (examId) { where += ' AND r.exam_id = ?'; params.push(examId); }

    const [rows] = await pool.query(
      `SELECT r.*, s.full_name, s.roll_number, sub.name AS subject_name, e.name AS exam_name,
              CONCAT(c.name, ' - ', c.section) AS class_name
       FROM results r
       JOIN students s ON r.student_id = s.id
       JOIN subjects sub ON r.subject_id = sub.id
       JOIN exams e ON r.exam_id = e.id
       JOIN classes c ON s.class_id = c.id
       WHERE ${where} ORDER BY c.name, s.roll_number, sub.name`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { student_id, subject_id, exam_id, marks_obtained, max_marks } = req.body;
    const percentage = calculatePercentage(parseFloat(marks_obtained), parseFloat(max_marks || 100));
    const grade = calculateGrade(percentage);

    const [result] = await pool.query(
      `INSERT INTO results (student_id, subject_id, exam_id, marks_obtained, max_marks, percentage, grade, entered_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), max_marks=VALUES(max_marks),
       percentage=VALUES(percentage), grade=VALUES(grade), entered_by=VALUES(entered_by)`,
      [student_id, subject_id, exam_id, marks_obtained, max_marks || 100, percentage, grade, req.user.userId]
    );

    res.status(201).json({ success: true, message: 'Result saved.', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { marks_obtained, max_marks } = req.body;
    const percentage = calculatePercentage(parseFloat(marks_obtained), parseFloat(max_marks || 100));
    const grade = calculateGrade(percentage);
    await pool.query(
      'UPDATE results SET marks_obtained=?, max_marks=?, percentage=?, grade=?, entered_by=? WHERE id=?',
      [marks_obtained, max_marks || 100, percentage, grade, req.user.userId, req.params.id]
    );
    res.json({ success: true, message: 'Result updated.' });
  } catch (err) {
    next(err);
  }
};

exports.getExams = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const [rows] = await pool.query(
      'SELECT * FROM subjects WHERE is_active = 1 AND class_id = ? ORDER BY name',
      [classId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.exportPDF = async (req, res, next) => {
  try {
    const { studentId, examId } = req.query;
    const [students] = await pool.query(
      `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name FROM students s
       JOIN classes c ON s.class_id = c.id WHERE s.id = ?`,
      [studentId]
    );
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = students[0];

    const [examRows] = await pool.query('SELECT name FROM exams WHERE id = ?', [examId]);
    const examName = examRows[0]?.name || 'Examination';
    const terms = await fetchTermResults(pool, student.id, student.class_id, examId);
    const remarkCount = 0;
    const pageH = computeMarksheetPageHeight(terms.midResults.length, terms.finalResults.length, remarkCount);
    const doc = createResultPdfStream(res, `result-${student.student_id}.pdf`, pageH);
    await renderResultCard(doc, pool, student, examId, examName);
    doc.end();
  } catch (err) {
    next(err);
  }
};

/** Bulk marksheets — all / class / search filter */
exports.bulkExportPDF = async (req, res, next) => {
  try {
    const { classId, examId, search } = req.query;
    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required.' });
    }

    let where = 's.is_active = 1';
    const params = [];
    if (classId) { where += ' AND s.class_id = ?'; params.push(classId); }
    if (search) {
      where += ' AND (s.full_name LIKE ? OR s.student_id LIKE ? OR s.father_name LIKE ? OR CAST(s.roll_number AS CHAR) LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    const [students] = await pool.query(
      `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name FROM students s
       JOIN classes c ON s.class_id = c.id WHERE ${where} ORDER BY c.name, s.roll_number`,
      params
    );

    const [examRows] = await pool.query('SELECT name FROM exams WHERE id = ?', [examId]);
    const examName = examRows[0]?.name || 'Examination';

    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No active students found for this filter.' });
    }

    let page = 0;
    let doc;

    for (const student of students) {
      const terms = await fetchTermResults(pool, student.id, student.class_id, examId);
      if (!terms.midResults.length && !terms.finalResults.length) continue;
      const pageH = computeMarksheetPageHeight(terms.midResults.length, terms.finalResults.length, 0);
      if (page === 0) doc = createResultPdfStream(res, `marksheets-${classId || 'all'}.pdf`, pageH);
      else doc.addPage({ size: [595.28, pageH] });
      await renderResultCard(doc, pool, student, examId, examName);
      page++;
    }
    if (!page) return res.status(404).json({ success: false, message: 'No results found for export.' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

/** Bulk import marks — for when student data is provided */
exports.bulkCreate = async (req, res, next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || !records.length) {
      return res.status(400).json({ success: false, message: 'records array is required.' });
    }

    let saved = 0;
    for (const rec of records) {
      const { student_id, subject_id, exam_id, marks_obtained, max_marks } = rec;
      const pct = calculatePercentage(parseFloat(marks_obtained), parseFloat(max_marks || 100));
      const grade = calculateGrade(pct);
      await pool.query(
        `INSERT INTO results (student_id, subject_id, exam_id, marks_obtained, max_marks, percentage, grade, entered_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), percentage=VALUES(percentage), grade=VALUES(grade)`,
        [student_id, subject_id, exam_id, marks_obtained, max_marks || 100, pct, grade, req.user.userId]
      );
      saved++;
    }

    res.json({ success: true, message: `${saved} result records saved.`, data: { saved } });
  } catch (err) {
    next(err);
  }
};
