const pool = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students WHERE is_active = 1) AS totalStudents,
        (SELECT COUNT(*) FROM teachers WHERE is_active = 1) AS totalTeachers,
        (SELECT COUNT(*) FROM classes WHERE is_active = 1) AS totalClasses,
        (SELECT COUNT(*) FROM fees WHERE status = 'paid') AS feesPaid,
        (SELECT COUNT(*) FROM fees WHERE status = 'unpaid') AS feesUnpaid,
        (SELECT COUNT(*) FROM fees WHERE status = 'pending') AS feesPending
    `);

    const [feeChart] = await pool.query(`
      SELECT status, COUNT(*) AS count, SUM(amount) AS total
      FROM fees GROUP BY status
    `);

    let attendanceChartData = [];
    try {
      const [attendanceChart] = await pool.query(`
        SELECT DATE_FORMAT(att.date, '%Y-%m-%d') AS date,
               COUNT(DISTINCT att.student_id) AS absent
        FROM attendance att
        GROUP BY att.date
        ORDER BY att.date DESC
        LIMIT 7
      `);
      attendanceChartData = (attendanceChart || []).reverse();
    } catch {
      attendanceChartData = [];
    }

    const [classDistribution] = await pool.query(`
      SELECT CONCAT(c.name, ' - ', c.section) AS className, COUNT(s.id) AS count
      FROM classes c LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1
      WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.name
    `);

    res.json({ success: true, data: { stats, feeChart, attendanceChart: attendanceChartData, classDistribution } });
  } catch (err) {
    next(err);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
