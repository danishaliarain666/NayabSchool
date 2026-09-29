const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('./env');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const searchRoutes = require('./routes/search');
const errorHandler = require('./middleware/errorHandler');
const pool = require('./config/db');
const { resolveDbPort } = require('./env');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      if (/^https:\/\/[\w-]+\.github\.io$/i.test(origin)) return cb(null, true);
      return cb(null, corsOrigins[0] || true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'Nayab SMS API is running',
      database: 'connected',
      dbPort: resolveDbPort(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: `Database not connected on port ${resolveDbPort()}. Run RUN-WEBSITE.bat and ensure MySQL is listening.`,
      database: 'down',
      dbPort: resolveDbPort(),
      hint: err.code || err.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/search', searchRoutes);

const feDist = path.join(__dirname, '../../frontend/dist');
if (process.env.SERVE_FRONTEND === '1' || (process.env.NODE_ENV === 'production' && fs.existsSync(feDist))) {
  app.use(express.static(feDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(feDist, 'index.html'), (err) => (err ? next(err) : undefined));
  });
}

app.use(errorHandler);

module.exports = app;
