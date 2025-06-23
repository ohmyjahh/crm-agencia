const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const compression = require('compression');

// Configuração de segurança principal
const securityConfig = {
  // Helmet configuration para headers de segurança
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        workerSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false, // Para compatibilidade com uploads
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting global
  globalRateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Limite por IP
    message: {
      error: 'Muitas requisições. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Muitas requisições. Tente novamente em 15 minutos.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      });
    }
  }),

  // Rate limiting para login (mais restritivo)
  loginRateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 tentativas de login por IP
    skipSuccessfulRequests: true,
    message: {
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Login rate limit exceeded',
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      });
    }
  }),

  // Rate limiting para APIs sensíveis
  apiRateLimit: rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requisições por minuto
    message: {
      error: 'Limite de API excedido. Tente novamente em 1 minuto.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    }
  }),

  // Slow down para prevenir ataques de força bruta
  speedLimiter: slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 50, // Permitir 50 requisições por 15 minutos sem delay
    delayMs: 500, // Adicionar 500ms de delay por requisição após o limite
    maxDelayMs: 20000, // Máximo de 20 segundos de delay
  }),

  // Proteção contra HTTP Parameter Pollution
  hpp: hpp({
    whitelist: ['tags', 'categories'] // Permitir arrays para alguns parâmetros
  }),

  // Compressão de resposta
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
};

// Middleware de segurança para uploads
const uploadSecurity = (req, res, next) => {
  // Verificar tamanho do arquivo
  if (req.file && req.file.size > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({
      error: 'File too large',
      message: 'Arquivo muito grande. Máximo 10MB permitido.'
    });
  }

  // Verificar tipos de arquivo permitidos
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];

  if (req.file && !allowedTypes.includes(req.file.mimetype)) {
    return res.status(415).json({
      error: 'Unsupported media type',
      message: 'Tipo de arquivo não permitido.'
    });
  }

  next();
};

// Middleware de validação de entrada
const inputValidation = (req, res, next) => {
  // Remover campos null ou undefined
  const cleanObject = (obj) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleanObject(obj[key]);
      }
    });
  };

  if (req.body) {
    cleanObject(req.body);
  }

  if (req.query) {
    cleanObject(req.query);
  }

  next();
};

// Middleware de cabeçalhos de segurança customizados
const customSecurityHeaders = (req, res, next) => {
  // Remover cabeçalhos que revelam informações do servidor
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Adicionar cabeçalhos de segurança customizados
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Cache control para recursos sensíveis
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// Middleware de detecção de tentativas de injeção
const injectionDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection
    /(((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>))/i, // XSS
    /(((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>))/i, // XSS img
    /((\%3C)|<)[^\n]+((\%3E)|>)/i // HTML injection
  ];

  const checkInput = (input) => {
    if (typeof input === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(input));
    }
    if (typeof input === 'object' && input !== null) {
      return Object.values(input).some(value => checkInput(value));
    }
    return false;
  };

  if (checkInput(req.body) || checkInput(req.query) || checkInput(req.params)) {
    return res.status(400).json({
      error: 'Malicious input detected',
      message: 'Entrada maliciosa detectada. Requisição bloqueada.'
    });
  }

  next();
};

module.exports = {
  securityConfig,
  uploadSecurity,
  inputValidation,
  customSecurityHeaders,
  injectionDetection
};