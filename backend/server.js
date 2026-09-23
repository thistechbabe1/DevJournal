require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION! Shutting down...', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err.message);
  process.exit(1);
});

(async () => {
  try {
    await connectDB();
    console.log('MongoDB connection successful. Starting Express server...');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server is LIVE and listening on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
})();