/**
 * Nayab Annual Result PDF parser — backward scan from Passed/Failed
 */
const { splitNameFather, cleanNameRaw } = require('../src/utils/nameParser');

const ADM_DATE_RE = /^\d{2}-\d{2}-\d{4}$/;
const DOB_NAME_RE = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*(.*)$/;
const DOB_DATE_RE = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
const MERGED_ADM_RE = /^(\d{3,4})(\d{2}-\d{2}-\d{4})$/;
const MERGED_SERIAL_GR_RE = /^(\d{2})(\d{3,4})$/;
const SKIP_LINE_RE = /^(Passed|Failed|100100|333333|\d{2,3}$|Eng|Urdu|S\.|Date:|Class:|G\.R|No$|D\.O|Nayab|Annual|Incharge|Principal|S\.No|Total|Remarks|Father'?s?\s*Name|Comp|G\.Sc|Math|Isl|Sindhi)$/i;
const CLASS_SUFFIX = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th', 5: 'th', 6: 'th', 7: 'th', 8: 'th' };

function parseDate(str) {
  if (!str) return '2000-01-01';
  str = String(str).trim().replace(/\//g, '-');
  const p = str.split('-');
  if (p.length !== 3) return '2000-01-01';
  if (p[0].length === 4) return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
  let a = parseInt(p[0], 10);
  let b = parseInt(p[1], 10);
  let year = parseInt(p[2], 10);
  if (year < 100) year += 2000;
  let day = a;
  let month = b;
  if (a > 12 && b <= 12) { day = a; month = b; }
  else if (b > 12 && a <= 12) { day = b; month = a; }
  if (month < 1 || month > 12 || day < 1 || day > 31) return '2000-01-01';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function splitMarksDigits(str, count) {
  const digits = String(str).replace(/\D/g, '');
  const marks = [];
  let i = 0;
  while (marks.length < count && i < digits.length) {
    if (digits.slice(i, i + 3) === '100') { marks.push(100); i += 3; }
    else { marks.push(parseInt(digits.slice(i, i + 2), 10)); i += 2; }
  }
  if (marks.length !== count || marks.some((m) => Number.isNaN(m) || m < 0 || m > 100)) return null;
  return marks;
}

function tryParseMarks(str, prefer7) {
  for (const count of prefer7 ? [7, 6] : [6, 7]) {
    const m = splitMarksDigits(str, count);
    if (m) return { marks: m, subjectCount: count };
  }
  return null;
}

function extractMarksLine(line) {
  const chunks = String(line).match(/\d{10,}/g);
  if (!chunks) return null;
  return chunks.reduce((a, b) => (b.length > a.length ? b : a));
}

function parseNameBlock(nameLines) {
  let dob = null;
  const nameParts = [];
  for (const line of nameLines) {
    const m = DOB_NAME_RE.exec(line);
    if (m) {
      if (!dob) dob = parseDate(m[1]);
      if (m[2]?.trim()) nameParts.push(m[2].trim());
    } else if (DOB_DATE_RE.test(line)) {
      if (!dob) dob = parseDate(line);
    } else if (/^[A-Za-z]/.test(line)) {
      nameParts.push(cleanNameRaw(line));
    }
  }
  const names = splitNameFather(nameParts.join(' '));
  if (!names?.fullName) return null;
  return { dob: dob || '2000-01-01', fullName: names.fullName, fatherName: names.fatherName };
}

function preprocessText(text) {
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  text = text.replace(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})([A-Za-z])/g, '$1 $2');
  text = text.replace(/([A-Za-z])(\d{10,})/g, '$1 $2');
  text = text.replace(/(\d{10,})(\d{2,3})(?=\s*(Passed|Failed)\b)/gi, '$1\n$2');
  text = text.replace(/\b(Passed|Failed)(\d{2})(\d{3,4})(\d{2}-\d{2}-\d{4})/gi, '$1\n$2\n$3\n$4');
  text = text.replace(/^(\d{2})(\d{4})$/gm, '$1\n$2');
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

function parseClassName(line, lines, startIdx) {
  const parts = [line.replace(/^Class:\s*/i, '').replace(/\./g, '').trim()];
  let j = startIdx + 1;
  while (j < lines.length && j < startIdx + 4) {
    const p = lines[j].replace(/\./g, '').trim();
    if (!p || /^S\.?$/.test(p) || /^Eng/i.test(p) || /^G\.R/i.test(p)) break;
    if (/^(st|nd|rd|th)$/i.test(p) || /^\d+$/.test(p)) parts.push(p);
    j++;
  }
  const num = parseInt(parts.join('').replace(/\D/g, ''), 10);
  if (num >= 1 && num <= 8) return { name: `${num}${CLASS_SUFFIX[num]}`, nextIdx: j - 1 };
  return { name: '1st', nextIdx: j - 1 };
}

function parseOneRecord(lines, passIdx, prefer7) {
  let idx = passIdx - 1;
  if (idx < 0 || !/^\d{2,3}$/.test(lines[idx])) return null;
  idx--;
  const marksStr = extractMarksLine(lines[idx]) || (/\d{10,}/.test(lines[idx]) ? lines[idx].replace(/\D/g, '') : null);
  if (!marksStr) return null;
  idx--;
  const parsedMarks = tryParseMarks(marksStr, prefer7);
  if (!parsedMarks) return null;

  const nameLines = [];
  while (idx >= 0 && !ADM_DATE_RE.test(lines[idx])) {
    if (MERGED_ADM_RE.test(lines[idx])) break;
    if (!SKIP_LINE_RE.test(lines[idx])) nameLines.unshift(lines[idx]);
    idx--;
  }
  if (idx < 0) return null;
  const nameInfo = parseNameBlock(nameLines);
  if (!nameInfo || nameInfo.fullName.length < 2) return null;

  let doAdm = null;
  let grNo = null;
  let serial = null;
  const mergedAdm = MERGED_ADM_RE.exec(lines[idx]);
  if (mergedAdm) {
    grNo = mergedAdm[1];
    doAdm = parseDate(mergedAdm[2]);
    idx--;
  } else if (ADM_DATE_RE.test(lines[idx])) {
    doAdm = parseDate(lines[idx--]);
  } else return null;

  if (idx >= 0) {
    const mergedSG = MERGED_SERIAL_GR_RE.exec(lines[idx]);
    if (mergedSG) {
      serial = mergedSG[1];
      grNo = grNo || mergedSG[2];
      idx--;
    } else if (/^\d{3,4}$/.test(lines[idx])) {
      grNo = grNo || lines[idx--];
      if (idx >= 0 && /^\d{2}$/.test(lines[idx])) serial = lines[idx--];
    } else if (/^\d{2}$/.test(lines[idx])) {
      serial = lines[idx--];
      if (!grNo) grNo = `X${serial}`;
    }
  }
  if (!grNo) grNo = `UNK-${passIdx}`;

  return {
    grNo, serial, doAdm, dob: nameInfo.dob,
    fullName: nameInfo.fullName, fatherName: nameInfo.fatherName,
    marks: parsedMarks.marks, subjectCount: parsedMarks.subjectCount,
  };
}

function parsePdfStudents(text) {
  const lines = preprocessText(text);
  const classStudents = {};
  let currentClass = '1st';
  let prefer7 = false;

  const ensureClass = (name, has7) => {
    if (!classStudents[name]) classStudents[name] = { name, hasSindhi: !!has7, students: [] };
    else if (has7) classStudents[name].hasSindhi = true;
    return classStudents[name];
  };

  for (let i = 0; i < lines.length; i++) {
    if (/^Class:/i.test(lines[i])) {
      const { name, nextIdx } = parseClassName(lines[i], lines, i);
      if (name !== currentClass) { currentClass = name; prefer7 = false; }
      ensureClass(currentClass, false);
      i = nextIdx;
      continue;
    }
    if (/Sindhi/i.test(lines[i]) && /Eng|Urdu|Math/i.test(lines[i])) {
      prefer7 = true;
      ensureClass(currentClass, true);
      continue;
    }
    if (!/^(Passed|Failed)$/i.test(lines[i])) continue;
    const rec = parseOneRecord(lines, i, prefer7);
    if (!rec) continue;
    if (rec.subjectCount === 7) ensureClass(currentClass, true);
    ensureClass(currentClass, rec.subjectCount === 7).students.push({
      grNo: rec.grNo, doAdm: rec.doAdm, dob: rec.dob,
      fullName: rec.fullName, fatherName: rec.fatherName, marks: rec.marks,
    });
  }

  return Object.values(classStudents)
    .map((c) => ({ ...c, students: dedupeByGr(c.students) }))
    .filter((c) => c.students.length);
}

/** One record per G.R No — keep cleanest (shortest) name */
function dedupeByGr(students) {
  const map = new Map();
  for (const st of students) {
    const key = st.grNo;
    const prev = map.get(key);
    if (!prev || st.fullName.split(' ').length < prev.fullName.split(' ').length) {
      map.set(key, st);
    }
  }
  return Array.from(map.values());
}

module.exports = { parsePdfStudents, preprocessText, splitMarksDigits };
