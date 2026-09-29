const pool = require('../config/db');

exports.getContactMessages = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.markContactRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.getAdmissionApplications = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM admission_applications ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.updateAdmissionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE admission_applications SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    next(err);
  }
};
