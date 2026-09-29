function phoneVariants(input) {
  const raw = String(input || '').trim();
  const digits = raw.replace(/\D/g, '');
  const set = new Set([raw, raw.replace(/\s/g, '')]);
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    set.add(last10);
    set.add(`0${last10}`);
    set.add(`92${last10}`);
    set.add(`+92${last10}`);
  }
  if (digits.length >= 11 && digits.startsWith('0')) set.add(digits);
  return [...set].filter(Boolean);
}

module.exports = { phoneVariants };
