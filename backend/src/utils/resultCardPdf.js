const PDFDocument = require('pdfkit');
const { calculateGrade, calculatePercentage } = require('./gradeCalculator');
const {
  HEADER,
  BORDER,
  LIGHT,
  clip,
  drawLine,
  drawCompactSchoolHeader,
  drawStudentInfoPhotoRight,
  drawMarksheetSignatures,
  PAGE_WIDTH,
} = require('./pdfBranding');
async function getRemarksForStudent(pool, studentId) {
  try {
    const [rows] = await pool.query(
      `SELECT sub.name AS subject_name, wr.remark
       FROM student_weekly_remarks wr
       JOIN subjects sub ON wr.subject_id = sub.id
       WHERE wr.student_id = ? ORDER BY sub.name`,
      [studentId]
    );
    return rows;
  } catch {
    return [];
  }
}

async function getSchoolSettings(pool) {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM school_settings');
  const settings = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  settings.principal_name = settings.principal_name || 'Miss Rukhsana Ghulam Murtza Arain';
  settings.exam_controller_name = settings.exam_controller_name || 'Miss Rukhsana Ghulam Murtza Arain';
  return settings;
}

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d).split('T')[0];
  return dt.toLocaleDateString('en-GB');
}

function drawTermTable(doc, { title, results, m, y, innerW, pageW }) {
  doc.fillColor(HEADER).font('Helvetica-Bold').fontSize(11);
  doc.text(title, m, y, { width: innerW, align: 'center' });
  y += 16;

  const cols = [
    { label: 'S#', x: m + 8, w: 28 },
    { label: 'Subject', x: m + 38, w: 200 },
    { label: 'Max Marks', x: m + 242, w: 56 },
    { label: 'Obtained', x: m + 302, w: 56 },
  ];

  doc.rect(m + 6, y, innerW - 12, 19).fill(HEADER);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
  cols.forEach((c) => doc.text(c.label, c.x, y + 5, { width: c.w }));
  y += 19;

  const subjectRows = results?.length ? results : [{ subject_name: '—', max_marks: '—', marks_obtained: '—', grade: '—', _placeholder: true }];
  let totalObtained = 0;
  let totalMax = 0;

  subjectRows.forEach((r, idx) => {
    const rowH = 17;
    if (idx % 2 === 0) doc.rect(m + 6, y, innerW - 12, rowH).fill(LIGHT);
    doc.fillColor('#111').font('Helvetica').fontSize(9);

    if (!r._placeholder && r.subject_name) {
      doc.text(String(idx + 1), cols[0].x, y + 4, { width: cols[0].w });
      doc.text(clip(r.subject_name, 28), cols[1].x, y + 4, { width: cols[1].w });
      doc.text(String(r.max_marks), cols[2].x, y + 4, { width: cols[2].w });
      doc.text(String(r.marks_obtained), cols[3].x, y + 4, { width: cols[3].w });
      totalObtained += parseFloat(r.marks_obtained) || 0;
      totalMax += parseFloat(r.max_marks) || 0;
    } else {
      doc.text('—', cols[0].x, y + 4, { width: cols[0].w });
      doc.text('No marks entered yet', cols[1].x, y + 4, { width: cols[1].w });
    }
    y += rowH;
  });

  y += 4;
  const overall = totalMax > 0 ? calculatePercentage(totalObtained, totalMax) : '—';
  const overallGrade = totalMax > 0 ? calculateGrade(overall) : '—';
  doc.rect(m + 6, y, innerW - 12, 22).stroke(BORDER);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(HEADER);
  doc.text(`Total: ${totalMax ? `${totalObtained} / ${totalMax}` : '—'}`, m + 12, y + 6);
  doc.text(`Percentage: ${overall}${overall === '—' ? '' : '%'}`, m + 130, y + 6);
  doc.text(`Grade: ${overallGrade}`, m + 250, y + 6);
  y += 28;
  return { y, totalObtained, totalMax, overall, overallGrade };
}

function drawWeeklyRemarksBlock(doc, remarks, m, y, innerW) {
  if (!remarks?.length) return y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(HEADER);
  doc.text('Weekly Remarks (Subject-wise)', m + 8, y);
  y += 14;
  remarks.slice(0, 8).forEach((r) => {
    doc.font('Helvetica').fontSize(8).fillColor('#222');
    doc.text(`${clip(r.subject_name, 28)}: ${r.remark}`, m + 12, y, { width: innerW - 24 });
    y += 12;
  });
  return y + 4;
}

async function drawResultCard(doc, pool, { student, midResults, finalResults, settings, weeklyRemarks }) {
  const pageW = doc.page.width;
  const m = 36;
  const innerW = pageW - m * 2;

  let y = m + 8;
  y = drawCompactSchoolHeader(doc, settings, m, y, innerW);

  doc.fillColor(HEADER).font('Helvetica-Bold').fontSize(14);
  doc.text('BOARD OF SECONDARY EDUCATION — STATEMENT OF MARKS', m, y, { width: innerW, align: 'center' });
  y += 14;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#222');
  doc.text(clip(settings.school_name, 80), m, y, { width: innerW, align: 'center' });
  y += 12;
  doc.font('Helvetica').fontSize(9).fillColor('#444');
  doc.text(`Session: ${settings.academic_session || '2025-2026'}  |  District: Mirpur Khas, Sindh`, m, y, { width: innerW, align: 'center' });
  y += 14;
  drawLine(doc, m + 8, y, pageW - m - 8, y, HEADER);
  y += 10;

  y = drawStudentInfoPhotoRight(doc, student, m, y, innerW, pageW, fmtDate);

  let grandObt = 0;
  let grandMax = 0;

  if (midResults?.length) {
    const mid = drawTermTable(doc, { title: 'MID TERM EXAMINATION', results: midResults, m, y, innerW, pageW });
    y = mid.y;
    if (mid.totalMax) { grandObt += mid.totalObtained; grandMax += mid.totalMax; }
  }

  if (finalResults?.length) {
    const fin = drawTermTable(doc, { title: 'FINAL TERM / ANNUAL EXAMINATION', results: finalResults, m, y, innerW, pageW });
    y = fin.y;
    if (fin.totalMax) { grandObt += fin.totalObtained; grandMax += fin.totalMax; }
  }

  if (!midResults?.length && !finalResults?.length) {
    const empty = drawTermTable(doc, { title: 'EXAMINATION MARKS', results: [], m, y, innerW, pageW });
    y = empty.y;
  }

  const grandPct = grandMax > 0 ? calculatePercentage(grandObt, grandMax) : '—';
  const grandGrade = grandMax > 0 ? calculateGrade(grandPct) : '—';
  doc.rect(m + 6, y, innerW - 12, 26).fill('#e8eef5').stroke(BORDER);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(HEADER);
  doc.text(`Overall Total: ${grandMax ? `${grandObt} / ${grandMax}` : '—'}`, m + 12, y + 7);
  doc.text(`Overall %: ${grandPct}${grandPct === '—' ? '' : '%'}`, m + 160, y + 7);
  doc.text(`Overall Grade: ${grandGrade}`, m + 200, y + 7);
  if (student.position) {
    doc.text(`Position: ${student.position}`, m + 300, y + 7);
  }
  y += 32;

  y = drawWeeklyRemarksBlock(doc, weeklyRemarks, m, y, innerW);
  y = drawMarksheetSignatures(doc, settings, m, y + 6, innerW);

  doc.fontSize(7).fillColor('#888');
  doc.text(`Issued: ${fmtDate(new Date())} | Errors excepted`, m, y + 4, { width: innerW, align: 'center' });

  const borderH = y + 18 - m;
  doc.save().lineWidth(1.2).strokeColor(HEADER).rect(m, m, innerW, borderH).stroke().restore();
}

function termTableHeight(subjectCount) {
  const rows = Math.max(subjectCount, 1);
  return 16 + 19 + rows * 17 + 32;
}

function computeMarksheetPageHeight(midCount = 0, finalCount = 0, remarkCount = 0) {
  const m = 36;
  const header = 118;
  const student = 112;
  let sections = 0;
  if (midCount > 0) sections += termTableHeight(midCount);
  if (finalCount > 0) sections += termTableHeight(finalCount);
  if (!midCount && !finalCount) sections += termTableHeight(0);
  const overall = 32;
  const remarks = remarkCount > 0 ? 20 + Math.min(remarkCount, 8) * 12 : 0;
  const sig = 88;
  return m + header + student + sections + overall + remarks + sig + m + 20;
}

function createResultPdfStream(res, filename, pageHeight) {
  const doc = new PDFDocument({ size: [PAGE_WIDTH, pageHeight], margin: 0, autoFirstPage: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  doc.pipe(res);
  return doc;
}

async function fetchTermResults(pool, studentId, classId, examId) {
  const [exams] = await pool.query('SELECT id, name FROM exams WHERE class_id = ?', [classId]);
  const findExam = (re) => exams.find((e) => re.test(e.name));
  let midId = findExam(/mid\s*term|midterm|mid-term/i)?.id;
  let finalId = findExam(/final|annual|year/i)?.id;

  if (examId) {
    const current = exams.find((e) => String(e.id) === String(examId));
    if (current && /mid/i.test(current.name)) midId = current.id;
    else if (current) finalId = current.id;
  }

  const load = async (id) => {
    if (!id) return [];
    const [rows] = await pool.query(
      `SELECT r.*, sub.name AS subject_name FROM results r
       JOIN subjects sub ON r.subject_id = sub.id WHERE r.student_id = ? AND r.exam_id = ? ORDER BY sub.name`,
      [studentId, id]
    );
    return rows;
  };

  return { midResults: await load(midId), finalResults: await load(finalId) };
}

async function renderResultCard(doc, pool, student, examId, examName) {
  const settings = await getSchoolSettings(pool);
  const { midResults, finalResults } = await fetchTermResults(pool, student.id, student.class_id, examId);
  const weeklyRemarks = await getRemarksForStudent(pool, student.id);
  let position = '';
  try {
    const { assignPositions, aggregateRows } = require('./resultAggregate');
    const [rows] = await pool.query(
      `SELECT r.*, s.id AS student_db_id, s.full_name, s.roll_number,
              CONCAT(c.name, ' - ', c.section) AS class_name
       FROM results r JOIN students s ON r.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       WHERE s.class_id = ? AND r.exam_id = ? AND s.is_active = 1`,
      [student.class_id, examId]
    );
    const agg = assignPositions(aggregateRows(rows));
    position = agg.find((a) => String(a.student_id) === String(student.id))?.position || '';
  } catch {
    position = '';
  }
  await drawResultCard(doc, pool, { student: { ...student, position }, midResults, finalResults, settings, weeklyRemarks });
}

module.exports = {
  drawResultCard,
  createResultPdfStream,
  renderResultCard,
  getSchoolSettings,
  computeMarksheetPageHeight,
  fetchTermResults,
};
