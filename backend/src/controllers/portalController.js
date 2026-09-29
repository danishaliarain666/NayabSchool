const pool = require('../config/db');
const { calculateGrade, calculatePercentage } = require('../utils/gradeCalculator');

exports.lookup = async (req, res, next) => {
  try {
    const { classId, rollNumber } = req.query;
    if (!classId || rollNumber === undefined || rollNumber === '') {
      return res.status(400).json({ success: false, message: 'Class and roll number are required.' });
    }

    const roll = parseInt(String(rollNumber).trim(), 10);
    if (!Number.isFinite(roll) || roll < 1) {
      return res.status(400).json({ success: false, message: 'Enter a valid roll number.' });
    }

    let [students] = await pool.query(
      `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name
       FROM students s JOIN classes c ON s.class_id = c.id
       WHERE s.class_id = ? AND s.roll_number = ? AND s.is_active = 1`,
      [classId, roll]
    );

    if (!students.length) {
      [students] = await pool.query(
        `SELECT s.*, CONCAT(c.name, ' - ', c.section) AS class_name
         FROM students s JOIN classes c ON s.class_id = c.id
         WHERE s.class_id = ? AND CAST(s.roll_number AS CHAR) = ? AND s.is_active = 1`,
        [classId, String(roll)]
      );
    }

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Check class and roll number (use the roll shown on the student list).',
      });
    }

    const student = students[0];

    const { schoolDaysList, fmt } = require('../utils/schoolDays');
    const toD = new Date();
    const fromD = new Date();
    fromD.setDate(fromD.getDate() - 29);
    const schoolDays = await schoolDaysList(fmt(fromD), fmt(toD));
    const totalDays = schoolDays.length;
    let absent = 0;
    let absentRecords = [];
    if (schoolDays.length) {
      const ph = schoolDays.map(() => '?').join(',');
      const [abs] = await pool.query(
        `SELECT date FROM attendance WHERE student_id = ? AND date IN (${ph}) ORDER BY date DESC`,
        [student.id, ...schoolDays]
      );
      absentRecords = abs;
      absent = abs.length;
    }
    const present = Math.max(0, totalDays - absent);

    const [results] = await pool.query(
      `SELECT r.marks_obtained, r.max_marks, r.percentage, r.grade, sub.name AS subject_name, e.name AS exam_name, e.id AS exam_id
       FROM results r JOIN subjects sub ON r.subject_id = sub.id JOIN exams e ON r.exam_id = e.id
       WHERE r.student_id = ? ORDER BY e.name, sub.name`,
      [student.id]
    );

    const [fees] = await pool.query(
      'SELECT fee_type, amount, paid_amount, status, due_date, paid_date FROM fees WHERE student_id = ? ORDER BY due_date DESC',
      [student.id]
    );

    const [announcements] = await pool.query(
      `SELECT title, content, type, publish_date FROM announcements
       WHERE is_published = 1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())
       ORDER BY publish_date DESC LIMIT 5`
    );

    const { getRemarksForStudent } = require('./weeklyRemarkController');
    const weeklyRemarks = await getRemarksForStudent(pool, student.id);

    res.json({
      success: true,
      data: {
        student,
        attendance: {
          totalDays,
          present,
          absent,
          percentage: calculatePercentage(present, totalDays),
          records: absentRecords.map((r) => ({ date: r.date, status: 'absent' })),
        },
        results,
        fees: { status: student.fee_status, records: fees },
        weeklyRemarks,
        announcements,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, section, CONCAT(name, " - ", section) AS label FROM classes WHERE is_active = 1 ORDER BY name, section'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getResultPdf = async (req, res, next) => {
  try {
    const { studentId, examId, classId, rollNumber } = req.query;

    if (!studentId && classId && rollNumber) {
      const [students] = await pool.query(
        'SELECT id FROM students WHERE class_id = ? AND roll_number = ? AND is_active = 1',
        [classId, rollNumber]
      );
      if (!students.length) return res.status(404).json({ success: false, message: 'Student not found.' });
      req.query.studentId = students[0].id;
    }

    if (!req.query.studentId || !examId) {
      return res.status(400).json({ success: false, message: 'studentId and examId are required.' });
    }

    const resultController = require('./resultController');
    return resultController.exportPDF(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports.calculateGrade = calculateGrade;
