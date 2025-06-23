/**
 * Report Routes for CRM API
 * Handles dashboard, analytics, and reporting endpoints
 */

const express = require('express');
const { query } = require('express-validator');
const authenticateToken = require('../middleware/auth-simple');
const { canManageTasks, requireAdmin } = require('../middleware/authorize');
// const { 
//   standardLimiter, 
//   heavyOperationsLimiter 
// } = require('../middleware/rateLimit');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Validation for date range queries
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data inicial deve estar no formato YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data final deve estar no formato YYYY-MM-DD'),
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Período deve ser entre 1 e 365 dias')
];

// Validation for analytics queries
const analyticsValidation = [
  ...dateRangeValidation,
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('groupBy deve ser: day, week, ou month'),
  query('clientId')
    .optional()
    .notEmpty()
    .withMessage('ID do cliente inválido'),
  query('assignedTo')
    .optional()
    .notEmpty()
    .withMessage('ID do usuário inválido')
];

// Validation for export queries
const exportValidation = [
  query('type')
    .isIn(['tasks', 'clients', 'analytics'])
    .withMessage('Tipo deve ser: tasks, clients, ou analytics'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Formato deve ser: json ou csv'),
  ...dateRangeValidation
];

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
// router.use(standardLimiter);

/**
 * Dashboard and Summary Routes
 */

// GET /api/reports/dashboard - Get dashboard summary
router.get('/dashboard', 
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Período deve ser entre 1 e 365 dias'),
  // heavyOperationsLimiter,
  canManageTasks,
  reportController.getDashboardSummary
);

/**
 * Analytics Routes
 */

// GET /api/reports/analytics/tasks - Get detailed task analytics
router.get('/analytics/tasks',
  analyticsValidation,
  // heavyOperationsLimiter,
  canManageTasks,
  reportController.getTaskAnalytics
);

// GET /api/reports/analytics/clients - Get client analytics (admin only)
router.get('/analytics/clients',
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Período deve ser entre 1 e 365 dias'),
  // heavyOperationsLimiter,
  requireAdmin,
  reportController.getClientAnalytics
);

// GET /api/reports/analytics/system - Get system performance metrics (admin only)
router.get('/analytics/system',
  // heavyOperationsLimiter,
  requireAdmin,
  reportController.getSystemMetrics
);

/**
 * Export Routes
 */

// GET /api/reports/export - Export report data
router.get('/export',
  exportValidation,
  // heavyOperationsLimiter,
  canManageTasks,
  reportController.exportReport
);

module.exports = router;