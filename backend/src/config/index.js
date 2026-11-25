const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medibridge',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'medibridge_super_secure_access_secret_key_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'medibridge_super_secure_refresh_secret_key_2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30d',
    refreshExpiresInDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '90', 10)
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 200
  },
  lockout: {
    maxAttempts: 5,
    lockTimeMs: 15 * 60 * 1000
  }
};
