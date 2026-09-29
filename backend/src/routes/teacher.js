const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');
const resultController = require('../controllers/resultController');
const weeklyRemarkController = require('../controllers/weeklyRemarkController');
const pool = require('../config/db');

const router = express.Router();
router.use(verifyToken, authorize('teacher', 'admin'));

async function getTeacherClasses(req) {
  let query = `SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = 1) AS student_count
               FROM classes c WHERE c.is_active = 1`;
  const params = [];
  if (req.user.role === 'teacher' && req.user.teacherId) {
    query += ' AND c.class_teacher_id = ?';
    params.push(req.user.teacherId);
  }
  query += ' ORDER BY c.name, c.section';
  const [classes] = await pool.query(query, params);
  return classes;
}

async function verifyTeacherClassAccess(req, res, next) {
  if (req.user.role === 'admin') return next();
  const classId = req.params.classId || req.body.classId;
  if (!classId) return next();
  const [rows] = await pool.query(
    'SELECT id FROM classes WHERE id = ? AND class_teacher_id = ? AND is_active = 1',
    [classId, req.user.teacherId]
  );
  if (!rows.length) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this class.' });
  }
  next();
}

router.get('/dashboard', async (req, res, next) => {
  try {
    const classes = await getTeacherClasses(req);
    res.json({ success: true, data: { classes } });
  } catch (err) {
    next(err);
  }
});

router.get('/classes', async (req, res, next) => {
  try {
    const classes = await getTeacherClasses(req);
    res.json({ success: true, data: classes });
  } catch (err) {
    next(err);
  }
});

router.get('/students/:classId', verifyTeacherClassAccess, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, student_id, roll_number, full_name, father_name, gender, photo
       FROM students WHERE class_id = ? AND is_active = 1 ORDER BY roll_number`,
      [req.params.classId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/attendance', verifyTeacherClassAccess, attendanceController.markAttendance);
router.get('/attendance/:classId', verifyTeacherClassAccess, attendanceController.getByClass);

router.get('/results/subjects', resultController.getSubjects);
router.get('/results/exams', resultController.getExams);
router.post('/results', resultController.create);
router.put('/results/:id', resultController.update);
router.get('/weekly-remarks', weeklyRemarkController.listRemarks);
router.post('/weekly-remarks', weeklyRemarkController.saveRemark);

module.exports = router;
