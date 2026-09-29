require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const port = parseInt(process.env.DB_PORT, 10) || 3307;
  const c = await mysql.createConnection({
    host: 'localhost',
    port,
    user: 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'nayab_sms',
  });
  const [teachers] = await c.query('SELECT id, email FROM users WHERE role="teacher" LIMIT 5');
  console.log('teacher users', teachers);
  const [s] = await c.query('SELECT class_id, roll_number, full_name FROM students WHERE is_active=1 LIMIT 1');
  console.log('sample student', s[0]);
  await c.end();
}

main();
