/** Sort classes: 1st–10th, then Nursery, KG1, KG2 (and variants). */
function classRank(name) {
  const n = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const numMatch = n.match(/\b(\d+)(?:st|nd|rd|th)?\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (/^class\s*(\d+)/.test(n)) return parseInt(n.match(/^class\s*(\d+)/)[1], 10);
  if (n.includes('nursery')) return 100;
  if (n === 'kg1' || n.includes('kg-1') || n.includes('kg 1')) return 101;
  if (n === 'kg2' || n.includes('kg-2') || n.includes('kg 2')) return 102;
  if (n.startsWith('kg')) return 101;
  return 500 + n.charCodeAt(0);
}

function sortClasses(classes) {
  return [...classes].sort((a, b) => {
    const ra = classRank(a.name);
    const rb = classRank(b.name);
    if (ra !== rb) return ra - rb;
    return String(a.section || '').localeCompare(String(b.section || ''));
  });
}

module.exports = { classRank, sortClasses };
