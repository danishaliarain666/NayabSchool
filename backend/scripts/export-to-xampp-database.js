/**
 * Export full nayab_sms database to /xamp-database/nayab_sms.sql for XAMPP phpMyAdmin import.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../../xamp-database');
const outFile = path.join(outDir, 'nayab_sms.sql');
const dbName = process.env.DB_NAME || 'nayab_sms';
const port = process.env.DB_PORT || '3306';
const user = process.env.DB_USER || 'root';
const pass = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';

fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  process.env.MYSQLDUMP_PATH,
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
  'C:\\xampp\\mysql\\bin\\mysqldump.exe',
].filter(Boolean);
const mysqlDump = candidates.find((p) => fs.existsSync(p)) || 'mysqldump';

const args = ['-h', host, '-P', String(port), '-u', user];
if (pass) args.push(`--password=${pass}`);
args.push('--databases', dbName, '--routines', '--triggers', '--add-drop-database');

console.log('Exporting database to', outFile);
const result = spawnSync(mysqlDump, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

if (result.error || result.status !== 0) {
  console.error(result.stderr || result.error?.message);
  console.error('\nMake sure MySQL is running (XAMPP → Start MySQL) then run again.');
  process.exit(1);
}

fs.writeFileSync(outFile, result.stdout, 'utf8');
const kb = Math.round(fs.statSync(outFile).size / 1024);
console.log(`✓ Saved ${kb} KB → xamp-database/nayab_sms.sql`);
console.log('Import in phpMyAdmin: http://localhost/phpmyadmin → Import → choose nayab_sms.sql');
