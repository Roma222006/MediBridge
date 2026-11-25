const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const patientProfileRoutes = require('./routes/patientProfileRoutes');
const searchRoutes = require('./routes/searchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reassignmentRoutes = require('./routes/reassignmentRoutes');
const referralRoutes = require('./routes/referralRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const teleconsultRoutes = require('./routes/teleconsultRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id']
  })
);

// Request parsing & size restrictions
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection Prevention
app.use(mongoSanitize());

// Correlation ID & Structured Logging
app.use(requestLogger);

// Rate Limiter for Authentication & Sensitive Endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP address, please try again later.'
    }
  }
});
app.use('/api/v1/auth', authLimiter);

// Health & Readiness Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  const mongoose = require('mongoose');
  const isDbReady = mongoose.connection.readyState === 1;
  if (isDbReady) {
    return res.json({ status: 'READY', database: 'connected' });
  }
  return res.status(503).json({ status: 'NOT_READY', database: 'disconnected' });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient-profiles', patientProfileRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reassignments', reassignmentRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/vault', vaultRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/doctor', doctorRoutes);
app.use('/api/v1/teleconsult', teleconsultRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);

// Serve Frontend Production Assets in Single Unified Deployment
const path = require('path');
const fs = require('fs');
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA Fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found.`
    }
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
