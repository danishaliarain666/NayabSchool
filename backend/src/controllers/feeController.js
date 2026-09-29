const pool = require('../config/db');
const { sortClasses } = require('../utils/classOrder');

exports.getAll = async (req, res, next) => {
  try {
    const { status, classId, page = 1, byClass = '0' } = req.query;
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

    let where = 's.is_active = 1';
    const params = [];
    if (status) { where += ' AND f.status = ?'; params.push(status); }
    if (effectiveClassId) { where += ' AND s.class_id = ?'; params.push(effectiveClassId); }

    const [rows] = await pool.query(
      `SELECT f.*, s.full_name, s.student_id, s.roll_number,
              CONCAT(c.name, ' - ', c.section) AS class_name
       FROM fees f JOIN students s ON f.student_id = s.id
       JOIN classes c ON s.class_id = c.id WHERE ${where}
       ORDER BY c.name, c.section, s.roll_number, f.due_date DESC`,
      params
    );
    res.json({
      success: true,
      data: rows,
      pagination: paginationMeta.byClass ? paginationMeta : { byClass: false },
    });
  } catch (err) {
    next(err);
  }
};

exports.exportPrintPdf = async (req, res, next) => {
  try {
    const { status, classId, scope = 'class' } = req.query;
    let where = 's.is_active = 1';
    const params = [];
    if (status) { where += ' AND f.status = ?'; params.push(status); }
    if (scope === 'class' && classId) {
      where += ' AND s.class_id = ?';
      params.push(classId);
    }

    const [rows] = await pool.query(
      `SELECT s.student_id, s.roll_number, s.full_name,
              CONCAT(c.name, ' - ', c.section) AS class_name,
              f.fee_type, f.amount, f.paid_amount, f.status, f.due_date
       FROM fees f JOIN students s ON f.student_id = s.id
       JOIN classes c ON s.class_id = c.id WHERE ${where}
       ORDER BY c.name, s.roll_number`,
      params
    );

    const { createListPdf } = require('../utils/listPdf');
    const statusLabel = status ? status.toUpperCase() : 'ALL';
    const title = `Fee Report (${statusLabel})${classId && rows[0] ? ` — ${rows[0].class_name}` : scope === 'all' ? ' — All Classes' : ''}`;
    const cols = ['G.R No.', 'Roll', 'Student', 'Class', 'Type', 'Amount', 'Paid', 'Status', 'Due'];
    const dataRows = rows.map((r) => [
      r.student_id,
      r.roll_number,
      r.full_name,
      r.class_name,
      r.fee_type,
      r.amount,
      r.paid_amount,
      r.status,
      r.due_date ? String(r.due_date).split('T')[0] : '—',
    ]);
    createListPdf(res, `fees-${status || 'all'}.pdf`, title, cols, dataRows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { student_id, fee_type, amount, due_date, academic_year, status, paid_amount, paid_date } = req.body;
    const [result] = await pool.query(
      `INSERT INTO fees (student_id, fee_type, amount, due_date, academic_year, status, paid_amount, paid_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, fee_type || 'Monthly Fee', amount, due_date, academic_year || '2025-2026',
        status || 'pending', paid_amount || 0, paid_date || null]
    );
    if (status === 'paid') {
      await pool.query('UPDATE students SET fee_status = ? WHERE id = ?', ['paid', student_id]);
    }
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { amount, paid_amount, status, due_date, paid_date, remarks } = req.body;
    await pool.query(
      'UPDATE fees SET amount=?, paid_amount=?, status=?, due_date=?, paid_date=?, remarks=? WHERE id=?',
      [amount, paid_amount, status, due_date, paid_date, remarks, req.params.id]
    );
    const [[fee]] = await pool.query('SELECT student_id, status FROM fees WHERE id = ?', [req.params.id]);
    if (fee) await pool.query('UPDATE students SET fee_status = ? WHERE id = ?', [fee.status, fee.student_id]);
    res.json({ success: true, message: 'Fee updated.' });
  } catch (err) {
    next(err);
  }
};

exports.patchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['paid', 'unpaid', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const [[fee]] = await pool.query('SELECT amount, paid_amount, student_id FROM fees WHERE id = ?', [req.params.id]);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found.' });
    const newPaid = status === 'paid' ? fee.amount : status === 'unpaid' ? 0 : fee.paid_amount;
    const paid_date = status === 'paid' ? new Date().toISOString().split('T')[0] : null;
    await pool.query('UPDATE fees SET status = ?, paid_amount = ?, paid_date = ? WHERE id = ?', [
      status,
      newPaid,
      paid_date,
      req.params.id,
    ]);
    await pool.query('UPDATE students SET fee_status = ? WHERE id = ?', [status === 'pending' ? 'pending' : status, fee.student_id]);
    res.json({ success: true, message: 'Fee status updated.' });
  } catch (err) {
    next(err);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const [summary] = await pool.query(`
      SELECT status, COUNT(*) AS count, SUM(amount) AS total, SUM(paid_amount) AS paid,
             SUM(amount - paid_amount) AS outstanding FROM fees GROUP BY status
    `);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
