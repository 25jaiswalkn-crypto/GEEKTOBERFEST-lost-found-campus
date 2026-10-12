const { rateLimit } = require('express-rate-limit');

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests/reports submitted from this IP, please try again after 15 minutes.'
  }
});

module.exports = reportLimiter;