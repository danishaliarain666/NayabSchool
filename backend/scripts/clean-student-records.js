/**
 * Clean duplicate / messy student records in DB.
 * Run: node scripts/clean-student-records.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { splitNameFather, cleanNameRaw, extractGrNumber, normalizeStudentId } = require('../src/utils/nameParser');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
  });

  const [students] = await conn.query(
    `SELECT s.*, c.name AS class_name FROM students s JOIN classes c ON s.class_id = c.id ORDER BY s.id`
  );

  const byGr = new Map();
  for (const st of students) {
    const gr = extractGrNumber(st.student_id) || extractGrNumber(st.grNo) || String(st.roll_number);
    if (!gr) continue;
    if (!byGr.has(gr)) byGr.set(gr, []);
    byGr.get(gr).push(st);
  }

  let deactivated = 0;
  let cleaned = 0;

  for (const [gr, group] of byGr.entries()) {
    if (group.length > 1) {
      group.sort((a, b) => {
        const active = (b.is_active - a.is_active);
        if (active !== 0) return active;
        return a.full_name.split(' ').length - b.full_name.split(' ').length;
      });
      const keep = group[0];
      for (let i = 1; i < group.length; i++) {
        await conn.query('UPDATE students SET is_active = 0 WHERE id = ?', [group[i].id]);
        deactivated++;
      }
      group.length = 1;
      group[0] = keep;
    }

    const st = group[0];
    let fullName = cleanNameRaw(st.full_name);
    let fatherName = cleanNameRaw(st.father_name);
    const fixed = splitNameFather(fullName) || splitNameFather(`${fullName} ${fatherName}`);
    if (fixed) {
      fullName = fixed.fullName;
      fatherName = fixed.fatherName;
    } else if (fullName.split(' ').length > 4) {
      const fixed2 = splitNameFather(fullName);
      if (fixed2) {
        fullName = fixed2.fullName;
        if (fatherName === 'N/A' || fatherName.split(' ').length > 4) fatherName = fixed2.fatherName;
      }
    }

    const sid = normalizeStudentId(gr);
    await conn.query(
      'UPDATE students SET student_id = ?, full_name = ?, father_name = ?, is_active = 1 WHERE id = ?',
      [sid, fullName.slice(0, 80), fatherName.slice(0, 80), st.id]
    );
    cleaned++;
  }

  await conn.end();
  console.log(`✅ Cleaned ${cleaned} unique GR records, deactivated ${deactivated} duplicates.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
