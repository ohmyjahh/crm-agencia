const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorAuth {
  constructor() {
    this.serviceName = 'CRM System';
    this.issuer = 'Agência CRM';
  }

  /**
   * Gerar segredo 2FA para um usuário
   * @param {string} userEmail - Email do usuário
   * @param {string} userName - Nome do usuário
   * @returns {Object} Objeto com secret, otpauth_url e backup_codes
   */
  generateSecret(userEmail, userName) {
    try {
      // Gerar secret único
      const secret = speakeasy.generateSecret({
        name: `${this.serviceName} (${userEmail})`,
        account: userEmail,
        issuer: this.issuer,
        length: 32
      });

      // Gerar códigos de backup
      const backupCodes = this.generateBackupCodes();

      return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
        backup_codes: backupCodes,
        qr_code_url: null // Será preenchido pelo método generateQRCode
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Erro ao gerar segredo 2FA');
    }
  }

  /**
   * Gerar QR Code para o secret 2FA
   * @param {string} otpauthUrl - URL do OTP Auth
   * @returns {Promise<string>} Data URL do QR Code
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Verificar código TOTP
   * @param {string} token - Token fornecido pelo usuário
   * @param {string} secret - Secret base32 do usuário
   * @param {number} window - Janela de tolerância (padrão 2)
   * @returns {boolean} True se o token for válido
   */
  verifyToken(token, secret, window = 2) {
    try {
      // Remover espaços e validar formato
      const cleanToken = token.replace(/\s/g, '');
      
      if (!/^\d{6}$/.test(cleanToken)) {
        return false;
      }

      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: window,
        step: 30
      });

      return verified;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Gerar códigos de backup
   * @param {number} count - Número de códigos a gerar (padrão 10)
   * @returns {Array<string>} Array de códigos de backup
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 dígitos
      const code = crypto.randomInt(10000000, 99999999).toString();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Verificar código de backup
   * @param {string} code - Código de backup fornecido
   * @param {Array<string>} backupCodes - Array de códigos válidos
   * @returns {boolean} True se o código for válido
   */
  verifyBackupCode(code, backupCodes) {
    try {
      const cleanCode = code.replace(/\s/g, '');
      return backupCodes.includes(cleanCode);
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Remover código de backup usado
   * @param {string} usedCode - Código que foi usado
   * @param {Array<string>} backupCodes - Array atual de códigos
   * @returns {Array<string>} Array atualizado sem o código usado
   */
  removeUsedBackupCode(usedCode, backupCodes) {
    const cleanCode = usedCode.replace(/\s/g, '');
    return backupCodes.filter(code => code !== cleanCode);
  }

  /**
   * Validar se o usuário tem 2FA configurado
   * @param {Object} user - Objeto do usuário
   * @returns {boolean} True se 2FA estiver configurado
   */
  isEnabled(user) {
    return !!(user.two_factor_secret && user.two_factor_enabled);
  }

  /**
   * Gerar token temporário para setup 2FA
   * @param {number} userId - ID do usuário
   * @returns {string} Token temporário
   */
  generateSetupToken(userId) {
    const data = {
      userId,
      purpose: '2fa_setup',
      timestamp: Date.now()
    };
    
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Verificar token temporário para setup 2FA
   * @param {string} token - Token a verificar
   * @param {number} userId - ID do usuário
   * @param {number} maxAge - Idade máxima em ms (padrão 10 minutos)
   * @returns {boolean} True se o token for válido
   */
  verifySetupToken(token, userId, maxAge = 10 * 60 * 1000) {
    try {
      const data = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Verificar estrutura
      if (data.userId !== userId || data.purpose !== '2fa_setup') {
        return false;
      }
      
      // Verificar idade
      const age = Date.now() - data.timestamp;
      if (age > maxAge) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Middleware para verificar 2FA obrigatório
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  requireTwoFactor(req, res, next) {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não autenticado'
      });
    }

    // Verificar se 2FA está habilitado para o usuário
    if (!this.isEnabled(user)) {
      return res.status(403).json({
        error: '2FA required',
        message: '2FA é obrigatório para esta ação',
        requires_2fa_setup: true
      });
    }

    // Verificar se a sessão tem verificação 2FA válida
    if (!req.session.twoFactorVerified || 
        (Date.now() - req.session.twoFactorVerifiedAt) > 30 * 60 * 1000) { // 30 minutos
      return res.status(403).json({
        error: '2FA verification required',
        message: 'Verificação 2FA necessária',
        requires_2fa_verification: true
      });
    }

    next();
  }

  /**
   * Middleware para marcar sessão como verificada por 2FA
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  markSessionVerified(req, res, next) {
    req.session.twoFactorVerified = true;
    req.session.twoFactorVerifiedAt = Date.now();
    next();
  }

  /**
   * Limpar verificação 2FA da sessão
   * @param {Object} req - Request object
   */
  clearSessionVerification(req) {
    if (req.session) {
      delete req.session.twoFactorVerified;
      delete req.session.twoFactorVerifiedAt;
    }
  }

  /**
   * Gerar configuração completa de 2FA para um usuário
   * @param {string} userEmail - Email do usuário
   * @param {string} userName - Nome do usuário
   * @returns {Promise<Object>} Configuração completa com QR code
   */
  async generateComplete2FASetup(userEmail, userName) {
    try {
      const setup = this.generateSecret(userEmail, userName);
      setup.qr_code_url = await this.generateQRCode(setup.otpauth_url);
      
      return setup;
    } catch (error) {
      console.error('Error generating complete 2FA setup:', error);
      throw new Error('Erro ao configurar 2FA');
    }
  }

  /**
   * Verificar se um token é válido (TOTP ou backup code)
   * @param {string} token - Token fornecido
   * @param {string} secret - Secret do usuário
   * @param {Array<string>} backupCodes - Códigos de backup
   * @returns {Object} Resultado da verificação
   */
  verifyAnyToken(token, secret, backupCodes = []) {
    // Primeiro tentar TOTP
    if (this.verifyToken(token, secret)) {
      return {
        valid: true,
        type: 'totp',
        remainingBackupCodes: backupCodes
      };
    }

    // Se TOTP falhar, tentar backup code
    if (this.verifyBackupCode(token, backupCodes)) {
      const updatedBackupCodes = this.removeUsedBackupCode(token, backupCodes);
      return {
        valid: true,
        type: 'backup',
        remainingBackupCodes: updatedBackupCodes
      };
    }

    return {
      valid: false,
      type: null,
      remainingBackupCodes: backupCodes
    };
  }
}

// Instância singleton
const twoFactorAuth = new TwoFactorAuth();

module.exports = twoFactorAuth;