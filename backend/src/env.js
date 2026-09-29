const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

/** MySQL port: .env → DB_PORT, else 3307 (this project’s portable DB). */
function resolveDbPort() {
  const fromEnv = parseInt(process.env.DB_PORT, 10);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return 3307;
}

module.exports = { envPath, resolveDbPort };
