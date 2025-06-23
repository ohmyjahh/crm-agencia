const express = require('express');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/auth-simple');
const authController = require('../controllers/authController');

const router = express.Router();

// Validações para login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
];

// Validações para registro
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('role')
    .optional()
    .isIn(['administrador', 'funcionario'])
    .withMessage('Role deve ser "administrador" ou "funcionario"')
];

// Validações para alterar senha
const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 6 })
    .withMessage('Senha atual deve ter pelo menos 6 caracteres'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Nova senha deve ser diferente da senha atual');
      }
      return true;
    })
];

// Rotas públicas
router.post('/login', loginValidation, authController.login);

// Rotas protegidas (requerem autenticação)
router.get('/me', authenticateToken, authController.me);
router.post('/change-password', authenticateToken, changePasswordValidation, authController.changePassword);

// Rota para registro (protegida - apenas admin pode criar usuários)
router.post('/register', authenticateToken, registerValidation, (req, res, next) => {
  // Verificar se usuário é admin
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem criar usuários.' });
  }
  next();
}, authController.register);

module.exports = router;