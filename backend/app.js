const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for Render / Cloud hosting environment
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

const corsOptions = {
  origin: function (origin, callback) {
    const rawFrontendUrls = process.env.FRONTEND_URL || '';
    const allowedOrigins = rawFrontendUrls.split(',').map(url => url.trim()).filter(Boolean);
    allowedOrigins.push('http://localhost:4200', 'https://devjournaal.netlify.app');

    const netlifyPreviewRegex = /^https:\/\/[a-z0-9-]+--devjournaal\.netlify\.app$/i;

    if (!origin || allowedOrigins.includes(origin) || netlifyPreviewRegex.test(origin) || (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiting Config
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? (req) => (req.headers['x-test-ratelimit'] ? 5 : 500) : 100,
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? (req) => (req.headers['x-test-ratelimit'] ? 5 : 500) : 50,
  message: { message: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/journals', require('./routes/journalRoutes'));
app.use('/api/ai', aiLimiter, require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

const healthCheckHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'DevJournal Backend API'
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

app.use(errorHandler);

module.exports = app;
