/**
 * Creates local school logo & banner SVG files (used when CDN download is blocked).
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../uploads/branding');
fs.mkdirSync(dir, { recursive: true });

const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066CC"/>
      <stop offset="100%" style="stop-color:#003d7a"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="24" fill="url(#bg)"/>
  <circle cx="200" cy="175" r="95" fill="none" stroke="#ffffff" stroke-width="4"/>
  <text x="200" y="168" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="58" font-weight="bold">N</text>
  <text x="200" y="218" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="bold">NEGHS</text>
  <text x="200" y="295" text-anchor="middle" fill="#dbeafe" font-family="Arial,Helvetica,sans-serif" font-size="14">NAYAB ENGLISH GRAMMAR</text>
  <text x="200" y="317" text-anchor="middle" fill="#dbeafe" font-family="Arial,Helvetica,sans-serif" font-size="13">HIGH SCHOOL</text>
  <text x="200" y="345" text-anchor="middle" fill="#93c5fd" font-family="Arial,Helvetica,sans-serif" font-size="11">Mirwah Gorchani</text>
</svg>`;

const bannerSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
  <defs>
    <linearGradient id="banner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066CC"/>
      <stop offset="50%" style="stop-color:#004999"/>
      <stop offset="100%" style="stop-color:#003d7a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" fill="url(#banner)"/>
  <circle cx="150" cy="250" r="80" fill="none" stroke="#ffffff55" stroke-width="2"/>
  <circle cx="1050" cy="120" r="60" fill="none" stroke="#ffffff33" stroke-width="2"/>
  <text x="600" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="42" font-weight="bold">Nayab English Grammar High School</text>
  <text x="600" y="250" text-anchor="middle" fill="#dbeafe" font-family="Arial,Helvetica,sans-serif" font-size="22">Mirwah Gorchani, District Mirpurkhas, Sindh</text>
  <text x="600" y="300" text-anchor="middle" fill="#93c5fd" font-family="Arial,Helvetica,sans-serif" font-size="18">A Platform For Lifelong Learners</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'school-logo.svg'), logoSvg);
fs.writeFileSync(path.join(dir, 'school-banner.svg'), bannerSvg);

const galleryThemes = [
  { file: 'gallery-1.svg', title: 'School Event', color: '#0066CC' },
  { file: 'gallery-2.svg', title: 'Independence Day', color: '#0d9488' },
  { file: 'gallery-3.svg', title: 'Annual Function', color: '#7c3aed' },
  { file: 'gallery-4.svg', title: 'Class Activities', color: '#dc2626' },
  { file: 'gallery-5.svg', title: 'School Assembly', color: '#ca8a04' },
  { file: 'gallery-6.svg', title: 'Student Achievement', color: '#2563eb' },
  { file: 'gallery-7.svg', title: 'Annual Function Stage', color: '#059669' },
  { file: 'gallery-8.svg', title: 'Sports Day', color: '#9333ea' },
];

galleryThemes.forEach(({ file, title, color }) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color}"/>
      <stop offset="100%" style="stop-color:#003d7a"/>
    </linearGradient>
  </defs>
  <rect width="640" height="640" fill="url(#g)"/>
  <text x="320" y="280" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="28" font-weight="bold">Nayab English Grammar</text>
  <text x="320" y="320" text-anchor="middle" fill="#dbeafe" font-family="Arial,sans-serif" font-size="20">High School, Mirwah Gorchani</text>
  <text x="320" y="380" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="22">${title}</text>
</svg>`;
  fs.writeFileSync(path.join(dir, file), svg);
});

const paths = {
  logo_url: '/uploads/branding/school-logo.svg',
  school_photo_url: '/uploads/branding/school-banner.svg',
};

console.log('✓ Generated local school logo, banner & gallery placeholders');

module.exports = () => paths;

if (require.main === module) {
  console.log(paths);
}
