const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const followupController = require('../controllers/followupController');
const auth = require('../middleware/auth-simple');

// Middleware para todas as rotas (autenticação obrigatória)
router.use(auth);

// Validações
const sequenceValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome é obrigatório e deve ter no máximo 255 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('steps')
    .optional()
    .isArray()
    .withMessage('Passos devem ser um array'),
  body('steps.*.day_offset')
    .if(body('steps').exists())
    .isInt({ min: 0 })
    .withMessage('Dia do contato deve ser um número positivo'),
  body('steps.*.interaction_type')
    .if(body('steps').exists())
    .isIn(['ligacao', 'email', 'whatsapp', 'reuniao', 'outro'])
    .withMessage('Tipo de interação inválido'),
  body('steps.*.title')
    .if(body('steps').exists())
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Título do passo é obrigatório')
];

const assignmentValidation = [
  body('client_id')
    .notEmpty()
    .withMessage('Cliente é obrigatório'),
  body('sequence_id')
    .notEmpty()
    .withMessage('Cadência é obrigatória'),
  body('responsible_user')
    .notEmpty()
    .withMessage('Responsável é obrigatório'),
  body('start_date')
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida')
];

// Rotas para Cadências
router.get('/sequences', followupController.getSequences);
router.get('/sequences/active', followupController.getActiveSequences);
router.get('/sequences/:id', followupController.getSequenceById);
router.post('/sequences', sequenceValidation, followupController.createSequence);

// Rotas para Atribuições
router.get('/assignments', followupController.getClientAssignments);
router.post('/assignments', assignmentValidation, followupController.assignSequenceToClient);

// Rotas para Meus Follow-ups
router.get('/my-followups', followupController.getMyFollowups);
router.put('/my-followups/:id/complete', followupController.completeFollowup);
router.put('/my-followups/:id/skip', followupController.skipFollowup);

module.exports = router;