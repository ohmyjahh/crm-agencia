/**
 * Enhanced Authentication Middleware with Caching
 * Provides JWT authentication with user data caching for better performance
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logAuthEvent, logSecurityEvent } = require('./logger');

// In-memory cache for user data (use Redis in production)
const userCache = new Map();
const tokenBlacklist = new Set();

// Cache configuration
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 1000;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * User cache entry structure
 */
class CacheEntry {
  constructor(user) {
    this.user = user;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 1;
  }
  
  isExpired() {
    return Date.now() - this.createdAt > CACHE_TTL;
  }
  
  touch() {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }
}

/**
 * Get user from cache or database
 */
const getUserById = async (userId) => {
  // Check cache first
  const cacheKey = `user:${userId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && !cached.isExpired()) {
    cached.touch();
    return cached.user;
  }
  
  // Fetch from database
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // Store in cache if user is active
    if (user.is_active) {
      // Implement LRU eviction if cache is full
      if (userCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = [...userCache.entries()]
          .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)[0][0];
        userCache.delete(oldestKey);
      }
      
      userCache.set(cacheKey, new CacheEntry(user));
    }
    
    return user;
    
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
};

/**
 * Invalidate user cache entry
 */
const invalidateUserCache = (userId) => {
  const cacheKey = `user:${userId}`;
  userCache.delete(cacheKey);
};

/**
 * Add token to blacklist
 */
const blacklistToken = (token) => {
  // Extract token signature for blacklisting
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const signature = tokenParts[2];
    tokenBlacklist.add(signature);
  }
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const signature = tokenParts[2];
    return tokenBlacklist.has(signature);
  }
  return false;
};

/**
 * Enhanced JWT authentication middleware
 */
const authenticateToken = async (req, res, next) => {
  const startTime = Date.now();
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logSecurityEvent('missing_auth_token', req);
    return res.status(401).json({ 
      success: false,
      message: 'Token de acesso requerido',
      error: 'MISSING_AUTH_TOKEN'
    });
  }

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    logSecurityEvent('blacklisted_token_used', req, { token: token.substring(0, 20) + '...' });
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido ou revogado',
      error: 'BLACKLISTED_TOKEN'
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Rate limiting for authentication attempts per user
    const userAuthKey = `auth:${decoded.userId}`;
    
    // Get user data (from cache or database)
    const user = await getUserById(decoded.userId);

    if (!user) {
      logAuthEvent('user_not_found', req, { userId: decoded.userId });
      return res.status(401).json({ 
        success: false,
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      logAuthEvent('inactive_user_access', req, { userId: user.id, email: user.email });
      return res.status(401).json({ 
        success: false,
        message: 'Usuário inativo',
        error: 'USER_INACTIVE'
      });
    }

    // Add user data to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Add token info to request for potential blacklisting
    req.token = token;

    // Log successful authentication (debug level)
    logAuthEvent('auth_success', req, { 
      userId: user.id, 
      email: user.email,
      authTime: Date.now() - startTime
    });

    next();
    
  } catch (error) {
    let errorType = 'AUTH_ERROR';
    let message = 'Erro de autenticação';
    let statusCode = 401;
    
    if (error.name === 'TokenExpiredError') {
      errorType = 'TOKEN_EXPIRED';
      message = 'Token expirado';
      logAuthEvent('token_expired', req, { expiredAt: error.expiredAt });
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'INVALID_TOKEN';
      message = 'Token inválido';
      logSecurityEvent('invalid_token', req, { error: error.message });
    } else if (error.name === 'NotBeforeError') {
      errorType = 'TOKEN_NOT_ACTIVE';
      message = 'Token ainda não é válido';
      logSecurityEvent('premature_token_use', req, { notBefore: error.date });
    } else {
      errorType = 'INTERNAL_AUTH_ERROR';
      message = 'Erro interno de autenticação';
      statusCode = 500;
      console.error('Erro interno na autenticação:', error);
    }
    
    return res.status(statusCode).json({ 
      success: false,
      message,
      error: errorType
    });
  }
};

/**
 * Middleware to require specific role
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Autenticação requerida',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (req.user.role !== requiredRole) {
      logSecurityEvent('role_access_denied', req, { 
        requiredRole, 
        userRole: req.user.role 
      });
      return res.status(403).json({ 
        success: false,
        message: `Acesso negado. Role '${requiredRole}' requerida.`,
        error: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user can access specific resource
 */
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Autenticação requerida',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Admins have access to everything
    if (req.user.role === 'administrador') {
      return next();
    }

    // Implementation would check resource-specific permissions
    // For now, we'll just allow authenticated users
    next();
  };
};

/**
 * Logout middleware - blacklist current token
 */
const logout = (req, res, next) => {
  if (req.token) {
    blacklistToken(req.token);
    logAuthEvent('user_logout', req, { userId: req.user?.id });
  }
  
  res.json({ 
    success: true,
    message: 'Logout realizado com sucesso'
  });
};

/**
 * Clean up expired cache entries and blacklisted tokens
 */
const cleanupCache = () => {
  const now = Date.now();
  
  // Clean expired user cache entries
  for (const [key, entry] of userCache.entries()) {
    if (entry.isExpired()) {
      userCache.delete(key);
    }
  }
  
  // Clean expired blacklisted tokens (if we stored them with expiry)
  // For now, we'll just limit the blacklist size
  if (tokenBlacklist.size > 10000) {
    // Clear half of the blacklist (simple strategy)
    const toDelete = [...tokenBlacklist].slice(0, 5000);
    toDelete.forEach(token => tokenBlacklist.delete(token));
  }
};

// Set up cleanup interval
const cleanupInterval = setInterval(cleanupCache, CLEANUP_INTERVAL);

// Cleanup on process exit
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
});

process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

/**
 * Get cache statistics (for monitoring)
 */
const getCacheStats = () => {
  const stats = {
    userCacheSize: userCache.size,
    blacklistSize: tokenBlacklist.size,
    cacheHitRate: 0, // Would need hit/miss tracking
    oldestCacheEntry: null,
    newestCacheEntry: null
  };
  
  if (userCache.size > 0) {
    const entries = [...userCache.values()];
    stats.oldestCacheEntry = Math.min(...entries.map(e => e.createdAt));
    stats.newestCacheEntry = Math.max(...entries.map(e => e.createdAt));
  }
  
  return stats;
};

module.exports = { 
  authenticateToken,
  requireRole,
  requireResourceAccess,
  logout,
  invalidateUserCache,
  blacklistToken,
  getCacheStats
};