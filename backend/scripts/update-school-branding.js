/**
 * Downloads images locally, then updates school settings, gallery & news.
 * Run: npm run update-branding
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function update() {
  const downloadBrandingImages = require('./download-branding-images');
  await downloadBrandingImages();

  const info = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/school-public-info.json'), 'utf8'));
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nayab_sms',
  });

  console.log('\nUpdating school branding in database...');

  await connection.query('ALTER TABLE gallery MODIFY image_url TEXT NOT NULL').catch(() => {});
  await connection.query('ALTER TABLE news MODIFY image_url TEXT NULL').catch(() => {});

  const settings = [
    ['school_name', info.school_name],
    ['short_name', info.short_name],
    ['tagline', info.tagline],
    ['school_description', info.school_description],
    ['address', info.address],
    ['phone', info.phone],
    ['email', info.email],
    ['established_year', info.established_year],
    ['academic_session', info.academic_session],
    ['principal_name', info.principal_name || 'Dr. Ghulam Murtaza'],
    ['exam_controller_name', info.exam_controller_name || 'Dr. Ghulam Murtaza'],
    ['principal_stamp_url', info.principal_stamp_url || ''],
    ['instagram_url', info.instagram_url],
    ['facebook_url', info.facebook_url],
    ['facebook_profile_url', info.facebook_profile_url],
    ['facebook_page_name', info.facebook_page_name],
    ['facebook_profile_name', info.facebook_profile_name],
    ['whatsapp_url', info.whatsapp_channel],
    ['logo_url', info.logo_url],
    ['school_photo_url', info.school_photo_url],
    ['hero_title', info.hero_title],
    ['hero_subtitle', info.hero_subtitle],
    ['vision', info.vision],
    ['mission', info.mission],
    ['history', info.history],
    ['principal_message', info.principal_message],
    ['data_source', info.source],
    ['map_embed', 'https://www.google.com/maps?q=Nayab+English+Grammar+High+School+Mirwah+Gorchani&output=embed'],
    ['school_timing', 'Monday – Saturday: 8:00 AM – 2:00 PM | Office: 8:00 AM – 1:00 PM'],
    ['fee_structure', 'Nursery to KG1: Rs. 2,000/month\nKG2 to Class 8: Rs. 1,800/month\nClass 9 & 10: Rs. 2,500/month'],
  ];

  for (const [key, value] of settings) {
    if (value == null) continue;
    await connection.query(
      'INSERT INTO school_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [key, value]
    );
  }

  await connection.query('DELETE FROM gallery');
  if (info.gallery_images?.length) {
    const rows = info.gallery_images.map((g) => [g.title, g.description, g.image_url, g.category, g.is_featured || 0, 1]);
    await connection.query(
      'INSERT INTO gallery (title, description, image_url, category, is_featured, uploaded_by) VALUES ?',
      [rows]
    );
  }

  await connection.end();
  console.log('✅ School branding updated!');
  console.log('   Page:', info.facebook_page_name);
  console.log('   Profile:', info.facebook_profile_name);
  console.log('   Instagram:', info.instagram_url);
  console.log('   Logo & gallery saved locally in /uploads/branding/');
}

update().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
