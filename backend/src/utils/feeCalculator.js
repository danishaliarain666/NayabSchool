/** Monthly fee tiers — Nayab English Grammar High School */
const FEE_TIERS = [
  { match: /nursery|play\s*group|kg\s*1|kg1/i, amount: 2000, label: 'Nursery – KG1' },
  { match: /kg\s*2|kg2|1st|2nd|3rd|4th|5th|6th|7th|8th|class\s*[1-8]/i, amount: 1800, label: 'KG2 – Class 8' },
  { match: /9th|10th|class\s*9|class\s*10|matric/i, amount: 2500, label: 'Class 9 – 10' },
];

function getMonthlyFee(className) {
  const name = String(className || '');
  for (const tier of FEE_TIERS) {
    if (tier.match.test(name)) return tier.amount;
  }
  return 1800;
}

function getFeeStructureText() {
  return `Nursery to KG1: Rs. 2,000/month
KG2 to Class 8: Rs. 1,800/month
Class 9 & 10: Rs. 2,500/month`;
}

const PROMOTION_MAP = {
  Nursery: 'KG1',
  KG1: 'KG2',
  KG2: '1st',
  '1st': '2nd',
  '2nd': '3rd',
  '3rd': '4th',
  '4th': '5th',
  '5th': '6th',
  '6th': '7th',
  '7th': '8th',
  '8th': '9th',
  '9th': '10th',
};

function getNextClass(className) {
  return PROMOTION_MAP[className] || null;
}

module.exports = { getMonthlyFee, getFeeStructureText, getNextClass, FEE_TIERS, PROMOTION_MAP };
