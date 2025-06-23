const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class PasswordPolicy {
  constructor() {
    // Configurações de política de senha
    this.config = {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxRepeatingChars: 2,
      preventCommonPasswords: true,
      preventPersonalInfo: true,
      passwordHistoryCount: 5, // Últimas 5 senhas não podem ser reutilizadas
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 dias em ms
      warningPeriod: 7 * 24 * 60 * 60 * 1000, // Avisar 7 dias antes de expirar
      saltRounds: 12
    };

    // Lista de senhas comuns (top 100 mais usadas)
    this.commonPasswords = new Set([
      '123456', 'password', '123456789', '12345678', '12345', '1234567',
      'admin', 'qwerty', 'abc123', 'Password', '123123', 'welcome',
      'password123', 'admin123', 'root', 'toor', 'pass', 'test',
      'guest', 'info', 'adm', 'mysql', 'user', 'administrator',
      'oracle', 'ftp', 'pi', 'puppet', 'ansible', 'ec2-user',
      'vagrant', 'azureuser', 'academic', 'accueil', 'access',
      'accounting', 'action', 'admin1', 'admin2', 'admins',
      'ads', 'adserver', 'adsl', 'ae', 'af', 'affiliate',
      'affiliates', 'afiliados', 'ag', 'agenda', 'agent',
      'ai', 'aix', 'ajax', 'ak', 'akamai', 'al', 'alabama',
      'alaska', 'albuquerque', 'alerts', 'alpha', 'am',
      'amarillo', 'americas', 'an', 'anaheim', 'analyzer',
      'announce', 'announcements', 'antivirus', 'ao', 'ap',
      'apache', 'apollo', 'app', 'app1', 'app2', 'apple',
      'application', 'applications', 'apps', 'appserver',
      'aq', 'ar', 'archie', 'arlington', 'as', 'as400',
      'asia', 'asterisk', 'at', 'athena', 'atlanta', 'atlas',
      'att', 'au', 'auction', 'austin', 'auth', 'auto',
      'autodiscover', 'av', 'aw', 'az', 'b', 'b2b',
      'b2c', 'ba', 'backup', 'baltimore', 'banking',
      'bayarea', 'bb', 'bbdd', 'bbs', 'bd', 'be',
      'beta', 'bg', 'bh', 'bi', 'billing', 'biz'
    ]);

    // Padrões de teclado comuns
    this.keyboardPatterns = [
      'qwerty', 'asdf', 'zxcv', '1234', '4321', 'abcd',
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      '1234567890', '0987654321'
    ];
  }

  /**
   * Validar senha contra todas as políticas
   * @param {string} password - Senha a validar
   * @param {Object} userInfo - Informações do usuário (nome, email, etc.)
   * @param {Array} previousPasswords - Array de hashes das senhas anteriores
   * @returns {Object} Resultado da validação
   */
  validatePassword(password, userInfo = {}, previousPasswords = []) {
    const errors = [];
    const warnings = [];

    // Verificar comprimento
    if (password.length < this.config.minLength) {
      errors.push(`Senha deve ter pelo menos ${this.config.minLength} caracteres`);
    }

    if (password.length > this.config.maxLength) {
      errors.push(`Senha deve ter no máximo ${this.config.maxLength} caracteres`);
    }

    // Verificar caracteres obrigatórios
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    if (this.config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    // Verificar caracteres repetidos
    if (this.hasExcessiveRepeating(password)) {
      errors.push(`Senha não pode ter mais de ${this.config.maxRepeatingChars} caracteres iguais consecutivos`);
    }

    // Verificar senhas comuns
    if (this.config.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Senha muito comum. Escolha uma senha mais segura');
    }

    // Verificar padrões de teclado
    if (this.hasKeyboardPattern(password)) {
      warnings.push('Senha contém padrões de teclado. Considere uma senha mais complexa');
    }

    // Verificar informações pessoais
    if (this.config.preventPersonalInfo && this.containsPersonalInfo(password, userInfo)) {
      errors.push('Senha não pode conter informações pessoais');
    }

    // Verificar histórico de senhas
    if (this.isPasswordReused(password, previousPasswords)) {
      errors.push(`Senha não pode ser uma das últimas ${this.config.passwordHistoryCount} senhas utilizadas`);
    }

    // Calcular força da senha
    const strength = this.calculateStrength(password);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      strength,
      score: strength.score
    };
  }

  /**
   * Verificar se há caracteres repetidos excessivos
   * @param {string} password - Senha a verificar
   * @returns {boolean}
   */
  hasExcessiveRepeating(password) {
    let count = 1;
    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        count++;
        if (count > this.config.maxRepeatingChars) {
          return true;
        }
      } else {
        count = 1;
      }
    }
    return false;
  }

  /**
   * Verificar se é uma senha comum
   * @param {string} password - Senha a verificar
   * @returns {boolean}
   */
  isCommonPassword(password) {
    const lower = password.toLowerCase();
    return this.commonPasswords.has(lower) || 
           this.commonPasswords.has(password) ||
           /^(.)\1{2,}$/.test(password); // Senhas como 'aaaa' ou '1111'
  }

  /**
   * Verificar padrões de teclado
   * @param {string} password - Senha a verificar
   * @returns {boolean}
   */
  hasKeyboardPattern(password) {
    const lower = password.toLowerCase();
    return this.keyboardPatterns.some(pattern => 
      lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))
    );
  }

  /**
   * Verificar se contém informações pessoais
   * @param {string} password - Senha a verificar
   * @param {Object} userInfo - Informações do usuário
   * @returns {boolean}
   */
  containsPersonalInfo(password, userInfo) {
    const lower = password.toLowerCase();
    const personalData = [
      userInfo.name,
      userInfo.email?.split('@')[0],
      userInfo.username,
      userInfo.company,
      userInfo.phone
    ].filter(Boolean);

    return personalData.some(data => {
      if (data && data.length >= 3) {
        return lower.includes(data.toLowerCase());
      }
      return false;
    });
  }

  /**
   * Verificar se a senha foi reutilizada
   * @param {string} password - Nova senha
   * @param {Array} previousPasswords - Hashes das senhas anteriores
   * @returns {boolean}
   */
  isPasswordReused(password, previousPasswords) {
    if (!previousPasswords || previousPasswords.length === 0) {
      return false;
    }

    return previousPasswords.some(hash => {
      try {
        return bcrypt.compareSync(password, hash);
      } catch (error) {
        console.error('Error comparing password hash:', error);
        return false;
      }
    });
  }

  /**
   * Calcular força da senha
   * @param {string} password - Senha a avaliar
   * @returns {Object} Objeto com score e feedback
   */
  calculateStrength(password) {
    let score = 0;
    const feedback = [];

    // Comprimento (0-25 pontos)
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else if (password.length >= 6) score += 5;

    // Variedade de caracteres (0-25 pontos)
    let charTypes = 0;
    if (/[a-z]/.test(password)) charTypes++;
    if (/[A-Z]/.test(password)) charTypes++;
    if (/\d/.test(password)) charTypes++;
    if (/[^a-zA-Z0-9]/.test(password)) charTypes++;
    score += charTypes * 6.25;

    // Complexidade adicional (0-25 pontos)
    if (password.length >= 16) score += 5;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score += 5;
    if (!/(.)\1{2,}/.test(password)) score += 5; // Sem repetições
    if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(password.toLowerCase())) score += 5;
    if (password.length >= 20) score += 5;

    // Penalidades (0-25 pontos)
    let penalties = 0;
    if (this.isCommonPassword(password)) penalties += 15;
    if (this.hasKeyboardPattern(password)) penalties += 10;
    if (this.hasExcessiveRepeating(password)) penalties += 10;
    score -= Math.min(penalties, 25);

    // Normalizar score (0-100)
    score = Math.max(0, Math.min(100, score));

    // Determinar nível
    let level = 'Muito Fraca';
    let color = '#d32f2f';
    
    if (score >= 80) {
      level = 'Muito Forte';
      color = '#2e7d32';
    } else if (score >= 60) {
      level = 'Forte';
      color = '#388e3c';
    } else if (score >= 40) {
      level = 'Média';
      color = '#f57c00';
    } else if (score >= 20) {
      level = 'Fraca';
      color = '#f57c00';
    }

    // Gerar feedback
    if (password.length < 12) feedback.push('Use pelo menos 12 caracteres');
    if (!/[A-Z]/.test(password)) feedback.push('Adicione letras maiúsculas');
    if (!/[a-z]/.test(password)) feedback.push('Adicione letras minúsculas');
    if (!/\d/.test(password)) feedback.push('Adicione números');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Adicione caracteres especiais');
    if (this.isCommonPassword(password)) feedback.push('Evite senhas comuns');
    if (this.hasKeyboardPattern(password)) feedback.push('Evite padrões de teclado');

    return {
      score,
      level,
      color,
      feedback
    };
  }

  /**
   * Gerar senha segura
   * @param {number} length - Comprimento desejado (padrão 16)
   * @param {Object} options - Opções de geração
   * @returns {string} Senha gerada
   */
  generateSecurePassword(length = 16, options = {}) {
    const defaults = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true, // Excluir caracteres similares (0, O, l, 1, etc.)
      excludeAmbiguous: true // Excluir caracteres ambíguos
    };

    const config = { ...defaults, ...options };

    let charset = '';
    
    if (config.includeLowercase) {
      charset += config.excludeSimilar ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    
    if (config.includeUppercase) {
      charset += config.excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    
    if (config.includeNumbers) {
      charset += config.excludeSimilar ? '23456789' : '0123456789';
    }
    
    if (config.includeSymbols) {
      charset += config.excludeAmbiguous ? '!@#$%^&*-_=+' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    let password = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    // Garantir que a senha atende aos requisitos mínimos
    if (config.includeUppercase && !/[A-Z]/.test(password)) {
      const pos = Math.floor(Math.random() * length);
      const upperChars = config.excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      password = password.substring(0, pos) + upperChars[Math.floor(Math.random() * upperChars.length)] + password.substring(pos + 1);
    }

    return password;
  }

  /**
   * Hash de senha com salt
   * @param {string} password - Senha a ser hasheada
   * @returns {Promise<string>} Hash da senha
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.config.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Erro ao processar senha');
    }
  }

  /**
   * Verificar senha
   * @param {string} password - Senha fornecida
   * @param {string} hash - Hash armazenado
   * @returns {Promise<boolean>} True se a senha estiver correta
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Verificar se a senha expirou
   * @param {Date} passwordDate - Data da última alteração de senha
   * @returns {Object} Status de expiração
   */
  checkPasswordExpiry(passwordDate) {
    if (!passwordDate) {
      return { expired: true, daysLeft: 0, warning: false };
    }

    const now = new Date();
    const ageMs = now.getTime() - passwordDate.getTime();
    const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    const maxDays = Math.floor(this.config.maxAge / (24 * 60 * 60 * 1000));
    const daysLeft = maxDays - daysOld;
    const warningDays = Math.floor(this.config.warningPeriod / (24 * 60 * 60 * 1000));

    return {
      expired: daysLeft <= 0,
      daysLeft: Math.max(0, daysLeft),
      warning: daysLeft <= warningDays && daysLeft > 0,
      daysOld
    };
  }

  /**
   * Middleware para verificar política de senha
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  validatePasswordMiddleware(req, res, next) {
    const { password, confirmPassword } = req.body;
    const userInfo = {
      name: req.body.name || req.user?.name,
      email: req.body.email || req.user?.email,
      username: req.body.username || req.user?.username,
      company: req.body.company || req.user?.company,
      phone: req.body.phone || req.user?.phone
    };

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Password mismatch',
        message: 'Senhas não coincidem'
      });
    }

    // Validar senha
    const validation = this.validatePassword(password, userInfo);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Password policy violation',
        message: 'Senha não atende aos requisitos de segurança',
        errors: validation.errors,
        warnings: validation.warnings,
        strength: validation.strength
      });
    }

    // Adicionar informações de força da senha na resposta
    req.passwordStrength = validation.strength;
    next();
  }
}

// Instância singleton
const passwordPolicy = new PasswordPolicy();

module.exports = passwordPolicy;