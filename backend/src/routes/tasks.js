const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { canManageTasks, requireAdmin } = require('../middleware/authorize');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Validações para criação/edição de tarefa
const taskValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Título deve ter entre 3 e 255 caracteres'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('client_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('ID do cliente inválido'),
  body('project_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('ID do projeto inválido'),
  body('assigned_to')
    .notEmpty()
    .withMessage('Usuário atribuído é obrigatório'),
  body('priority')
    .optional()
    .isIn(['baixa', 'media', 'alta', 'urgente'])
    .withMessage('Prioridade deve ser: baixa, media, alta ou urgente'),
  body('status')
    .optional()
    .isIn(['pendente', 'em_progresso', 'concluida', 'cancelada'])
    .withMessage('Status deve ser: pendente, em_progresso, concluida ou cancelada'),
  body('due_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Data de vencimento deve estar no formato válido (YYYY-MM-DD)')
    .custom((value) => {
      if (value && new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Data de vencimento não pode ser no passado');
      }
      return true;
    })
];

// Validação para ID de tarefa
const taskIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID da tarefa é obrigatório')
];

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rotas públicas para funcionários
router.get('/', canManageTasks, taskController.getTasks);
router.get('/stats', canManageTasks, taskController.getTaskStats);
router.get('/users', canManageTasks, taskController.getUsers);
router.get('/:id', taskIdValidation, canManageTasks, taskController.getTaskById);

// Rotas para criação e edição (todos podem criar/editar suas tarefas)
router.post('/', taskValidation, canManageTasks, taskController.createTask);
router.put('/:id', [...taskIdValidation, ...taskValidation], canManageTasks, taskController.updateTask);

// Rota administrativa (só admin pode deletar)
router.delete('/:id', taskIdValidation, requireAdmin, taskController.deleteTask);

module.exports = router;