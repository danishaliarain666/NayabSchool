const pool = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY publish_date DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getPublic = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, content, type, publish_date FROM announcements
       WHERE is_published = 1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())
       ORDER BY publish_date DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, content, type, is_published, publish_date, expiry_date } = req.body;
    const [result] = await pool.query(
      `INSERT INTO announcements (title, content, type, is_published, publish_date, expiry_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, content, type || 'general', is_published !== undefined ? is_published : 1,
        publish_date || new Date().toISOString().split('T')[0], expiry_date || null, req.user.userId]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { title, content, type, is_published, publish_date, expiry_date } = req.body;
    await pool.query(
      `UPDATE announcements SET title=?, content=?, type=?, is_published=?, publish_date=?, expiry_date=? WHERE id=?`,
      [title, content, type, is_published, publish_date, expiry_date, req.params.id]
    );
    res.json({ success: true, message: 'Announcement updated.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
};
