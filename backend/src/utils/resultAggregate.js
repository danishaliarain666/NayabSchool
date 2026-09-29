const { calculateGrade, calculatePercentage } = require('./gradeCalculator');

function assignPositions(students) {
  const sorted = [...students].sort(
    (a, b) => b.percentage - a.percentage || (a.roll_number || 0) - (b.roll_number || 0)
  );
  let rank = 0;
  let prevPct = null;
  const labels = ['1st', '2nd', '3rd'];
  return sorted.map((s) => {
    if (prevPct === null || s.percentage < prevPct) rank += 1;
    prevPct = s.percentage;
    const position = rank <= 3 && s.total_max > 0 ? labels[rank - 1] : '';
    return { ...s, rank, position };
  });
}

function aggregateRows(rows) {
  const byStudent = {};
  rows.forEach((r) => {
    const sid = r.student_id;
    if (!byStudent[sid]) {
      byStudent[sid] = {
        student_id: sid,
        student_db_id: r.student_db_id || sid,
        full_name: r.full_name,
        roll_number: r.roll_number,
        class_name: r.class_name,
        total_obtained: 0,
        total_max: 0,
        subject_count: 0,
      };
    }
    byStudent[sid].total_obtained += parseFloat(r.marks_obtained) || 0;
    byStudent[sid].total_max += parseFloat(r.max_marks) || 0;
    byStudent[sid].subject_count += 1;
  });

  return Object.values(byStudent).map((s) => {
    const percentage = s.total_max > 0 ? calculatePercentage(s.total_obtained, s.total_max) : 0;
    const grade = s.total_max > 0 ? calculateGrade(percentage) : '—';
    return { ...s, percentage, grade };
  });
}

module.exports = { assignPositions, aggregateRows, calculateGrade, calculatePercentage };
