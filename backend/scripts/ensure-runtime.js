/**
 * Run after MySQL is up: verify DB, reset staff passwords, assign class teachers.
 * Does NOT delete student data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { sortClasses } = require('../src/utils/classOrder');

async function main() {
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
  });

  const migration = fs.readFileSync(path.join(__dirname, '../database/migrations/003_weekly_remarks.sql'), 'utf8');
  await connection.query(migration).catch(() => {});
  const mig4 = fs.readFileSync(path.join(__dirname, '../database/migrations/004_teacher_payroll.sql'), 'utf8');
  for (const stmt of mig4.split(';').map((s) => s.trim()).filter(Boolean)) {
    await connection.query(stmt).catch(() => {});
  }
  const mig5 = fs.readFileSync(path.join(__dirname, '../database/migrations/005_staff_attendance.sql'), 'utf8');
  await connection.query(mig5).catch(() => {});
  const mig6 = fs.readFileSync(path.join(__dirname, '../database/migrations/006_holidays.sql'), 'utf8');
  await connection.query(mig6).catch(() => {});
  await connection
    .query('ALTER TABLE school_holidays ADD COLUMN announcement_id INT UNSIGNED NULL')
    .catch(() => {});

  await connection.query(
    `INSERT INTO school_settings (setting_key, setting_value) VALUES ('principal_name', 'Miss Rukhsana Ghulam Murtza Arain') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
  );
  await connection.query(
    `INSERT INTO school_settings (setting_key, setting_value) VALUES ('phone', '03043021844 / 03332867412') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
  );
  await connection.query(
    `INSERT INTO school_settings (setting_key, setting_value) VALUES ('email', 'nayabhtsmirwah@gmail.com') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
  );
  await connection.query(
    `INSERT INTO school_settings (setting_key, setting_value) VALUES ('matric_pass_rate', '99.9') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
  );
  await connection.query(
    `INSERT INTO school_settings (setting_key, setting_value) VALUES ('school_name', 'Nayab English Grammar High School, Mirwah Gorchani') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
  );

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const teacherHash = await bcrypt.hash('Teacher@123', 12);

  const [users] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@nayabgrammar.edu.pk']);
  if (!users.length) {
    await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ('admin', 'admin@nayabgrammar.edu.pk', ?, 'admin', 1)`,
      [adminHash]
    );
    console.log('Created admin user');
  } else {
    await connection.query('UPDATE users SET password_hash = ?, is_active = 1 WHERE email = ?', [
      adminHash,
      'admin@nayabgrammar.edu.pk',
    ]);
  }

  let [teachers] = await connection.query('SELECT id FROM teachers ORDER BY id LIMIT 1');
  if (!teachers.length) {
    await connection.query(
      `INSERT INTO teachers (full_name, email, phone, subject_specialization, qualification, joining_date, is_active)
       VALUES ('Muhammad Aslam Shaikh', 'teacher@nayabgrammar.edu.pk', '03000000000', 'General', 'B.Ed', CURDATE(), 1)`
    );
    [teachers] = await connection.query('SELECT id FROM teachers ORDER BY id LIMIT 1');
  }
  const primaryTeacherId = teachers[0].id;

  const demoTeacherEmail = 'teacher@nayabgrammar.edu.pk';
  const [tUser] = await connection.query('SELECT id FROM users WHERE email = ?', [demoTeacherEmail]);
  if (!tUser.length) {
    const [ph] = await connection.query('SELECT phone FROM teachers WHERE id = ?', [primaryTeacherId]);
    await connection.query(
      `INSERT INTO users (username, email, phone, password_hash, role, teacher_id, is_active) VALUES ('teacher', ?, ?, ?, 'teacher', ?, 1)`,
      [demoTeacherEmail, ph[0]?.phone || null, teacherHash, primaryTeacherId]
    );
    console.log('Created demo teacher login');
  } else {
    await connection.query(
      'UPDATE users SET password_hash = ?, teacher_id = ?, is_active = 1 WHERE email = ?',
      [teacherHash, primaryTeacherId, demoTeacherEmail]
    );
  }

  const [allTeachers] = await connection.query('SELECT id FROM teachers WHERE is_active = 1 ORDER BY id');
  const [classRows] = await connection.query('SELECT id, name, section, class_teacher_id FROM classes WHERE is_active = 1');
  const sorted = sortClasses(classRows);

  if (sorted.length && allTeachers.length) {
    for (let i = 0; i < sorted.length; i += 1) {
      const teacherId = allTeachers[i % allTeachers.length].id;
      await connection.query('UPDATE classes SET class_teacher_id = ? WHERE id = ?', [teacherId, sorted[i].id]);
    }
    console.log(`Assigned class teachers for ${sorted.length} classes`);
  }

  const [demoTeacher] = await connection.query('SELECT teacher_id FROM users WHERE email = ?', ['teacher@nayabgrammar.edu.pk']);
  const demoTid = demoTeacher[0]?.teacher_id || primaryTeacherId;
  const demoClasses = sorted.filter((_, i) => allTeachers[i % allTeachers.length]?.id === demoTid);
  if (!demoClasses.length && sorted[0]) {
    await connection.query('UPDATE classes SET class_teacher_id = ? WHERE id = ?', [demoTid, sorted[0].id]);
    console.log('Assigned at least one class to demo teacher login');
  }

  const [allStaff] = await connection.query(
    'SELECT id, phone, email, full_name FROM teachers WHERE is_active = 1 ORDER BY id'
  );
  for (const t of allStaff) {
    const phone = (t.phone || '').replace(/\s/g, '') || null;
    const email = t.email || (phone ? `${phone}@teacher.nayab.local` : `t${t.id}@teacher.nayab.local`);
    const [existing] = await connection.query('SELECT id FROM users WHERE teacher_id = ?', [t.id]);
    if (!existing.length) {
      await connection.query(
        `INSERT INTO users (username, email, phone, password_hash, role, teacher_id, is_active)
         VALUES (?, ?, ?, ?, 'teacher', ?, 1)`,
        [`t${t.id}`, email, phone, teacherHash, t.id]
      );
    } else {
      await connection.query(
        'UPDATE users SET email = ?, phone = ?, password_hash = ?, is_active = 1 WHERE teacher_id = ?',
        [email, phone, teacherHash, t.id]
      );
    }
  }
  console.log(`Synced ${allStaff.length} staff login accounts (Teacher@123)`);

  const [[{ activeStudents }]] = await connection.query('SELECT COUNT(*) AS activeStudents FROM students WHERE is_active = 1');
  console.log(`Active students in database: ${activeStudents}`);
  console.log('Staff passwords: Admin@123 / Teacher@123');
  await connection.end();

  const { spawnSync } = require('child_process');
  spawnSync(process.execPath, [path.join(__dirname, 'seed-demo-attendance.js')], { stdio: 'inherit', cwd: __dirname });
  spawnSync(process.execPath, [path.join(__dirname, 'seed-weekly-remarks.js')], { stdio: 'inherit', cwd: __dirname });

  console.log('ensure-runtime OK');
}

main().catch((e) => {
  console.error('ensure-runtime FAILED:', e.message);
  console.error('Start MySQL first (start-mysql.bat or RUN-WEBSITE.bat)');
  process.exit(1);
});
