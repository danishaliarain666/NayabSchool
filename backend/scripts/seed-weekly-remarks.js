/** Dummy subject-wise weekly remarks for active students */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const REMARKS = ['Work Hard', 'Satisfactory', 'Excellent', 'Super Excellent'];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS student_weekly_remarks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      subject_id INT NOT NULL,
      week_label VARCHAR(40) NOT NULL DEFAULT 'Weekly',
      remark VARCHAR(40) NOT NULL,
      entered_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_weekly_remark (student_id, subject_id, week_label)
    )
  `);

  const [students] = await conn.query(
    'SELECT id, class_id, roll_number FROM students WHERE is_active = 1 LIMIT 400'
  );

  let n = 0;
  for (const s of students) {
    const [subjects] = await conn.query(
      'SELECT id, name FROM subjects WHERE class_id = ? AND is_active = 1 ORDER BY name LIMIT 12',
      [s.class_id]
    );
    if (!subjects.length) continue;
    for (let i = 0; i < subjects.length; i++) {
      const remark = REMARKS[(s.roll_number + i) % REMARKS.length];
      await conn.query(
        `INSERT INTO student_weekly_remarks (student_id, subject_id, week_label, remark)
         VALUES (?, ?, 'This Week', ?)
         ON DUPLICATE KEY UPDATE remark = VALUES(remark)`,
        [s.id, subjects[i].id, remark]
      );
      n++;
    }
  }

  console.log(`Seeded ${n} weekly remark rows for ${students.length} students`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
