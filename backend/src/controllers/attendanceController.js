const pool = require('../config/db');
const { isHoliday, isSunday, schoolDaysList } = require('../utils/schoolDays');
const { createListPdf } = require('../utils/listPdf');

exports.markAttendance = async (req, res, next) => {
  try {
    const { classId, date, absentStudentIds = [] } = req.body;
    const markedBy = req.user.userId;

    if (!classId || !date) {
      return res.status(400).json({ success: false, message: 'Class and date are required.' });
    }
    if (await isHoliday(date)) {
      return res.status(400).json({ success: false, message: 'This date is a holiday — attendance is not recorded.' });
    }

    const [students] = await pool.query(
      'SELECT id FROM students WHERE class_id = ? AND is_active = 1',
      [classId]
    );

    await pool.query('DELETE FROM attendance WHERE class_id = ? AND date = ?', [classId, date]);

    if (absentStudentIds.length) {
      const values = absentStudentIds.map((sid) => [sid, classId, date, 'absent', markedBy]);
      await pool.query(
        'INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES ?',
        [values]
      );
    }

    const total = students.length;
    const absent = absentStudentIds.length;
    res.json({
      success: true,
      message: 'Attendance marked successfully.',
      data: { total, present: total - absent, absent },
    });
  } catch (err) {
    next(err);
  }
};

exports.getByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (await isHoliday(targetDate)) {
      return res.json({
        success: true,
        data: { date: targetDate, isHoliday: true, isSunday: isSunday(targetDate), students: [] },
      });
    }

    const [students] = await pool.query(
      `SELECT s.id, s.roll_number, s.full_name, s.student_id,
              CASE WHEN a.id IS NOT NULL THEN 'absent' ELSE 'present' END AS status
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
       WHERE s.class_id = ? AND s.is_active = 1 ORDER BY s.roll_number`,
      [targetDate, classId]
    );

    res.json({ success: true, data: { date: targetDate, isHoliday: false, students } });
  } catch (err) {
    next(err);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { classId, from, to } = req.query;
    const fromD = from || today;
    const toD = to || fromD;

    const schoolDays = await schoolDaysList(fromD, toD);
    if (!schoolDays.length) {
      return res.json({ success: true, data: [], meta: { from: fromD, to: toD, schoolDays: 0 } });
    }

    let classFilter = '';
    const params = [...schoolDays];
    if (classId) {
      classFilter = ' AND att.class_id = ?';
      params.push(classId);
    }

    const placeholders = schoolDays.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT att.date, CONCAT(c.name, ' - ', c.section) AS class_name, att.class_id,
              COUNT(DISTINCT att.student_id) AS absent_count,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = att.class_id AND s.is_active = 1) AS total_students
       FROM attendance att JOIN classes c ON att.class_id = c.id
       WHERE att.date IN (${placeholders}) ${classFilter}
       GROUP BY att.date, att.class_id ORDER BY att.date DESC`,
      params
    );
    res.json({
      success: true,
      data: rows,
      meta: { from: fromD, to: toD, schoolDays: schoolDays.length },
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentSummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { studentId, classId, from, to } = req.query;
    const fromD = from || today;
    const toD = to || fromD;

    if (!studentId && !classId) {
      return res.status(400).json({ success: false, message: 'studentId or classId required' });
    }

    const schoolDays = await schoolDaysList(fromD, toD);
    const totalSchoolDays = schoolDays.length;

    if (studentId) {
      const placeholders = schoolDays.length ? schoolDays.map(() => '?').join(',') : "''";
      let absent = 0;
      if (schoolDays.length) {
        const [abs] = await pool.query(
          `SELECT COUNT(*) AS c FROM attendance WHERE student_id = ? AND date IN (${placeholders})`,
          [studentId, ...schoolDays]
        );
        absent = abs[0].c;
      }
      const present = Math.max(0, totalSchoolDays - absent);
      return res.json({
        success: true,
        data: {
          from: fromD,
          to: toD,
          totalSchoolDays,
          present,
          absent,
          percentage: totalSchoolDays ? Math.round((present / totalSchoolDays) * 100) : 0,
        },
      });
    }

    const [students] = await pool.query(
      'SELECT id, roll_number, full_name FROM students WHERE class_id = ? AND is_active = 1 ORDER BY roll_number',
      [classId]
    );
    const placeholders = schoolDays.length ? schoolDays.map(() => '?').join(',') : "''";
    const summaries = [];
    for (const st of students) {
      let absent = 0;
      if (schoolDays.length) {
        const [abs] = await pool.query(
          `SELECT COUNT(*) AS c FROM attendance WHERE student_id = ? AND date IN (${placeholders})`,
          [st.id, ...schoolDays]
        );
        absent = abs[0].c;
      }
      const present = Math.max(0, totalSchoolDays - absent);
      summaries.push({
        ...st,
        absent,
        present,
        totalSchoolDays,
        percentage: totalSchoolDays ? Math.round((present / totalSchoolDays) * 100) : 0,
      });
    }
    res.json({ success: true, data: summaries, meta: { from: fromD, to: toD, totalSchoolDays } });
  } catch (err) {
    next(err);
  }
};

exports.exportSummaryPdf = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { classId, from, to } = req.query;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId is required' });
    }
    const fromD = from || today;
    const toD = to || fromD;

    const [clsRows] = await pool.query(
      'SELECT name, section FROM classes WHERE id = ?',
      [classId]
    );
    const cls = clsRows[0];
    const classLabel = cls ? `${cls.name} - ${cls.section}` : `Class ${classId}`;

    const schoolDays = await schoolDaysList(fromD, toD);
    const totalSchoolDays = schoolDays.length;

    const [students] = await pool.query(
      'SELECT id, roll_number, full_name FROM students WHERE class_id = ? AND is_active = 1 ORDER BY roll_number',
      [classId]
    );
    const placeholders = schoolDays.length ? schoolDays.map(() => '?').join(',') : "''";
    const rows = [];
    for (const st of students) {
      let absent = 0;
      if (schoolDays.length) {
        const [abs] = await pool.query(
          `SELECT COUNT(*) AS c FROM attendance WHERE student_id = ? AND date IN (${placeholders})`,
          [st.id, ...schoolDays]
        );
        absent = abs[0].c;
      }
      const present = Math.max(0, totalSchoolDays - absent);
      const pct = totalSchoolDays ? Math.round((present / totalSchoolDays) * 100) : 0;
      rows.push([st.roll_number, st.full_name, present, absent, `${pct}%`]);
    }

    const title = `Attendance Report — ${classLabel}\n${fromD} to ${toD} (${totalSchoolDays} school days)`;
    createListPdf(
      res,
      `attendance-${classId}-${fromD}.pdf`,
      title,
      ['Roll', 'Student Name', 'Present', 'Absent', '%'],
      rows
    );
  } catch (err) {
    next(err);
  }
};

exports.getStudentAttendance = async (studentId, from, to) => {
  const params = [studentId];
  let dateFilter = '';
  if (from) { dateFilter += ' AND a.date >= ?'; params.push(from); }
  if (to) { dateFilter += ' AND a.date <= ?'; params.push(to); }

  const [absentRows] = await pool.query(
    `SELECT a.date, 'absent' AS status FROM attendance a
     WHERE a.student_id = ? ${dateFilter}
       AND a.date NOT IN (SELECT holiday_date FROM school_holidays)
     ORDER BY a.date DESC`,
    params
  );

  return absentRows;
};
