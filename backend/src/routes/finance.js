const express = require('express');
const { body, param, query } = require('express-validator');
const authenticateToken = require('../middleware/auth-simple');
const { canManageFinances } = require('../middleware/authorize');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const financeController = require('../controllers/financeController');

const router = express.Router();

// Validações para transação financeira
const transactionValidation = [
  body('type')
    .isIn(['entrada', 'saida'])
    .withMessage('Tipo deve ser "entrada" ou "saida"'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser maior que zero'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Descrição deve ter entre 3 e 500 caracteres'),
  body('category_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('ID da categoria inválido'),
  body('client_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('ID do cliente inválido'),
  body('project_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('ID do projeto inválido'),
  body('transaction_date')
    .isISO8601()
    .withMessage('Data da transação deve estar no formato válido (YYYY-MM-DD)'),
  body('payment_method')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Método de pagamento deve ter no máximo 50 caracteres'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres')
];

// Validações para upload de DRE
const dreUploadValidation = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Mês deve ser entre 1 e 12'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Ano deve ser entre 2020 e 2030'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage('Descrição deve ter no máximo 255 caracteres')
];

// Validação para ID
const idValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID é obrigatório')
];

// Aplicar autenticação a todas as rotas (apenas admins podem gerenciar finanças)
router.use(authenticateToken);
router.use(canManageFinances);

// Rotas de transações
router.get('/transactions', financeController.getTransactions);
router.get('/transactions/stats', financeController.getFinanceStats);
router.get('/transactions/:id', idValidation, financeController.getTransactionById);
router.post('/transactions', transactionValidation, financeController.createTransaction);
router.put('/transactions/:id', [...idValidation, ...transactionValidation], financeController.updateTransaction);
router.delete('/transactions/:id', idValidation, financeController.deleteTransaction);

// Rotas de categorias
router.get('/categories', financeController.getCategories);
router.post('/categories', financeController.createCategory);

// Rotas de formas de pagamento
router.get('/payment-methods', financeController.getPaymentMethods);
router.post('/payment-methods', financeController.createPaymentMethod);

// Rotas de DRE com IA
router.post('/dre/upload', 
  uploadSingle, 
  handleUploadError, 
  dreUploadValidation, 
  financeController.uploadDREFile
);

router.post('/dre/process/:file_id', 
  idValidation, 
  financeController.processDREWithAI
);

// Rota para listar uploads de DRE
router.get('/dre/uploads', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = `
      SELECT d.*, u.name as uploaded_by_name
      FROM dre_uploads d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    let params = [];

    if (month && year) {
      query += ' AND d.month = ? AND d.year = ?';
      params.push(parseInt(month), parseInt(year));
    }

    query += ' ORDER BY d.uploaded_at DESC';

    const pool = require('../config/database');
    const result = await pool.query(query, params);

    res.json({ uploads: result.rows });
  } catch (error) {
    console.error('Erro ao buscar uploads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;