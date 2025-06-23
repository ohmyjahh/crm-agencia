/**
 * Rate Limiting Middleware for CRM API
 * Implements both IP-based and user-based rate limiting with memory storage
 * In production, consider using Redis for distributed environments
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Memory store for tracking requests (use Redis in production)
const requestTracker = new Map();

/**
 * Custom rate limit store using memory (replace with Redis in production)
 */
class MemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
  }

  incr(key, cb) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);
    
    if (!resetTime || now > resetTime) {
      // Reset the counter
      this.hits.set(key, 1);
      this.resetTime.set(key, now + (15 * 60 * 1000)); // 15 minutes
      return cb(null, 1, new Date(now + (15 * 60 * 1000)));
    }
    
    const current = this.hits.get(key) || 0;
    const newCount = current + 1;
    this.hits.set(key, newCount);
    
    cb(null, newCount, new Date(resetTime));
  }

  decrement(key) {
    const current = this.hits.get(key) || 0;
    if (current > 0) {
      this.hits.set(key, current - 1);
    }
  }

  resetKey(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }

  resetAll() {
    this.hits.clear();
    this.resetTime.clear();
  }
}

const store = new MemoryStore();

/**
 * Generate rate limit key based on IP and user
 */
const generateKey = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?.id;
  
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip}`;
};

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes per IP/user
 */
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP/user to 100 requests per windowMs
  store: store,
  keyGenerator: generateKey,
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users in development
    return process.env.NODE_ENV === 'development' && req.user?.role === 'administrador';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  store: store,
  keyGenerator: (req) => `auth:${req.ip || req.connection.remoteAddress}`,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Upload rate limiter
 * 20 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each user to 20 uploads per hour
  store: store,
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
  message: {
    success: false,
    message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * API calls limiter for heavy operations
 * 30 requests per 5 minutes per user
 */
const heavyOperationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each user to 30 heavy operations per 5 minutes
  store: store,
  keyGenerator: generateKey,
  message: {
    success: false,
    message: 'Limite de operações pesadas atingido. Tente novamente em 5 minutos.',
    error: 'HEAVY_OPERATIONS_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Slow down middleware for progressive delays
 * Gradually increases response time for repeated requests
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes at full speed
  delayMs: 500, // slow down subsequent requests by 500ms per request
  maxDelayMs: 20000, // maximum delay of 20 seconds
  store: store,
  keyGenerator: generateKey,
  skip: (req) => {
    // Skip slow down for admin users in development
    return process.env.NODE_ENV === 'development' && req.user?.role === 'administrador';
  }
});

/**
 * User-specific rate limiter that can be configured per user role
 */
const createUserLimiter = (windowMs, maxRequests, message) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      // Different limits based on user role
      if (req.user?.role === 'administrador') {
        return maxRequests * 2; // Admins get 2x the limit
      }
      return maxRequests;
    },
    store: store,
    keyGenerator: generateKey,
    message: {
      success: false,
      message: message || 'Limite de requisições atingido.',
      error: 'USER_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * Burst protection for rapid successive requests
 * 10 requests per minute per user
 */
const burstLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 requests per minute
  store: store,
  keyGenerator: generateKey,
  message: {
    success: false,
    message: 'Muitas requisições em sequência. Aguarde um momento.',
    error: 'BURST_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Clean up expired entries periodically
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, resetTime] of store.resetTime.entries()) {
    if (now > resetTime) {
      store.hits.delete(key);
      store.resetTime.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Graceful shutdown cleanup
 */
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
});

process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

module.exports = {
  standardLimiter,
  authLimiter,
  uploadLimiter,
  heavyOperationsLimiter,
  speedLimiter,
  burstLimiter,
  createUserLimiter,
  store // Export store for testing/monitoring
};