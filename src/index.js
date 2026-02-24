require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sendEmailController } = require('./controllers/emailController');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Middlewares
app.use(helmet()); // Basic security headers

// CORS configuration - Restrict to specific origin
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['POST'], // Only allow POST for this API
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 2. Body Parser
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DOS

// 3. Rate Limiting
const emailRateLimiter = rateLimit({
  windowMs: parseInt(process.env.EMAIL_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.EMAIL_RATE_LIMIT_MAX_REQUESTS) || 5,
  message: {
    status: 'error',
    message: 'Too many requests, please try again after a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. File Upload (Multer)
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// 5. Routes
app.post(
  '/api/v1/send-email',
  emailRateLimiter,
  upload.array('attachments', 5), // Allow up to 5 files with field name 'attachments'
  sendEmailController
);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Email Send API running on port ${PORT}`);
  console.log(`CORS allowed origin: ${process.env.ALLOWED_ORIGIN || '*'}`);
});
