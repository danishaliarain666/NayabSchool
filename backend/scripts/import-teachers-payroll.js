/**
 * Import teachers from SALARY Aug-2026 payroll Excel.
 * Salary fixed at 30000. Login: phone + default password Teacher@123
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const EXCEL = process.env.PAYROLL_XLSX || 'd:\\updatedcontact\\SALARY Aug-2026 pay Roll.xlsx';
const DEFAULT_SALARY = 30000;
const DEFAULT_PASSWORD = 'Teacher@123';

function cellVal(v) {
  if (v == null) return '';
  if (typeof v === 'object' && v.result !== undefined) return String(v.result).trim();
  if (typeof v === 'object' && v.richText) return v.richText.map((t) => t.text).join('').trim();
  if (typeof v === 'object' && v.formula) return String(v.result ?? '').trim();
  return String(v).trim();
}

function normalizeName(n) {
  return n.replace(/\s+/g, ' ').replace(/\./g, '').trim().toLowerCase();
}

function guessGender(name) {
  return /miss|ma'?am|mrs|ms\b|shiza|nimra|reeta|rukhsana|fatima|ayesha/i.test(name) ? 'Female' : 'Male';
}

function fakePhone(seed) {
  return `03${String(100000000 + seed).slice(-9)}`;
}

async function main() {
  if (!fs.existsSync(EXCEL)) {
    console.error('File not found:', EXCEL);
    process.exit(1);
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL);
  const sheet = wb.getWorksheet('Sheet1') || wb.worksheets[0];

  const seen = new Set();
  const teachers = [];

  for (let r = 8; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const payment = cellVal(row.getCell(5).value);
    if (payment !== 'Acc.') continue;
    const name = cellVal(row.getCell(2).value);
    if (!name || name === 'Employee Name' || /father|hus/i.test(name)) continue;
    const key = normalizeName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    let designation = cellVal(row.getCell(3).value) || 'Teacher';
    if (/teacher/i.test(designation)) designation = 'Teacher';
    teachers.push({
      full_name: name.replace(/\s+/g, ' ').trim(),
      designation,
      bank_account: cellVal(row.getCell(4).value),
    });
  }

  console.log(`Parsed ${teachers.length} staff from payroll`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
    multipleStatements: true,
  });

  const migPath = require('path').join(__dirname, '../database/migrations/004_teacher_payroll.sql');
  for (const stmt of fs.readFileSync(migPath, 'utf8').split(';').map((s) => s.trim()).filter(Boolean)) {
    await conn.query(stmt).catch(() => {});
  }

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  let n = 0;

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const employee_id = `EMP-${String(i + 1).padStart(3, '0')}`;
    const phone = fakePhone(i + 1);
    const gender = guessGender(t.full_name);
    const email = `${phone}@teacher.nayab.local`;

    const [existing] = await conn.query('SELECT id FROM teachers WHERE full_name = ? LIMIT 1', [t.full_name]);
    let teacherId;
    if (existing.length) {
      teacherId = existing[0].id;
      await conn.query(
        `UPDATE teachers SET monthly_salary=?, designation=?, bank_account=?, phone=?, subject=COALESCE(subject, ?) WHERE id=?`,
        [DEFAULT_SALARY, t.designation, t.bank_account, phone, t.designation, teacherId]
      );
    } else {
      const [ins] = await conn.query(
        `INSERT INTO teachers (employee_id, full_name, gender, phone, email, qualification, subject, joining_date, monthly_salary, designation, bank_account, salary_paid)
         VALUES (?, ?, ?, ?, ?, 'As per school record', ?, CURDATE(), ?, ?, ?, 'unpaid')`,
        [employee_id, t.full_name, gender, phone, email, t.designation, DEFAULT_SALARY, t.designation, t.bank_account]
      );
      teacherId = ins.insertId;
    }

    const [u] = await conn.query('SELECT id FROM users WHERE teacher_id = ?', [teacherId]);
    if (!u.length) {
      const username = `t${teacherId}`;
      await conn.query(
        `INSERT INTO users (username, email, phone, password_hash, role, teacher_id, is_active) VALUES (?, ?, ?, ?, 'teacher', ?, 1)`,
        [username, email, phone, hash, teacherId]
      );
    } else {
      await conn.query('UPDATE users SET phone = ?, password_hash = ? WHERE teacher_id = ?', [phone, hash, teacherId]);
    }
    n++;
    console.log(`✓ ${t.full_name} | ${phone} | Rs.${DEFAULT_SALARY}`);
  }

  await conn.end();
  console.log(`\nImported/updated ${n} teachers. Login: phone number, password: ${DEFAULT_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
