const pool = require('../config/db');

function fmt(d) {
  if (typeof d === 'string') return d.split('T')[0];
  const dt = new Date(d);
  return dt.toISOString().split('T')[0];
}

function isSunday(date) {
  const d = new Date(`${fmt(date)}T12:00:00`);
  return d.getDay() === 0;
}

async function getHolidaySet(from, to) {
  try {
    const [rows] = await pool.query(
      'SELECT holiday_date FROM school_holidays WHERE holiday_date >= ? AND holiday_date <= ?',
      [fmt(from), fmt(to)]
    );
    return new Set(rows.map((r) => fmt(r.holiday_date)));
  } catch {
    return new Set();
  }
}

async function isHoliday(date) {
  if (isSunday(date)) return true;
  try {
    const [rows] = await pool.query('SELECT id FROM school_holidays WHERE holiday_date = ? LIMIT 1', [fmt(date)]);
    return rows.length > 0;
  } catch {
    return false;
  }
}

function eachDay(from, to) {
  const days = [];
  const start = new Date(`${fmt(from)}T12:00:00`);
  const end = new Date(`${fmt(to)}T12:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(fmt(d));
  }
  return days;
}

async function countSchoolDays(from, to) {
  const holidays = await getHolidaySet(from, to);
  return eachDay(from, to).filter((d) => !holidays.has(d)).length;
}

async function schoolDaysList(from, to) {
  const holidays = await getHolidaySet(from, to);
  return eachDay(from, to).filter((d) => !holidays.has(d) && !isSunday(d));
}

module.exports = { fmt, isSunday, getHolidaySet, isHoliday, eachDay, countSchoolDays, schoolDaysList };
