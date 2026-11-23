const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/database');

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST']
  }
});

// Attach socket instance to app for real-time broadcasts
app.set('io', io);

io.on('connection', (socket) => {
  if (config.env !== 'test') {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
  }

  // Allow clients to subscribe to specific hospital or slot updates
  socket.on('subscribe_hospital', (hospitalId) => {
    socket.join(`hospital:${hospitalId}`);
  });

  socket.on('subscribe_doctor', (doctorId) => {
    socket.join(`doctor:${doctorId}`);
  });

  socket.on('disconnect', () => {
    if (config.env !== 'test') {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    }
  });
});

async function startServer() {
  try {
    await connectDB(config.mongoUri);
    server.listen(config.port, () => {
      console.log(`[MediBridge Server] Running on port ${config.port} in ${config.env} mode.`);
    });
  } catch (err) {
    console.error('[MediBridge Server] Failed to start:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`[MediBridge Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[MediBridge Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    // Force shutdown after 10s timeout
    setTimeout(() => {
      console.error('[MediBridge Server] Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

setupGracefulShutdown();

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
