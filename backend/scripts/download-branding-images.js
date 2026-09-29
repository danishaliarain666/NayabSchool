/**
 * Downloads school logo & gallery images locally so they don't expire.
 * Run: node scripts/download-branding-images.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const infoPath = path.join(__dirname, '../data/school-public-info.json');
const brandingDir = path.join(__dirname, '../uploads/branding');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.instagram.com/',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadBrandingImages() {
  const generateSchoolLogo = require('./generate-school-logo');
  const localAssets = generateSchoolLogo();

  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  info.logo_url = localAssets.logo_url;
  info.school_photo_url = localAssets.school_photo_url;
  fs.mkdirSync(brandingDir, { recursive: true });

  const tasks = [
    { key: 'logo_url', url: info.logo_url, file: 'school-logo.jpg' },
    { key: 'school_photo_url', url: info.school_photo_url, file: 'school-banner.jpg' },
  ];

  for (let i = 0; i < (info.gallery_images || []).length; i++) {
    const g = info.gallery_images[i];
    tasks.push({ galleryIndex: i, url: g.image_url, file: `gallery-${i + 1}.jpg` });
  }

  let ok = 0;
  for (const t of tasks) {
    if (!t.url || t.url.startsWith('/uploads/')) continue;
    const dest = path.join(brandingDir, t.file);
    try {
      await download(t.url, dest);
      const localUrl = `/uploads/branding/${t.file}`;
      if (t.key) info[t.key] = localUrl;
      if (t.galleryIndex !== undefined) info.gallery_images[t.galleryIndex].image_url = localUrl;
      console.log(`✓ ${t.file}`);
      ok++;
    } catch (e) {
      console.warn(`✗ ${t.file}: ${e.message}`);
    }
  }

  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
  console.log(`\nDownloaded ${ok} images to uploads/branding/`);
}

module.exports = downloadBrandingImages;

if (require.main === module) {
  downloadBrandingImages().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
