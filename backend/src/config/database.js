const mongoose = require('mongoose');

let isConnected = false;

async function connectDB(uri) {
  if (isConnected) return;
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database.`);
  } catch (err) {
    console.error(`[MongoDB] Connection error:`, err.message);
    throw err;
  }
}

async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log(`[MongoDB] Disconnected.`);
}

module.exports = { connectDB, disconnectDB, mongoose };
