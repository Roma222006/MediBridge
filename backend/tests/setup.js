const mongoose = require('mongoose');

async function setupTestDB() {
  const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medibridge_test';
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(uri);
}

async function teardownTestDB() {
  await mongoose.disconnect();
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { setupTestDB, teardownTestDB, clearTestDB };
