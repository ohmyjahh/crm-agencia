const express = require('express');
const { body, param } = require('express-validator');
const authenticateToken = require('../middleware/auth-simple');
const { canManageClients } = require('../middleware/authorize');
const serviceController = require('../controllers/serviceController');

const router = express.Router();

// Validações para serviço
const serviceValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('category')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Categoria deve ter no máximo 50 caracteres'),
  body('base_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Preço base deve ser um número positivo'),
  body('service_type')
    .isIn(['recorrente', 'avulso', 'personalizado'])
    .withMessage('Tipo de serviço deve ser: recorrente, avulso ou personalizado'),
  body('estimated_hours')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Horas estimadas deve ser um número inteiro positivo')
];

// Validações para compra do cliente
const purchaseValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser maior que zero'),
  body('purchase_date')
    .isISO8601()
    .withMessage('Data da compra deve estar no formato válido (YYYY-MM-DD)'),
  body('service_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('ID do serviço inválido'),
  body('payment_method')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Método de pagamento deve ter no máximo 50 caracteres'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres')
];

// Validações para contratação de serviço
const clientServiceValidation = [
  body('service_id')
    .notEmpty()
    .withMessage('ID do serviço é obrigatório'),
  body('contract_date')
    .isISO8601()
    .withMessage('Data do contrato deve estar no formato válido (YYYY-MM-DD)'),
  body('end_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Data de fim deve estar no formato válido (YYYY-MM-DD)'),
  body('monthly_value')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Valor mensal deve ser um número positivo'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres')
];

// Validação para ID
const idValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID é obrigatório')
];

const clientIdValidation = [
  param('clientId')
    .notEmpty()
    .withMessage('ID do cliente é obrigatório')
];

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);
router.use(canManageClients);

// Rotas de serviços
router.get('/', serviceController.getServices);
router.get('/:id', idValidation, serviceController.getServiceById);
router.post('/', serviceValidation, serviceController.createService);
router.put('/:id', [...idValidation, ...serviceValidation], serviceController.updateService);
router.delete('/:id', idValidation, serviceController.deleteService);

// Rotas de histórico de compras dos clientes
router.get('/clients/:clientId/purchases', clientIdValidation, serviceController.getClientPurchases);
router.post('/clients/:clientId/purchases', [...clientIdValidation, ...purchaseValidation], serviceController.createClientPurchase);

// Rotas de serviços contratados pelos clientes
router.get('/clients/:clientId/services', clientIdValidation, serviceController.getClientServices);
router.post('/clients/:clientId/services', [...clientIdValidation, ...clientServiceValidation], serviceController.createClientService);

module.exports = router;