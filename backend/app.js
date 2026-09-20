const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

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

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/journals', require('./routes/journalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(errorHandler);

module.exports = app;
