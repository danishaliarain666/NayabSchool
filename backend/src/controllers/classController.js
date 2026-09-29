const pool = require('../config/db');
const { sortClasses } = require('../utils/classOrder');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, t.full_name AS class_teacher_name,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = 1) AS student_count
       FROM classes c LEFT JOIN teachers t ON c.class_teacher_id = t.id
       WHERE c.is_active = 1`
    );
    sortClasses(rows);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

async function checkTeacherConflict(classTeacherId, academicYear, excludeClassId = null) {
  if (!classTeacherId) return null;
  let sql = `SELECT c.id, c.name, c.section FROM classes c
    WHERE c.class_teacher_id = ? AND c.academic_year = ? AND c.is_active = 1`;
  const params = [classTeacherId, academicYear || '2025-2026'];
  if (excludeClassId) { sql += ' AND c.id != ?'; params.push(excludeClassId); }
  const [rows] = await pool.query(sql, params);
  return rows.length ? rows[0] : null;
}

exports.create = async (req, res, next) => {
  try {
    const { name, section, academic_year, class_teacher_id, capacity } = req.body;
    const conflict = await checkTeacherConflict(class_teacher_id, academic_year);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `This teacher is already assigned as class teacher of ${conflict.name} - ${conflict.section}. One teacher cannot be class teacher of two classes at the same time.`,
        data: { conflict },
      });
    }
    const [result] = await pool.query(
      'INSERT INTO classes (name, section, academic_year, class_teacher_id, capacity) VALUES (?, ?, ?, ?, ?)',
      [name, section || 'A', academic_year || '2025-2026', class_teacher_id || null, capacity || 40]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, section, academic_year, class_teacher_id, capacity } = req.body;
    const conflict = await checkTeacherConflict(class_teacher_id, academic_year, req.params.id);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `This teacher is already assigned as class teacher of ${conflict.name} - ${conflict.section}. One teacher cannot be class teacher of two classes at the same time.`,
        data: { conflict },
      });
    }
    await pool.query(
      'UPDATE classes SET name=?, section=?, academic_year=?, class_teacher_id=?, capacity=? WHERE id=?',
      [name, section, academic_year, class_teacher_id, capacity, req.params.id]
    );
    res.json({ success: true, message: 'Class updated.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('UPDATE classes SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Class deleted.' });
  } catch (err) {
    next(err);
  }
};
