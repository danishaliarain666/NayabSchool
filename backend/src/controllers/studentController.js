const pool = require('../config/db');
const ExcelJS = require('exceljs');
const { sortClasses } = require('../utils/classOrder');

function buildStudentWhere(record, search, classId) {
  let where = 'WHERE 1=1';
  const params = [];

  if (record === 'active') {
    where += ' AND s.is_active = 1';
  } else if (record === 'inactive') {
    where += ' AND s.is_active = 0';
  } else if (record === 'slc') {
    where += ' AND s.is_active = 0 AND EXISTS (SELECT 1 FROM student_leaving_certificates slc WHERE slc.student_id = s.id)';
  } else if (record === 'all') {
    /* no is_active filter */
  } else {
    where += ' AND s.is_active = 1';
  }

  if (search) {
    where += ' AND (s.full_name LIKE ? OR s.student_id LIKE ? OR s.father_name LIKE ? OR CAST(s.roll_number AS CHAR) LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (classId) {
    where += ' AND s.class_id = ?';
    params.push(classId);
  }

  return { where, params };
}

exports.getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      classId = '',
      record = 'active',
      byClass = '0',
    } = req.query;

    let effectiveClassId = classId;
    let paginationMeta = {};

    if (byClass === '1' && !classId && !search) {
      const [classRows] = await pool.query(
        'SELECT id, name, section FROM classes WHERE is_active = 1'
      );
      const sorted = sortClasses(classRows);
      const pageIndex = Math.max(0, parseInt(page, 10) - 1);
      if (!sorted.length || pageIndex >= sorted.length) {
        return res.json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: sorted.length, byClass: true, currentClass: null },
        });
      }
      effectiveClassId = String(sorted[pageIndex].id);
      paginationMeta = {
        byClass: true,
        currentClass: sorted[pageIndex],
        totalPages: sorted.length,
        page: parseInt(page),
      };
    }

    const offset = (page - 1) * limit;
    const { where, params } = buildStudentWhere(record, search, effectiveClassId);

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM students s ${where}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name,
              (SELECT COUNT(*) FROM student_leaving_certificates slc WHERE slc.student_id = s.id) AS has_slc
       FROM students s JOIN classes c ON s.class_id = c.id
       ${where}
       ORDER BY c.name, s.roll_number ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), paginationMeta.byClass ? 0 : parseInt(offset, 10)]
    );

    const totalPages = paginationMeta.byClass
      ? paginationMeta.totalPages
      : Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: paginationMeta.byClass ? paginationMeta.page : parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages,
        byClass: !!paginationMeta.byClass,
        currentClass: paginationMeta.currentClass || null,
        record,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name
       FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      student_id, roll_number, full_name, father_name, gender,
      date_of_birth, class_id, section, address, phone,
      admission_date, fee_status,
    } = req.body;

    const photo = req.file ? `/uploads/students/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO students (student_id, roll_number, full_name, father_name, gender,
       date_of_birth, class_id, section, address, phone, admission_date, fee_status, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, roll_number, full_name, father_name, gender, date_of_birth,
        class_id, section || 'A', address, phone, admission_date, fee_status || 'pending', photo]
    );

    res.status(201).json({ success: true, message: 'Student added successfully.', data: { id: result.insertId } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Student ID or roll number already exists in this class.' });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['student_id', 'roll_number', 'full_name', 'father_name', 'gender',
      'date_of_birth', 'class_id', 'section', 'address', 'phone', 'admission_date', 'fee_status'];
    const updates = [];
    const values = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });

    if (req.file) {
      updates.push('photo = ?');
      values.push(`/uploads/students/${req.file.filename}`);
    }

    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });

    values.push(id);
    await pool.query(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('UPDATE students SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.promoteClass = async (req, res, next) => {
  try {
    const { classId, onlyPassed } = req.body;
    if (!classId) return res.status(400).json({ success: false, message: 'classId required.' });

    const [clsRows] = await pool.query('SELECT * FROM classes WHERE id = ?', [classId]);
    if (!clsRows.length) return res.status(404).json({ success: false, message: 'Class not found.' });
    const cls = clsRows[0];

    const nextName = cls.name.replace(/(\d+)/, (_, n) => String(parseInt(n, 10) + 1));
    const [nextClsRows] = await pool.query(
      'SELECT id FROM classes WHERE name = ? AND section = ? AND academic_year = ? AND is_active = 1',
      [nextName, cls.section, cls.academic_year]
    );
    if (!nextClsRows.length) {
      return res.status(400).json({ success: false, message: `Next class "${nextName}" not found. Create it first.` });
    }
    const nextCls = nextClsRows[0];

    const [students] = await pool.query(
      'SELECT id, roll_number FROM students WHERE class_id = ? AND is_active = 1 ORDER BY roll_number',
      [classId]
    );

    let promoted = 0;
    for (const st of students) {
      if (onlyPassed) {
        const [resRows] = await pool.query(
          'SELECT AVG(percentage) AS avg_pct FROM results WHERE student_id = ?',
          [st.id]
        );
        const avg = parseFloat(resRows[0]?.avg_pct || 0);
        if (avg < 33) continue;
      }
      await pool.query('UPDATE students SET class_id = ?, roll_number = ? WHERE id = ?', [nextCls.id, st.roll_number, st.id]);
      promoted++;
    }

    res.json({
      success: true,
      message: `${promoted} students promoted from ${cls.name} to ${nextName}.`,
      data: { promoted, nextClassId: nextCls.id, nextClassName: nextName },
    });
  } catch (err) {
    next(err);
  }
};

/** Generate leaving certificate PDF */
exports.leavingCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, character, attendance, fee, extra } = req.query;

    const [rows] = await pool.query(
      `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name FROM students s
       JOIN classes c ON s.class_id = c.id WHERE s.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    const student = rows[0];

    const remarks = { character, attendance, fee, extra };
    const certNo = `SLC-${student.student_id}-${Date.now().toString(36).toUpperCase()}`;
    const reasonText = reason || 'Leaving school';
    const remarksNote = [character, attendance, fee, extra].filter(Boolean).join('; ');

    await pool.query(
      'INSERT INTO student_leaving_certificates (student_id, certificate_no, reason, issued_date, issued_by) VALUES (?, ?, ?, CURDATE(), ?)',
      [student.id, certNo, `${reasonText}${remarksNote ? ` | ${remarksNote}` : ''}`, req.user.userId]
    ).catch(() => {});

    await pool.query('UPDATE students SET is_active = 0 WHERE id = ?', [id]);

    const { createResultPdfStream, renderLeavingCertificate } = require('../utils/leavingCertificatePdf');
    const doc = createResultPdfStream(res, `leaving-${student.student_id}.pdf`);
    await renderLeavingCertificate(doc, pool, student, reasonText, certNo, remarks);
    doc.end();
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    if (!String(q).trim() || String(q).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }
    const s = `%${q.trim()}%`;
    const [rows] = await pool.query(
      `SELECT s.id, s.student_id, s.roll_number, s.full_name, s.is_active,
              CONCAT(c.name, ' - ', c.section) AS class_name
       FROM students s JOIN classes c ON s.class_id = c.id
       WHERE s.full_name LIKE ? OR s.student_id LIKE ? OR s.father_name LIKE ? OR CAST(s.roll_number AS CHAR) LIKE ?
       ORDER BY s.is_active DESC, c.name, s.roll_number LIMIT 40`,
      [s, s, s, s]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.exportDataPdf = async (req, res, next) => {
  try {
    const { classId, search, includeContact = '1', includeFee = '1', record = 'active' } = req.query;
    const { where, params } = buildStudentWhere(record, search || '', classId || '');
    const [rows] = await pool.query(
      `SELECT s.student_id, s.roll_number, s.full_name, s.father_name,
              CONCAT(c.name, ' - ', c.section) AS class_name, s.phone, s.address, s.fee_status
       FROM students s JOIN classes c ON s.class_id = c.id ${where}
       ORDER BY c.name, s.roll_number`,
      params
    );

    const { createListPdf } = require('../utils/listPdf');
    const cols = ['G.R No.', 'Roll', 'Name', 'Father', 'Class'];
    if (includeContact === '1') cols.push('Phone', 'Address');
    if (includeFee === '1') cols.push('Fee Status');

    const dataRows = rows.map((r) => {
      const base = [r.student_id, r.roll_number, r.full_name, r.father_name, r.class_name];
      if (includeContact === '1') base.push(r.phone || '—', r.address || '—');
      if (includeFee === '1') base.push(r.fee_status || '—');
      return base;
    });

    const title = classId
      ? `Student Data — ${rows[0]?.class_name || 'Class'}`
      : 'Student Data — All / Filtered';
    createListPdf(res, 'student-data.pdf', title, cols, dataRows);
  } catch (err) {
    next(err);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const { record = 'active' } = req.query;
    const { where, params } = buildStudentWhere(record, '', '');
    const [rows] = await pool.query(
      `SELECT s.student_id, s.roll_number, s.full_name, s.father_name, s.gender,
              s.date_of_birth, CONCAT(c.name, ' - ', c.section) AS class_name,
              s.phone, s.admission_date, s.fee_status, s.is_active
       FROM students s JOIN classes c ON s.class_id = c.id ${where}
       ORDER BY c.name, s.roll_number`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');
    sheet.columns = [
      { header: 'Student ID', key: 'student_id', width: 18 },
      { header: 'Roll No', key: 'roll_number', width: 10 },
      { header: 'Name', key: 'full_name', width: 25 },
      { header: 'Father Name', key: 'father_name', width: 25 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'DOB', key: 'date_of_birth', width: 14 },
      { header: 'Class', key: 'class_name', width: 18 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Admission', key: 'admission_date', width: 14 },
      { header: 'Fee Status', key: 'fee_status', width: 12 },
      { header: 'Active', key: 'is_active', width: 8 },
    ];
    rows.forEach((r) => sheet.addRow(r));
    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
