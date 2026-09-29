/** Reset all staff logins: Teacher@123, sync phone from teachers table */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
    multipleStatements: true,
  });

  const mig4 = fs.readFileSync(path.join(__dirname, '../database/migrations/004_teacher_payroll.sql'), 'utf8');
  for (const stmt of mig4.split(';').map((s) => s.trim()).filter(Boolean)) {
    await conn.query(stmt).catch(() => {});
  }

  const hash = await bcrypt.hash('Teacher@123', 12);
  const adminHash = await bcrypt.hash('Admin@123', 12);

  await conn.query('UPDATE users SET password_hash = ?, is_active = 1 WHERE email = ?', [
    adminHash,
    'admin@nayabgrammar.edu.pk',
  ]);

  const [staff] = await conn.query('SELECT id, phone, email, full_name FROM teachers WHERE is_active = 1');
  for (const t of staff) {
    const phone = t.phone ? String(t.phone).replace(/\s/g, '') : null;
    const email = t.email || (phone ? `${phone}@teacher.nayab.local` : `t${t.id}@teacher.nayab.local`);
    const [u] = await conn.query('SELECT id FROM users WHERE teacher_id = ?', [t.id]);
    if (!u.length) {
      await conn.query(
        `INSERT INTO users (username, email, phone, password_hash, role, teacher_id, is_active) VALUES (?,?,?,?, 'teacher', ?, 1)`,
        [`t${t.id}`, email, phone, hash, t.id]
      );
    } else {
      await conn.query('UPDATE users SET email=?, phone=?, password_hash=?, is_active=1 WHERE teacher_id=?', [
        email,
        phone,
        hash,
        t.id,
      ]);
    }
  }

  const demoEmail = 'teacher@nayabgrammar.edu.pk';
  const [demo] = await conn.query('SELECT id FROM users WHERE email = ?', [demoEmail]);
  const primaryTeacherId = staff[0]?.id;
  if (!demo.length && primaryTeacherId) {
    await conn.query(
      `INSERT INTO users (username, email, phone, password_hash, role, teacher_id, is_active)
       VALUES ('teacher', ?, (SELECT phone FROM teachers WHERE id = ? LIMIT 1), ?, 'teacher', ?, 1)`,
      [demoEmail, primaryTeacherId, hash, primaryTeacherId]
    );
  } else if (demo.length) {
    await conn.query('UPDATE users SET password_hash=?, is_active=1 WHERE email=?', [hash, demoEmail]);
  }

  console.log(`Fixed ${staff.length} staff + admin.`);
  console.log('Login: teacher@nayabgrammar.edu.pk OR 03100000004 — password Teacher@123');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
