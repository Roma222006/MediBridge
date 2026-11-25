const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/database');
const config = require('../backend/src/config');

module.exports = async (req, res) => {
  try {
    await connectDB(config.mongoUri);
  } catch (err) {
    console.error('[Serverless] MongoDB connection failed:', err);
  }
  return app(req, res);
};
