const pool = require('../config/db');

const REMARKS = ['Work Hard', 'Satisfactory', 'Excellent', 'Super Excellent'];

exports.listRemarks = async (req, res, next) => {
  try {
    const { classId, studentId } = req.query;
    let where = '1=1';
    const params = [];
    if (studentId) {
      where += ' AND wr.student_id = ?';
      params.push(studentId);
    } else if (classId) {
      where += ' AND s.class_id = ?';
      params.push(classId);
    }
    const [rows] = await pool.query(
      `SELECT wr.*, sub.name AS subject_name, s.full_name, s.roll_number
       FROM student_weekly_remarks wr
       JOIN students s ON wr.student_id = s.id
       JOIN subjects sub ON wr.subject_id = sub.id
       WHERE ${where} ORDER BY s.roll_number, sub.name`,
      params
    );
    res.json({ success: true, data: rows, options: REMARKS });
  } catch (err) {
    next(err);
  }
};

exports.saveRemark = async (req, res, next) => {
  try {
    const { student_id, subject_id, remark, week_label = 'Weekly' } = req.body;
    if (!REMARKS.includes(remark)) {
      return res.status(400).json({ success: false, message: 'Invalid remark option.' });
    }
    await pool.query(
      `INSERT INTO student_weekly_remarks (student_id, subject_id, week_label, remark, entered_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE remark = VALUES(remark), entered_by = VALUES(entered_by)`,
      [student_id, subject_id, week_label, remark, req.user.userId]
    );
    res.json({ success: true, message: 'Weekly remark saved.' });
  } catch (err) {
    next(err);
  }
};

exports.getRemarksForStudent = async (pool, studentId) => {
  const [rows] = await pool.query(
    `SELECT sub.name AS subject_name, wr.remark
     FROM student_weekly_remarks wr
     JOIN subjects sub ON wr.subject_id = sub.id
     WHERE wr.student_id = ? ORDER BY sub.name`,
    [studentId]
  );
  return rows;
};

exports.REMARKS = REMARKS;
