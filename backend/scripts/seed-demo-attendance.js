/**
 * Sample attendance for demo (last 14 school days, ~10% absent, staff mostly present).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { schoolDaysList, fmt } = require('../src/utils/schoolDays');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
  });

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 20);
  const days = await schoolDaysList(fmt(from), fmt(to));
  if (!days.length) {
    console.log('No school days in range (all holidays?)');
    await conn.end();
    return;
  }

  const [students] = await conn.query(
    'SELECT id, class_id, roll_number FROM students WHERE is_active = 1 ORDER BY class_id, roll_number LIMIT 200'
  );
  const [teachers] = await conn.query('SELECT id FROM teachers WHERE is_active = 1');

  let att = 0;
  for (const day of days.slice(-14)) {
    for (const s of students) {
      if (s.roll_number % 9 === 0) {
        await conn.query('DELETE FROM attendance WHERE student_id = ? AND date = ?', [s.id, day]).catch(() => {});
        await conn.query(
          'INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, 1)',
          [s.id, s.class_id, day, 'absent']
        ).catch(() => {});
        att++;
      }
    }
    for (const t of teachers) {
      let st = 'present';
      if (t.id % 13 === 0) st = 'absent';
      else if (t.id % 11 === 0) st = 'leave';
      else if (t.id % 7 === 0) st = 'half_day';
      await conn.query(
        `INSERT INTO staff_attendance (teacher_id, attendance_date, status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [t.id, day, st]
      ).catch(() => {});
    }
  }

  console.log(`Demo attendance seeded (~${att} student absent marks, ${teachers.length} staff × ${Math.min(14, days.length)} days)`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
