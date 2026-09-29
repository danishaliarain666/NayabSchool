const mysql = require('mysql2/promise');
const { resolveDbPort } = require('../env');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: resolveDbPort(),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nayab_sms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

module.exports = pool;
