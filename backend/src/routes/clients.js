const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { canManageClients } = require('../middleware/authorize');
const { uploadImportSingle, handleImportUploadError } = require('../middleware/clientImport');
const clientController = require('../controllers/clientController');

const router = express.Router();

// Validações para criação/edição de cliente
const clientValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Telefone deve ter no máximo 50 caracteres'),
  body('document')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Documento deve ter no máximo 50 caracteres')
    .custom((value, { req }) => {
      if (value && req.body.document_type) {
        if (req.body.document_type === 'CPF') {
          // Validação básica de CPF (só formato)
          const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
          if (!cpfRegex.test(value)) {
            throw new Error('CPF deve estar no formato 000.000.000-00 ou 00000000000');
          }
        } else if (req.body.document_type === 'CNPJ') {
          // Validação básica de CNPJ (só formato)
          const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
          if (!cnpjRegex.test(value)) {
            throw new Error('CNPJ deve estar no formato 00.000.000/0000-00 ou 00000000000000');
          }
        }
      }
      return true;
    }),
  body('document_type')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['CPF', 'CNPJ'])
    .withMessage('Tipo de documento deve ser CPF ou CNPJ'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Endereço deve ter no máximo 500 caracteres'),
  body('city')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  body('state')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Estado deve ter no máximo 50 caracteres'),
  body('zip_code')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 })
    .withMessage('CEP deve ter no máximo 20 caracteres'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres')
];

// Validação para ID de cliente
const clientIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID do cliente é obrigatório')
];

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rotas públicas para funcionários (podem gerenciar clientes)
router.get('/', canManageClients, clientController.getClients);
// Rotas de Import/Export devem vir antes das rotas com parâmetro :id
router.post('/import', canManageClients, uploadImportSingle, handleImportUploadError, clientController.importClients);
router.get('/export', canManageClients, clientController.exportClients);

router.get('/:id', clientIdValidation, canManageClients, clientController.getClientById);
router.post('/', clientValidation, canManageClients, clientController.createClient);
router.put('/:id', [...clientIdValidation, ...clientValidation], canManageClients, clientController.updateClient);

// Rotas administrativas (só admin pode desativar/reativar)
router.delete('/:id', clientIdValidation, (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Apenas administradores podem desativar clientes' });
  }
  next();
}, clientController.deleteClient);

router.patch('/:id/activate', clientIdValidation, (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Apenas administradores podem reativar clientes' });
  }
  next();
}, clientController.activateClient);

module.exports = router;