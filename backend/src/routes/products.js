const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth-simple');

// Middleware para todas as rotas (autenticação obrigatória)
router.use(auth);

// Validações
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome é obrigatório e deve ter no máximo 255 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Categoria deve ter no máximo 100 caracteres'),
  body('tags')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Tags devem ter no máximo 500 caracteres'),
  body('average_ticket')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ticket médio deve ser um valor positivo'),
  body('status')
    .optional()
    .isIn(['ativo', 'inativo'])
    .withMessage('Status deve ser "ativo" ou "inativo"')
];

// Rotas
router.get('/', productController.getProducts);
router.get('/active', productController.getActiveProducts);
router.get('/:id', productController.getProductById);
router.post('/', productValidation, productController.createProduct);
router.put('/:id', productValidation, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;