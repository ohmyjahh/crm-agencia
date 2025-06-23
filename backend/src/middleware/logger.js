/**
 * Structured Logging Middleware for CRM API
 * Provides comprehensive request logging with structured format
 * Includes performance metrics, error tracking, and security monitoring
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log levels with numerical values for filtering
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Current log level from environment (default: INFO)
 */
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Sanitize sensitive data from objects
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'password_hash', 'token', 'authorization', 
    'cookie', 'session', 'secret', 'key', 'private'
  ];
  
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => 
      lowerKey.includes(field) || lowerKey.endsWith('_token')
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Get client IP address considering proxies
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.connection?.socket?.remoteAddress ||
         'unknown';
};

/**
 * Get user agent information
 */
const getUserAgent = (req) => {
  return req.get('User-Agent') || 'unknown';
};

/**
 * Generate request ID for tracing
 */
const generateRequestId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Format log entry as structured JSON
 */
const formatLogEntry = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    environment: process.env.NODE_ENV || 'development',
    service: 'crm-api',
    version: process.env.npm_package_version || '1.0.0',
    ...meta
  };
  
  return JSON.stringify(entry);
};

/**
 * Write log to file
 */
const writeToFile = (level, entry) => {
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${level.toLowerCase()}.log`;
  const filepath = path.join(logsDir, filename);
  
  fs.appendFileSync(filepath, entry + '\n', 'utf8');
};

/**
 * Core logging function
 */
const log = (level, message, meta = {}) => {
  const levelValue = LOG_LEVELS[level];
  
  // Skip if log level is below current threshold
  if (levelValue > CURRENT_LOG_LEVEL) return;
  
  const entry = formatLogEntry(level, message, meta);
  
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(entry);
  }
  
  // Write to file for all levels
  try {
    writeToFile(level, entry);
  } catch (error) {
    console.error('Failed to write log to file:', error);
  }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Log request start
  log('INFO', 'Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: sanitizeData(req.query),
    headers: sanitizeData(req.headers),
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    userId: req.user?.id,
    userRole: req.user?.role,
    body: req.method !== 'GET' ? sanitizeData(req.body) : undefined,
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer')
  });
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log response
    const logLevel = res.statusCode >= 500 ? 'ERROR' : 
                    res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    log(logLevel, 'Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration,
      responseSize: res.get('Content-Length'),
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: getClientIP(req),
      // Performance metrics
      performance: {
        duration,
        slow: duration > 5000, // Mark as slow if > 5 seconds
        memory: process.memoryUsage()
      }
    });
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  log('ERROR', 'Request error occurred', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    userId: req.user?.id,
    ip: getClientIP(req),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status || err.statusCode
    },
    headers: sanitizeData(req.headers),
    body: sanitizeData(req.body)
  });
  
  next(err);
};

/**
 * Security events logger
 */
const logSecurityEvent = (eventType, req, details = {}) => {
  log('WARN', `Security event: ${eventType}`, {
    requestId: req.requestId,
    eventType,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Performance monitoring logger
 */
const logPerformance = (operation, duration, details = {}) => {
  log('INFO', `Performance: ${operation}`, {
    operation,
    duration,
    slow: duration > 1000, // Mark as slow if > 1 second
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Database query logger
 */
const logDatabaseQuery = (query, duration, params = null) => {
  log('DEBUG', 'Database query executed', {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''), // Truncate long queries
    duration,
    params: sanitizeData(params),
    slow: duration > 1000,
    timestamp: new Date().toISOString()
  });
};

/**
 * Authentication events logger
 */
const logAuthEvent = (eventType, req, details = {}) => {
  const logLevel = eventType.includes('failed') || eventType.includes('blocked') ? 'WARN' : 'INFO';
  
  log(logLevel, `Auth event: ${eventType}`, {
    requestId: req.requestId,
    eventType,
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    userId: req.user?.id,
    email: details.email,
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * File operation logger
 */
const logFileOperation = (operation, filename, userId, details = {}) => {
  log('INFO', `File operation: ${operation}`, {
    operation,
    filename,
    userId,
    fileSize: details.fileSize,
    mimeType: details.mimeType,
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Log cleanup function - removes old log files
 */
const cleanupLogs = (daysToKeep = 30) => {
  try {
    const files = fs.readdirSync(logsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    files.forEach(file => {
      if (file.endsWith('.log')) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('Error during log cleanup:', error);
  }
};

// Run log cleanup daily
const cleanupInterval = setInterval(() => {
  cleanupLogs();
}, 24 * 60 * 60 * 1000); // 24 hours

// Cleanup on process exit
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
});

process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

module.exports = {
  requestLogger,
  errorLogger,
  logSecurityEvent,
  logPerformance,
  logDatabaseQuery,
  logAuthEvent,
  logFileOperation,
  cleanupLogs,
  log,
  LOG_LEVELS
};