const {
  HEADER,
  clip,
  drawCompactSchoolHeader,
  drawPhotoBox,
  drawInfoTable,
  drawSLCSignatures,
  drawLine,
  computeLeavingCertPageHeight,
  PAGE_WIDTH,
} = require('./pdfBranding');
const { getSchoolSettings } = require('./resultCardPdf');

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d).split('T')[0];
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function createLeavingPdfStream(res, filename) {
  const h = computeLeavingCertPageHeight();
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: [PAGE_WIDTH, h], margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  doc.pipe(res);
  return doc;
}

function buildRemarksText(remarks = {}) {
  const parts = [];
  if (remarks.character) parts.push(`Character: ${remarks.character}`);
  if (remarks.attendance) parts.push(`Attendance: ${remarks.attendance}`);
  if (remarks.fee) parts.push(`Fee: ${remarks.fee}`);
  if (remarks.extra) parts.push(remarks.extra);
  return parts.length ? parts.join(' | ') : 'Character Satisfactory | Attendance Regular | Fee Status Cleared';
}

async function renderLeavingCertificate(doc, pool, student, reason, certNo, remarks = {}) {
  const settings = await getSchoolSettings(pool);
  const pageW = doc.page.width;
  const m = 40;
  const innerW = pageW - m * 2;

  let y = m + 10;
  y = drawCompactSchoolHeader(doc, settings, m, y, innerW);

  doc.fillColor(HEADER).font('Helvetica-Bold').fontSize(15);
  doc.text('SCHOOL LEAVING CERTIFICATE', m, y, { width: innerW, align: 'center' });
  y += 22;

  doc.font('Helvetica').fontSize(10).fillColor('#333');
  doc.text(`Certificate No: ${certNo}`, m + 10, y);
  doc.text(`Date of Issue: ${fmtDate(new Date())}`, m + innerW / 2, y);
  y += 18;

  drawLine(doc, m + 10, y, pageW - m - 10, y, HEADER);
  y += 10;

  const photoW = 76;
  const photoH = 92;
  const photoX = pageW - m - photoW - 10;
  drawPhotoBox(doc, student.photo, photoX, y, photoW, photoH);

  const tableX = m + 10;
  const tableW = innerW - photoW - 28;
  let tableY = y;
  tableY = drawInfoTable(
    doc,
    [
      ['Student Name', student.full_name],
      ["Father's Name", student.father_name],
      ['G.R Number', student.student_id],
      ['Roll Number', student.roll_number],
      ['Class', student.class_name],
      ['Date of Birth', fmtDate(student.date_of_birth)],
      ['Date of Admission', fmtDate(student.admission_date)],
      ['Date of Leaving', fmtDate(new Date())],
    ],
    tableX,
    tableY,
    100,
    tableW - 100
  );

  y = Math.max(tableY, y + photoH) + 12;

  const genderWord = student.gender === 'Female' ? 'daughter' : 'son';
  const shortReason = clip(reason || 'leaving the school after completion of studies / transfer', 120);

  doc.fillColor('#111').font('Helvetica').fontSize(10);
  const para1 = `This is to certify that ${clip(student.full_name, 50)}, ${genderWord} of ${clip(student.father_name, 40)}, G.R No. ${student.student_id}, was a regular student of Class ${clip(student.class_name, 20)} at this institution during session ${settings.academic_session || '2025-2026'}.`;
  const para2 = `The student is ${shortReason}. Character and conduct during stay remained satisfactory. All dues are cleared to the best of our knowledge.`;
  const para3 = 'We wish the student success in future endeavours.';

  [para1, para2, para3].forEach((p) => {
    const h = doc.heightOfString(p, { width: innerW - 24, lineGap: 2 });
    doc.text(p, m + 12, y, { width: innerW - 24, lineGap: 2 });
    y += h + 8;
  });

  y += 4;
  const remarksLine = buildRemarksText(remarks);
  doc.rect(m + 8, y, innerW - 16, 32).fill('#f0f4f8').stroke('#ccc');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(HEADER);
  doc.text(`Remarks: ${remarksLine}`, m + 14, y + 10, { width: innerW - 28 });

  y += 42;
  y = drawSLCSignatures(doc, m, y, innerW);

  doc.fontSize(8).fillColor('#888');
  doc.text(clip(settings.address, 80), m, y, { width: innerW, align: 'center' });

  const borderH = y + 12 - m;
  doc.save().lineWidth(1.5).strokeColor(HEADER).rect(m, m, innerW, borderH).stroke().restore();
}

module.exports = {
  renderLeavingCertificate,
  createResultPdfStream: createLeavingPdfStream,
  computeLeavingCertPageHeight,
  buildRemarksText,
};
