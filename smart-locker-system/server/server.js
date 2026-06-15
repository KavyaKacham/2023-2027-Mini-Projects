// ============================================================
// server.js — Smart Locker Management System API Server
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Routes ───────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const lockerRoutes = require('./routes/locker');
const logsRoutes = require('./routes/logs');
const adminRoutes = require('./routes/admin');
const esp32Routes = require('./routes/esp32');
const securityRoutes = require('./routes/security');

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/locker', lockerRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/esp32', esp32Routes);
app.use('/api/security', securityRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Smart Locker API Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Locker Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      otp: '/api/otp',
      locker: '/api/locker',
      logs: '/api/logs',
      admin: '/api/admin',
      esp32: '/api/esp32',
      security: '/api/security',
    },
  });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
});

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║   🔐 Smart Locker Management System API      ║');
  console.log(`  ║   🚀 Server running on port ${PORT}              ║`);
  console.log(`  ║   📡 http://localhost:${PORT}                    ║`);
  console.log('  ║   🛡️  CORS: ' + (process.env.CORS_ORIGIN || 'http://localhost:3000').padEnd(33) + '║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
