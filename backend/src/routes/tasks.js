const express = require('express');
const { body, param } = require('express-validator');
const authenticateToken = require('../middleware/auth-simple');
const { canManageTasks, requireAdmin } = require('../middleware/authorize');
const { uploadTaskSingle, handleTaskUploadError } = require('../middleware/taskUpload');
// const { 
//   standardLimiter, 
//   // uploadLimiter, 
//   heavyOperationsLimiter,
//   burstLimiter 
// } = require('../middleware/rateLimit');
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
    .isIn(['novo', 'em_progresso', 'aguardando_validacao', 'concluido', 'cancelado'])
    .withMessage('Status deve ser: novo, em_progresso, aguardando_validacao, concluido ou cancelado'),
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

// Validação para taskId em parâmetros
const taskIdParamValidation = [
  param('taskId')
    .notEmpty()
    .withMessage('ID da tarefa é obrigatório')
];

// Validação para comentários
const commentValidation = [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comentário deve ter entre 1 e 1000 caracteres'),
  body('is_internal')
    .optional()
    .isBoolean()
    .withMessage('is_internal deve ser um valor booleano')
];

// Validação para status update
const statusUpdateValidation = [
  body('status')
    .isIn(['novo', 'em_progresso', 'aguardando_validacao', 'concluido', 'cancelado'])
    .withMessage('Status deve ser: novo, em_progresso, aguardando_validacao, concluido ou cancelado')
];

// Aplicar autenticação e rate limiting básico a todas as rotas
router.use(authenticateToken);
// router.use(standardLimiter);

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

// Rotas para comentários
router.post('/:taskId/comments', [...taskIdParamValidation, ...commentValidation], canManageTasks, taskController.addComment);
router.get('/:taskId/comments', taskIdParamValidation, canManageTasks, taskController.getTaskComments);

// Rotas para histórico
router.get('/:taskId/history', taskIdParamValidation, canManageTasks, taskController.getTaskHistory);

// Rota para atualização de status (método simplificado)
router.patch('/:taskId/status', [...taskIdParamValidation, ...statusUpdateValidation], canManageTasks, taskController.updateTaskStatus);

// Rotas para anexos
router.post('/:taskId/attachments', 
  // uploadLimiter,
  taskIdParamValidation, 
  canManageTasks, 
  uploadTaskSingle, 
  handleTaskUploadError, 
  taskController.uploadTaskAttachment
);

router.get('/:taskId/attachments', 
  taskIdParamValidation, 
  canManageTasks, 
  taskController.getTaskAttachments
);

router.get('/:taskId/attachments/:attachmentId/download', 
  [
    ...taskIdParamValidation,
    param('attachmentId').notEmpty().withMessage('ID do anexo é obrigatório')
  ], 
  canManageTasks, 
  taskController.downloadTaskAttachment
);

router.delete('/:taskId/attachments/:attachmentId', 
  [
    ...taskIdParamValidation,
    param('attachmentId').notEmpty().withMessage('ID do anexo é obrigatório')
  ], 
  canManageTasks, 
  taskController.deleteTaskAttachment
);

// Rotas para notificações
router.get('/overdue', canManageTasks, taskController.getOverdueTasks);
router.get('/upcoming', canManageTasks, taskController.getUpcomingTasks);

module.exports = router;