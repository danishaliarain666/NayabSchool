const pool = require('../config/db');
const { isHoliday, isSunday, fmt, schoolDaysList } = require('../utils/schoolDays');
const { createListPdf } = require('../utils/listPdf');
const { ensureStaffAttendanceTable } = require('../utils/ensureStaffAttendanceTable');

async function listStaffForDate(date) {
  await ensureStaffAttendanceTable();
  const [staff] = await pool.query(
    `SELECT t.id, t.full_name, t.designation, t.employee_id,
            sa.status, sa.remarks, sa.id AS attendance_id
     FROM teachers t
     LEFT JOIN staff_attendance sa ON sa.teacher_id = t.id AND sa.attendance_date = ?
     WHERE t.is_active = 1
     ORDER BY t.full_name`,
    [date]
  );
  staff.forEach((s) => {
    if (!s.status) s.status = 'present';
  });
  return staff;
}

exports.getByDate = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const holiday = await isHoliday(date);
    const staff = await listStaffForDate(date);
    res.json({ success: true, data: { date, isHoliday: holiday, isSunday: isSunday(date), staff } });
  } catch (err) {
    next(err);
  }
};

exports.getRange = async (req, res, next) => {
  try {
    await ensureStaffAttendanceTable();
    const today = new Date().toISOString().split('T')[0];
    const from = req.query.from || today;
    const to = req.query.to || from;
    const [rows] = await pool.query(
      `SELECT sa.attendance_date AS date, t.full_name, t.designation, sa.status
       FROM staff_attendance sa
       JOIN teachers t ON sa.teacher_id = t.id
       WHERE sa.attendance_date >= ? AND sa.attendance_date <= ?
       ORDER BY sa.attendance_date DESC, t.full_name`,
      [fmt(from), fmt(to)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

async function buildStaffSummary(fromD, toD) {
  await ensureStaffAttendanceTable();
  const schoolDays = await schoolDaysList(fromD, toD);
  const totalSchoolDays = schoolDays.length;
  const placeholders = schoolDays.length ? schoolDays.map(() => '?').join(',') : "''";

  const [staff] = await pool.query(
    `SELECT id, employee_id, full_name, designation FROM teachers WHERE is_active = 1 ORDER BY full_name`
  );

  const summaries = [];
  for (const st of staff) {
    let absent = 0;
    if (schoolDays.length) {
      const [abs] = await pool.query(
        `SELECT COUNT(*) AS c FROM staff_attendance
         WHERE teacher_id = ? AND attendance_date IN (${placeholders})`,
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
  return { summaries, meta: { from: fromD, to: toD, totalSchoolDays } };
}

exports.getSummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const fromD = fmt(req.query.from || today);
    const toD = fmt(req.query.to || fromD);
    const { summaries, meta } = await buildStaffSummary(fromD, toD);
    res.json({ success: true, data: summaries, meta });
  } catch (err) {
    next(err);
  }
};

exports.exportPdf = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const fromD = fmt(req.query.from || today);
    const toD = fmt(req.query.to || fromD);
    const { summaries, meta } = await buildStaffSummary(fromD, toD);
    const rows = summaries;
    const totalSchoolDays = meta.totalSchoolDays;
    const pdfRows = rows.map((s) => [
      s.employee_id || '—',
      s.full_name,
      s.designation || '—',
      s.present,
      s.absent,
      `${s.percentage}%`,
    ]);

    const title = `Staff Attendance Report\n${fromD} to ${toD} (${totalSchoolDays} school days)`;
    createListPdf(
      res,
      `staff-attendance-${fromD}.pdf`,
      title,
      ['Emp ID', 'Name', 'Designation', 'Present', 'Absent', '%'],
      pdfRows
    );
  } catch (err) {
    next(err);
  }
};

exports.saveBulk = async (req, res, next) => {
  try {
    await ensureStaffAttendanceTable();
    const { date, absentStaffIds, records } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }
    if (await isHoliday(date)) {
      return res.status(400).json({ success: false, message: 'This date is a school holiday — attendance is not counted.' });
    }

    const userId = req.user?.userId || null;

    if (Array.isArray(absentStaffIds)) {
      const [allStaff] = await pool.query('SELECT id FROM teachers WHERE is_active = 1');
      const absentSet = new Set(absentStaffIds.map((x) => parseInt(x, 10)).filter(Boolean));

      await pool.query('DELETE FROM staff_attendance WHERE attendance_date = ?', [date]);

      if (absentSet.size) {
        const values = [...absentSet].map((tid) => [tid, date, 'absent', null, userId]);
        await pool.query(
          `INSERT INTO staff_attendance (teacher_id, attendance_date, status, remarks, updated_by) VALUES ?`,
          [values]
        );
      }

      const total = allStaff.length;
      const absent = absentSet.size;
      return res.json({
        success: true,
        message: 'Staff attendance saved.',
        data: { total, present: total - absent, absent },
      });
    }

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'absentStaffIds or records required' });
    }

    for (const r of records) {
      await pool.query(
        `INSERT INTO staff_attendance (teacher_id, attendance_date, status, remarks, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), updated_by = VALUES(updated_by)`,
        [r.teacher_id, date, r.status || 'present', r.remarks || null, userId]
      );
    }
    res.json({ success: true, message: 'Staff attendance saved.' });
  } catch (err) {
    next(err);
  }
};
