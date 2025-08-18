import rateLimit from 'express-rate-limit';

// Rate limiting for unavailability endpoints
export const indisponibiliteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests from this IP for unavailability operations, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests
});

// Stricter rate limiting for approval/rejection decisions
export const decisionRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 decision requests per windowMs
  message: {
    error: 'Too many approval/rejection requests from this IP, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  indisponibiliteRateLimiter,
  decisionRateLimiter
}; 