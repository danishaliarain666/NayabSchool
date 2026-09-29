const fs = require('fs');
const path = require('path');

const PRIMARY = '#1a1a1a';
const HEADER = '#003366';
const BORDER = '#333333';
const LIGHT = '#f5f5f5';
const PAGE_WIDTH = 595.28;
const MAX_SUBJECT_ROWS = 10;
const DEFAULT_LOGO = '/uploads/branding/school-logo.jpg';

function resolveLocalPath(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) {
    const local = path.join(__dirname, '../../uploads', url.replace('/uploads/', ''));
    if (!fs.existsSync(local)) return null;
    if (local.endsWith('.svg')) return null;
    return local;
  }
  return null;
}

function resolveLogoPath(settings) {
  return resolveLocalPath(settings?.logo_url) || resolveLocalPath(DEFAULT_LOGO);
}

function clip(text, max = 80) {
  const s = String(text || '-').trim();
  return s.length > max ? `${s.slice(0, max - 3)}...` : s;
}

function drawLine(doc, x1, y1, x2, y2, color = BORDER) {
  doc.save().strokeColor(color).lineWidth(0.8).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
}

function drawCompactSchoolHeader(doc, settings, m, y, innerW) {
  const logoPath = resolveLogoPath(settings);
  const logoSize = 68;
  const logoX = m + 10;
  let textX = m + 10;
  let textW = innerW - 20;
  let hasLogo = false;

  if (logoPath) {
    try {
      doc.image(logoPath, logoX, y, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
      textX = logoX + logoSize + 10;
      textW = innerW - logoSize - 28;
      hasLogo = true;
    } catch { /* skip */ }
  }

  const align = hasLogo ? 'left' : 'center';
  doc.fillColor(HEADER).font('Helvetica-Bold').fontSize(16);
  doc.text(clip(settings.school_name, 75), textX, y + 2, { width: textW, align });
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#222');
  doc.text(clip(settings.tagline || 'A Platform For Lifelong Learners', 90), textX, y + 22, { width: textW, align });
  doc.font('Helvetica').fontSize(9).fillColor('#444');
  doc.text(clip(settings.address, 95), textX, y + 38, { width: textW, align });
  if (settings.phone && !String(settings.phone).includes('[')) {
    doc.text(`Tel: ${settings.phone}`, textX, y + 52, { width: textW, align });
  }
  return y + Math.max(logoSize, 62) + 6;
}

function drawPhotoBox(doc, photoPath, x, y, w = 76, h = 92) {
  doc.rect(x, y, w, h).lineWidth(1).stroke(BORDER);
  const local = resolveLocalPath(photoPath);
  if (local) {
    try {
      doc.image(local, x + 2, y + 2, { width: w - 4, height: h - 4, fit: [w - 4, h - 4] });
      return;
    } catch { /* placeholder */ }
  }
  doc.font('Helvetica').fontSize(8).fillColor('#999');
  doc.text('Passport Photo', x, y + h / 2 - 6, { width: w, align: 'center' });
}

/** Student details with passport photo on the right */
function drawStudentInfoPhotoRight(doc, student, m, y, innerW, pageW, fmtDate) {
  const photoW = 76;
  const photoH = 92;
  const photoX = pageW - m - photoW - 10;
  const infoX = m + 10;
  const infoW = innerW - photoW - 28;
  let iy = y;

  const row = (label, value) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(HEADER);
    doc.text(`${label}:`, infoX, iy, { width: 78 });
    doc.font('Helvetica').fontSize(10).fillColor(PRIMARY);
    doc.text(clip(value, 55), infoX + 78, iy, { width: infoW - 78 });
    iy += 15;
  };

  row('G.R No.', student.student_id);
  row('Roll No.', student.roll_number);
  row('Name', student.full_name);
  row('Father Name', student.father_name);
  row('Class', student.class_name);
  row('Date of Birth', fmtDate(student.date_of_birth));

  drawPhotoBox(doc, student.photo, photoX, y, photoW, photoH);
  return Math.max(y + photoH, iy) + 10;
}

function drawPrincipalStamp(doc, settings, x, y, size = 68) {
  const stampPath = resolveLocalPath(settings.principal_stamp_url);
  if (stampPath) {
    try {
      doc.image(stampPath, x, y, { width: size, height: size, fit: [size, size] });
      return;
    } catch { /* draw default */ }
  }
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 2;
  doc.circle(cx, cy, r).lineWidth(1.5).stroke('#003366');
  doc.circle(cx, cy, r - 5).lineWidth(0.6).stroke('#003366');
  doc.fillColor('#003366').font('Helvetica-Bold').fontSize(5.5);
  doc.text('NAYAB ENGLISH GRAMMAR', x + 4, y + 16, { width: size - 8, align: 'center' });
  doc.text('HIGH SCHOOL', x + 4, y + 24, { width: size - 8, align: 'center' });
  doc.font('Helvetica').fontSize(5);
  doc.text('Mirwah Gorchani', x + 4, y + 32, { width: size - 8, align: 'center' });
  doc.fontSize(4.5).text('OFFICIAL STAMP', x + 4, y + 42, { width: size - 8, align: 'center' });
}

/** Marksheet: Class Teacher (hand) + Principal (name + stamp below — no overlap) */
function drawMarksheetSignatures(doc, settings, m, y, innerW) {
  const half = (innerW - 20) / 2;
  const x1 = m + 8;
  const x2 = m + 12 + half;
  const lineY = y + 36;

  drawLine(doc, x1, lineY, x1 + half - 16, lineY);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY);
  doc.text('Class Teacher', x1, y + 40, { width: half - 16, align: 'center' });
  doc.font('Helvetica').fontSize(8).fillColor('#666');
  doc.text('(Hand Signature)', x1, y + 52, { width: half - 16, align: 'center' });

  drawLine(doc, x2, lineY, x2 + half - 16, lineY);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY);
  doc.text('Principal', x2, y + 40, { width: half - 16, align: 'center' });
  const principalName = settings.principal_name || 'Miss Rukhsana Ghulam Murtza Arain';
  doc.font('Helvetica').fontSize(7).fillColor(HEADER);
  doc.text(principalName, x2, y + 52, { width: half - 16, align: 'center' });
  drawPrincipalStamp(doc, settings, x2 + (half - 50) / 2, y + 62, 48);

  return y + 118;
}

function drawSLCSignatures(doc, m, y, innerW) {
  const half = innerW / 2;
  const x1 = m + 20;
  const x2 = m + half + 10;

  drawLine(doc, x1, y + 32, x1 + half - 50, y + 32);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PRIMARY);
  doc.text('Class Teacher', x1, y + 36, { width: half - 40, align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor('#666');
  doc.text('(Hand Signature)', x1, y + 50, { width: half - 40, align: 'center' });

  const boxX = x2 + 30;
  doc.rect(boxX, y + 8, half - 60, 40).lineWidth(0.8).stroke(BORDER);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PRIMARY);
  doc.text('Principal / Headmaster', x2, y + 52, { width: half - 20, align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor('#888');
  doc.text('(Physical signature — leave blank)', x2, y + 64, { width: half - 20, align: 'center' });

  return y + 78;
}

function drawInfoTable(doc, rows, x, y, labelW, valueW) {
  rows.forEach(([label, value], i) => {
    const val = clip(value, 100);
    const h = Math.max(22, doc.heightOfString(val, { width: valueW - 8 }) + 12);
    doc.rect(x, y, labelW + valueW, h).stroke('#ccc');
    doc.rect(x, y, labelW, h).fill(i % 2 ? LIGHT : '#fff').stroke('#ccc');
    doc.fillColor(HEADER).font('Helvetica-Bold').fontSize(9);
    doc.text(label, x + 6, y + 7, { width: labelW - 10 });
    doc.fillColor(PRIMARY).font('Helvetica').fontSize(9);
    doc.text(val, x + labelW + 6, y + 7, { width: valueW - 12 });
    y += h;
  });
  return y;
}

function computeMarksheetPageHeight() {
  const m = 40;
  const header = 76;
  const titleBlock = 68;
  const studentBlock = 102 + 10;
  const table = 20 + MAX_SUBJECT_ROWS * 18 + 8;
  const summary = 46;
  const signatures = 98;
  const footer = 20;
  return m + 10 + header + titleBlock + 12 + studentBlock + table + summary + signatures + footer + m;
}

function computeLeavingCertPageHeight() {
  const m = 40;
  return m + 10 + 76 + 24 + 12 + 102 + 8 + 210 + 40 + 78 + 20 + m;
}

function padSubjectRows(results, max = MAX_SUBJECT_ROWS) {
  const rows = [...results];
  while (rows.length < max) {
    rows.push({ subject_name: '', max_marks: '', marks_obtained: '', grade: '', percentage: null, _empty: true });
  }
  return rows.slice(0, max);
}

module.exports = {
  PRIMARY,
  HEADER,
  BORDER,
  LIGHT,
  PAGE_WIDTH,
  MAX_SUBJECT_ROWS,
  DEFAULT_LOGO,
  clip,
  resolveLocalPath,
  resolveLogoPath,
  drawLine,
  drawCompactSchoolHeader,
  drawPhotoBox,
  drawStudentInfoPhotoRight,
  drawPrincipalStamp,
  drawMarksheetSignatures,
  drawSLCSignatures,
  drawInfoTable,
  computeMarksheetPageHeight,
  computeLeavingCertPageHeight,
  padSubjectRows,
};
