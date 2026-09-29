/**
 * Netlify Database (Postgres) connection with a small mysql2-compatible layer.
 *
 * Controllers were written against mysql2 (`const [rows] = await pool.query(sql, params)`),
 * so this module keeps that interface and translates the MySQL dialect used in the app
 * (`?` placeholders, bulk `VALUES ?`, ON DUPLICATE KEY UPDATE, CURDATE(), insertId, …).
 */
const { getDatabase } = require('@netlify/database');

/** Unique keys used by upserts (ON DUPLICATE KEY UPDATE → ON CONFLICT). */
const CONFLICT_TARGETS = {
  school_settings: 'setting_key',
  website_content: 'page_key, section_key',
  results: 'student_id, subject_id, exam_id',
  student_weekly_remarks: 'student_id, subject_id, week_label',
  staff_attendance: 'teacher_id, attendance_date',
  school_holidays: 'holiday_date',
  attendance: 'student_id, date',
  subjects: 'name, class_id',
  classes: 'name, section, academic_year',
};

const INT8_OID = 20;

let db;
function getPool() {
  if (!db) db = getDatabase();
  return db.pool;
}

function normalizeParam(v) {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

/** Replace `?` placeholders (outside string literals) with $n, expanding array params like mysql2. */
function bindParams(sql, params = []) {
  const values = [];
  let out = '';
  let p = 0;
  let inStr = false;
  const push = (v) => {
    values.push(normalizeParam(v));
    return `$${values.length}`;
  };

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      inStr = !inStr;
      out += ch;
    } else if (ch === '?' && !inStr) {
      const v = params[p++];
      if (Array.isArray(v) && Array.isArray(v[0])) {
        out += v.map((row) => `(${row.map(push).join(', ')})`).join(', ');
      } else if (Array.isArray(v)) {
        out += v.length ? v.map(push).join(', ') : 'NULL';
      } else {
        out += push(v);
      }
    } else {
      out += ch;
    }
  }
  return { text: out, values };
}

function translateDialect(sql) {
  let text = sql
    .replace(/CURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/CAST\(([^)]+?) AS CHAR\)/gi, 'CAST($1 AS TEXT)')
    .replace(/\bLIKE\b/g, 'ILIKE')
    // Postgres folds unquoted identifiers to lowercase; keep camelCase aliases intact
    .replace(/\bAS\s+([a-z][a-z_]*[A-Z]\w*)/g, 'AS "$1"');

  if (/^\s*INSERT\s+IGNORE\b/i.test(text)) {
    text = `${text.replace(/INSERT\s+IGNORE/i, 'INSERT')} ON CONFLICT DO NOTHING`;
  }

  const dup = text.match(/ON DUPLICATE KEY UPDATE/i);
  if (dup) {
    const table = (text.match(/INSERT\s+INTO\s+(\w+)/i) || [])[1];
    const target = CONFLICT_TARGETS[table];
    if (!target) throw new Error(`No conflict target configured for upsert on "${table}"`);
    text = text
      .replace(/ON DUPLICATE KEY UPDATE/i, `ON CONFLICT (${target}) DO UPDATE SET`)
      .replace(/VALUES\((\w+)\)/gi, 'EXCLUDED.$1')
      // bare column refs on the right side of COALESCE(…, col) point at the existing row
      .replace(/COALESCE\((EXCLUDED\.\w+),\s*(\w+)\)/gi, `COALESCE($1, ${table}.$2)`);
  }

  if (/^\s*INSERT\b/i.test(text) && !/\bRETURNING\b/i.test(text)) {
    text += ' RETURNING id';
  }
  return text;
}

function normalizeRows(result) {
  const bigintCols = (result.fields || []).filter((f) => f.dataTypeID === INT8_OID).map((f) => f.name);
  if (!bigintCols.length) return result.rows;
  return result.rows.map((row) => {
    for (const c of bigintCols) if (row[c] !== null && row[c] !== undefined) row[c] = Number(row[c]);
    return row;
  });
}

function mapError(err) {
  if (err && err.code === '23505') {
    err.pgCode = err.code;
    err.code = 'ER_DUP_ENTRY';
  }
  return err;
}

async function query(sql, params) {
  const { text, values } = bindParams(translateDialect(sql), params);
  let result;
  try {
    result = await getPool().query(text, values);
  } catch (err) {
    throw mapError(err);
  }
  const rows = normalizeRows(result);
  if (result.command === 'SELECT' || !/^(INSERT|UPDATE|DELETE)$/.test(result.command)) {
    return [rows, result.fields];
  }
  const header = {
    affectedRows: result.rowCount,
    insertId: rows[0]?.id ?? 0,
    rows,
  };
  return [header, result.fields];
}

module.exports = { query, execute: query };
