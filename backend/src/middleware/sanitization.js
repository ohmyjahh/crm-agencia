const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Configurar DOMPurify com JSDOM para uso no servidor
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configurações de sanitização
const sanitizationConfig = {
  // Configuração para HTML (mais permissiva para campos de texto rico)
  html: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  },

  // Configuração para texto simples (mais restritiva)
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    STRIP_COMMENTS: true
  },

  // Configuração para campos de busca
  search: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    MAX_LENGTH: 255
  }
};

// Função principal de sanitização
const sanitizeInput = (input, type = 'text') => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remover caracteres de controle perigosos
  input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Aplicar sanitização baseada no tipo
  const config = sanitizationConfig[type] || sanitizationConfig.text;
  let sanitized = purify.sanitize(input, config);

  // Verificações adiciais de segurança
  sanitized = sanitized
    .replace(/javascript:/gi, '') // Remover javascript: URLs
    .replace(/data:/gi, '') // Remover data: URLs
    .replace(/vbscript:/gi, '') // Remover vbscript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remover event handlers

  // Limitar tamanho se especificado
  if (config.MAX_LENGTH) {
    sanitized = sanitized.substring(0, config.MAX_LENGTH);
  }

  return sanitized.trim();
};

// Função recursiva para sanitizar objetos
const sanitizeObject = (obj, typeMap = {}) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, typeMap));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeInput(key, 'text');
      const fieldType = typeMap[key] || 'text';
      sanitized[sanitizedKey] = sanitizeObject(value, typeMap);
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeInput(obj, 'text');
  }

  return obj;
};

// Middleware de sanitização para requests
const sanitizationMiddleware = (fieldTypes = {}) => {
  return (req, res, next) => {
    try {
      // Sanitizar body
      if (req.body) {
        req.body = sanitizeObject(req.body, fieldTypes);
      }

      // Sanitizar query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query, {});
      }

      // Sanitizar params
      if (req.params) {
        req.params = sanitizeObject(req.params, {});
      }

      next();
    } catch (error) {
      console.error('Sanitization error:', error);
      res.status(400).json({
        error: 'Invalid input',
        message: 'Dados de entrada inválidos.'
      });
    }
  };
};

// Sanitização específica para diferentes tipos de campos
const fieldSanitizers = {
  // Sanitização para emails
  email: (email) => {
    if (typeof email !== 'string') return email;
    
    // Remover espaços e converter para minúsculas
    email = email.trim().toLowerCase();
    
    // Validação básica de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    return sanitizeInput(email, 'text');
  },

  // Sanitização para telefones
  phone: (phone) => {
    if (typeof phone !== 'string') return phone;
    
    // Remover tudo exceto números, espaços, parênteses e hífens
    phone = phone.replace(/[^0-9\s\(\)\-\+]/g, '');
    
    return phone.trim();
  },

  // Sanitização para nomes
  name: (name) => {
    if (typeof name !== 'string') return name;
    
    // Permitir apenas letras, espaços, hífens e apóstrofes
    name = name.replace(/[^a-zA-ZÀ-ÿ\s\-\']/g, '');
    
    // Capitalizar primeira letra de cada palavra
    name = name.replace(/\b\w/g, l => l.toUpperCase());
    
    return sanitizeInput(name, 'text');
  },

  // Sanitização para URLs
  url: (url) => {
    if (typeof url !== 'string') return url;
    
    url = url.trim();
    
    // Verificar se é uma URL válida
    try {
      const parsedUrl = new URL(url);
      // Permitir apenas HTTP e HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsedUrl.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  },

  // Sanitização para números
  number: (num) => {
    if (typeof num === 'number') return num;
    if (typeof num === 'string') {
      const parsed = parseFloat(num.replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  },

  // Sanitização para IDs
  id: (id) => {
    if (typeof id === 'number') return Math.abs(Math.floor(id));
    if (typeof id === 'string') {
      const parsed = parseInt(id.replace(/[^0-9]/g, ''));
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  },

  // Sanitização para descrições/comentários (permite HTML básico)
  description: (desc) => {
    if (typeof desc !== 'string') return desc;
    return sanitizeInput(desc, 'html');
  },

  // Sanitização para termos de busca
  search: (term) => {
    if (typeof term !== 'string') return term;
    return sanitizeInput(term, 'search');
  }
};

// Middleware para validação e sanitização de campos específicos
const createFieldSanitizer = (fieldMap) => {
  return (req, res, next) => {
    try {
      const sanitizeFields = (obj, map) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = { ...obj };
        
        for (const [field, sanitizer] of Object.entries(map)) {
          if (sanitized[field] !== undefined) {
            if (typeof sanitizer === 'function') {
              sanitized[field] = sanitizer(sanitized[field]);
            } else if (typeof sanitizer === 'string' && fieldSanitizers[sanitizer]) {
              sanitized[field] = fieldSanitizers[sanitizer](sanitized[field]);
            }
          }
        }
        
        return sanitized;
      };

      if (req.body) {
        req.body = sanitizeFields(req.body, fieldMap);
      }

      if (req.query) {
        req.query = sanitizeFields(req.query, fieldMap);
      }

      next();
    } catch (error) {
      console.error('Field sanitization error:', error);
      res.status(400).json({
        error: 'Validation error',
        message: error.message || 'Erro na validação dos dados.'
      });
    }
  };
};

// Middleware de validação de tamanho de payload
const payloadSizeValidator = (maxSize = 1024 * 1024) => { // 1MB por padrão
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload too large',
        message: 'Dados enviados são muito grandes.',
        maxSize
      });
    }
    
    next();
  };
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizationMiddleware,
  fieldSanitizers,
  createFieldSanitizer,
  payloadSizeValidator
};