const pool = require('../config/db');

exports.listByClass = async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'classId required' });
    const [rows] = await pool.query(
      'SELECT * FROM subjects WHERE class_id = ? AND is_active = 1 ORDER BY name',
      [classId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, class_id, max_marks = 100 } = req.body;
    const [r] = await pool.query(
      'INSERT INTO subjects (name, class_id, max_marks) VALUES (?, ?, ?)',
      [name, class_id, max_marks]
    );
    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, max_marks } = req.body;
    await pool.query('UPDATE subjects SET name = ?, max_marks = ? WHERE id = ?', [name, max_marks, req.params.id]);
    res.json({ success: true, message: 'Subject updated.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('UPDATE subjects SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Subject removed.' });
  } catch (err) {
    next(err);
  }
};
