require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const { startKeepAlive, stopKeepAlive } = require('./services/keepAliveService');

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION! Shutting down...', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err.message);
  process.exit(1);
});

const gracefulShutdown = () => {
  console.log('Shutting down server...');
  stopKeepAlive();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

(async () => {
  try {
    await connectDB();
    console.log('MongoDB connection successful. Starting Express server...');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server is LIVE and listening on port ${PORT}`);
      startKeepAlive();
    });

  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
})();