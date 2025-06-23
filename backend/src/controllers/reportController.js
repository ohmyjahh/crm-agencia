/**
 * Report and Analytics Controller for CRM
 * Provides comprehensive reporting and analytics for tasks, clients, and performance
 */

const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { logPerformance } = require('../middleware/logger');

/**
 * Get dashboard summary with key metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardSummary = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';
    const { period = '30' } = req.query; // Days to look back
    
    const periodDays = parseInt(period);
    if (isNaN(periodDays) || periodDays < 1 || periodDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Período deve ser entre 1 e 365 dias',
        error: 'INVALID_PERIOD'
      });
    }
    
    // Base filter for user/admin access
    const baseFilter = isAdmin ? '' : 'AND t.assigned_to = ?';
    const baseParams = isAdmin ? [] : [userId];
    
    // 1. Task Statistics
    const taskStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'novo' THEN 1 END) as new_tasks,
        COUNT(CASE WHEN status = 'em_progresso' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelled_tasks,
        COUNT(CASE WHEN due_date < date('now') AND status NOT IN ('concluido', 'cancelado') THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN priority = 'urgente' THEN 1 END) as urgent_tasks,
        COUNT(CASE WHEN priority = 'alta' THEN 1 END) as high_priority_tasks
      FROM tasks t
      WHERE created_at >= date('now', '-${periodDays} days')
      ${baseFilter}
    `, baseParams);
    
    // 2. Task Completion Rate
    const completionRate = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_tasks,
        ROUND(
          (COUNT(CASE WHEN status = 'concluido' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(*), 0)), 2
        ) as completion_rate
      FROM tasks t
      WHERE created_at >= date('now', '-${periodDays} days')
      ${baseFilter}
    `, baseParams);
    
    // 3. Average Task Duration
    const avgDuration = await pool.query(`
      SELECT 
        AVG(julianday(completed_at) - julianday(created_at)) as avg_days,
        COUNT(*) as completed_count
      FROM tasks t
      WHERE status = 'concluido' 
        AND completed_at IS NOT NULL 
        AND completed_at >= date('now', '-${periodDays} days')
      ${baseFilter}
    `, baseParams);
    
    // 4. Tasks by Priority (last 30 days)
    const tasksByPriority = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed
      FROM tasks t
      WHERE created_at >= date('now', '-30 days')
      ${baseFilter}
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'urgente' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'media' THEN 3 
          WHEN 'baixa' THEN 4 
        END
    `, baseParams);
    
    // 5. Recent Activity (last 7 days)
    const recentActivity = await pool.query(`
      SELECT 
        date(created_at) as activity_date,
        COUNT(*) as tasks_created,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as tasks_completed
      FROM tasks t
      WHERE created_at >= date('now', '-7 days')
      ${baseFilter}
      GROUP BY date(created_at)
      ORDER BY activity_date DESC
    `, baseParams);
    
    // 6. Top Clients by Task Count (admin only)
    let topClients = [];
    if (isAdmin) {
      const clientStats = await pool.query(`
        SELECT 
          c.id,
          c.name,
          COUNT(t.id) as task_count,
          COUNT(CASE WHEN t.status = 'concluido' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN t.status = 'em_progresso' THEN 1 END) as active_tasks
        FROM clients c
        LEFT JOIN tasks t ON c.id = t.client_id 
          AND t.created_at >= date('now', '-${periodDays} days')
        WHERE c.is_active = 1
        GROUP BY c.id, c.name
        HAVING task_count > 0
        ORDER BY task_count DESC
        LIMIT 10
      `);
      topClients = clientStats.rows;
    }
    
    // 7. Performance Metrics
    const performanceMetrics = {
      averageCompletionTime: avgDuration.rows[0]?.avg_days ? 
        Math.round(avgDuration.rows[0].avg_days * 24 * 100) / 100 : 0, // Hours
      completionRate: completionRate.rows[0]?.completion_rate || 0,
      overdueRate: taskStats.rows[0]?.total_tasks > 0 ? 
        Math.round((taskStats.rows[0].overdue_tasks / taskStats.rows[0].total_tasks) * 100 * 100) / 100 : 0
    };
    
    const duration = Date.now() - startTime;
    logPerformance('dashboard_summary_query', duration, { userId, period: periodDays });
    
    res.json({
      success: true,
      data: {
        summary: taskStats.rows[0],
        completionMetrics: completionRate.rows[0],
        performanceMetrics,
        tasksByPriority: tasksByPriority.rows,
        recentActivity: recentActivity.rows,
        topClients,
        period: {
          days: periodDays,
          startDate: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      },
      message: 'Dashboard carregado com sucesso',
      meta: {
        queryTime: duration,
        dataPoints: taskStats.rows[0]?.total_tasks || 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get detailed task analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTaskAnalytics = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      clientId,
      assignedTo 
    } = req.query;
    
    // Validate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Data inicial não pode ser maior que data final',
        error: 'INVALID_DATE_RANGE'
      });
    }
    
    // Build filters
    let whereClause = 'WHERE t.created_at >= ? AND t.created_at <= ?';
    let params = [start.toISOString(), end.toISOString()];
    
    if (!isAdmin) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(userId);
    }
    
    if (clientId) {
      whereClause += ' AND t.client_id = ?';
      params.push(clientId);
    }
    
    if (assignedTo && isAdmin) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(assignedTo);
    }
    
    // Group by clause
    const groupByClause = groupBy === 'month' ? 
      "strftime('%Y-%m', t.created_at)" : 
      groupBy === 'week' ? 
      "strftime('%Y-W%W', t.created_at)" :
      "date(t.created_at)";
    
    // 1. Task creation and completion trends
    const trendData = await pool.query(`
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as created_count,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'em_progresso' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelled_count,
        AVG(CASE 
          WHEN status = 'concluido' AND completed_at IS NOT NULL 
          THEN julianday(completed_at) - julianday(created_at) 
        END) as avg_completion_days
      FROM tasks t
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY period DESC
      LIMIT 100
    `, params);
    
    // 2. Tasks by status distribution
    const statusDistribution = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks t2 ${whereClause})), 2) as percentage
      FROM tasks t
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `, params);
    
    // 3. Tasks by priority distribution
    const priorityDistribution = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks t2 ${whereClause})), 2) as percentage,
        AVG(CASE 
          WHEN status = 'concluido' AND completed_at IS NOT NULL 
          THEN julianday(completed_at) - julianday(created_at) 
        END) as avg_completion_days
      FROM tasks t
      ${whereClause}
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'urgente' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'media' THEN 3 
          WHEN 'baixa' THEN 4 
        END
    `, params);
    
    // 4. User performance (admin only)
    let userPerformance = [];
    if (isAdmin) {
      userPerformance = await pool.query(`
        SELECT 
          u.id,
          u.name,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'concluido' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN t.status = 'em_progresso' THEN 1 END) as active_tasks,
          COUNT(CASE WHEN t.due_date < date('now') AND t.status NOT IN ('concluido', 'cancelado') THEN 1 END) as overdue_tasks,
          ROUND(
            (COUNT(CASE WHEN t.status = 'concluido' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(t.id), 0)), 2
          ) as completion_rate,
          AVG(CASE 
            WHEN t.status = 'concluido' AND t.completed_at IS NOT NULL 
            THEN julianday(t.completed_at) - julianday(t.created_at) 
          END) as avg_completion_days
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assigned_to 
          AND t.created_at >= ? AND t.created_at <= ?
        WHERE u.is_active = 1 AND u.role = 'funcionario'
        GROUP BY u.id, u.name
        HAVING total_tasks > 0
        ORDER BY completion_rate DESC, total_tasks DESC
      `, [start.toISOString(), end.toISOString()]);
    }
    
    // 5. Overdue analysis
    const overdueAnalysis = await pool.query(`
      SELECT 
        COUNT(*) as total_overdue,
        AVG(julianday('now') - julianday(due_date)) as avg_days_overdue,
        COUNT(CASE WHEN priority = 'urgente' THEN 1 END) as urgent_overdue,
        COUNT(CASE WHEN priority = 'alta' THEN 1 END) as high_priority_overdue
      FROM tasks t
      ${whereClause}
        AND t.due_date < date('now')
        AND t.status NOT IN ('concluido', 'cancelado')
    `, params);
    
    const duration = Date.now() - startTime;
    logPerformance('task_analytics_query', duration, { 
      userId, 
      dateRange: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
      groupBy 
    });
    
    res.json({
      success: true,
      data: {
        trends: trendData.rows,
        statusDistribution: statusDistribution.rows,
        priorityDistribution: priorityDistribution.rows,
        userPerformance: userPerformance.rows || [],
        overdueAnalysis: overdueAnalysis.rows[0],
        filters: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          groupBy,
          clientId: clientId || null,
          assignedTo: assignedTo || null
        }
      },
      message: 'Analytics de tarefas carregado com sucesso',
      meta: {
        queryTime: duration,
        dataPoints: trendData.rows.length
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar analytics de tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get client analytics and performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClientAnalytics = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const isAdmin = req.user.role === 'administrador';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar analytics de clientes.',
        error: 'ACCESS_DENIED'
      });
    }
    
    const { period = '90' } = req.query;
    const periodDays = parseInt(period);
    
    // 1. Client Overview
    const clientOverview = await pool.query(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_clients,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_clients_last_30_days
      FROM clients
    `);
    
    // 2. Clients by Category
    const clientsByCategory = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM clients WHERE is_active = 1)), 2) as percentage
      FROM clients
      WHERE is_active = 1
      GROUP BY category
      ORDER BY count DESC
    `);
    
    // 3. Clients by Service Format
    const clientsByServiceFormat = await pool.query(`
      SELECT 
        service_format,
        COUNT(*) as count,
        AVG(average_ticket) as avg_ticket,
        SUM(total_purchases) as total_purchases
      FROM clients
      WHERE is_active = 1
      GROUP BY service_format
      ORDER BY count DESC
    `);
    
    // 4. Top Clients by Value
    const topClientsByValue = await pool.query(`
      SELECT 
        id,
        name,
        category,
        service_format,
        average_ticket,
        total_purchases,
        (average_ticket * total_purchases) as total_value,
        last_purchase_date
      FROM clients
      WHERE is_active = 1 AND total_purchases > 0
      ORDER BY total_value DESC
      LIMIT 20
    `);
    
    // 5. Client Task Activity
    const clientTaskActivity = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.category,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'concluido' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'em_progresso' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN t.due_date < date('now') AND t.status NOT IN ('concluido', 'cancelado') THEN 1 END) as overdue_tasks,
        MAX(t.created_at) as last_task_date
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id 
        AND t.created_at >= date('now', '-${periodDays} days')
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.category
      HAVING total_tasks > 0
      ORDER BY total_tasks DESC
      LIMIT 50
    `);
    
    // 6. Monthly Client Growth
    const clientGrowth = await pool.query(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as new_clients,
        SUM(COUNT(*)) OVER (ORDER BY strftime('%Y-%m', created_at)) as cumulative_clients
      FROM clients
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);
    
    const duration = Date.now() - startTime;
    logPerformance('client_analytics_query', duration, { period: periodDays });
    
    res.json({
      success: true,
      data: {
        overview: clientOverview.rows[0],
        byCategory: clientsByCategory.rows,
        byServiceFormat: clientsByServiceFormat.rows,
        topClientsByValue: topClientsByValue.rows,
        taskActivity: clientTaskActivity.rows,
        growth: clientGrowth.rows,
        period: {
          days: periodDays,
          startDate: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      },
      message: 'Analytics de clientes carregado com sucesso',
      meta: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar analytics de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get system performance metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemMetrics = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const isAdmin = req.user.role === 'administrador';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar métricas do sistema.',
        error: 'ACCESS_DENIED'
      });
    }
    
    // 1. Database Statistics
    const dbStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
        (SELECT COUNT(*) FROM clients WHERE is_active = 1) as active_clients,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM task_comments) as total_comments,
        (SELECT COUNT(*) FROM task_attachments) as total_attachments,
        (SELECT COUNT(*) FROM task_history) as total_history_entries
    `);
    
    // 2. Recent Activity Summary (last 24 hours)
    const recentActivity = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tasks WHERE created_at >= datetime('now', '-1 day')) as tasks_created_24h,
        (SELECT COUNT(*) FROM task_comments WHERE created_at >= datetime('now', '-1 day')) as comments_added_24h,
        (SELECT COUNT(*) FROM task_attachments WHERE created_at >= datetime('now', '-1 day')) as files_uploaded_24h,
        (SELECT COUNT(*) FROM tasks WHERE updated_at >= datetime('now', '-1 day')) as tasks_updated_24h
    `);
    
    // 3. User Activity
    const userActivity = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(DISTINCT t.id) as tasks_assigned,
        COUNT(DISTINCT tc.id) as comments_made,
        COUNT(DISTINCT ta.id) as files_uploaded,
        MAX(COALESCE(t.updated_at, tc.created_at, ta.created_at)) as last_activity
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.created_at >= date('now', '-30 days')
      LEFT JOIN task_comments tc ON u.id = tc.user_id AND tc.created_at >= date('now', '-30 days')
      LEFT JOIN task_attachments ta ON u.id = ta.user_id AND ta.created_at >= date('now', '-30 days')
      WHERE u.is_active = 1
      GROUP BY u.id, u.name, u.role
      ORDER BY last_activity DESC
    `);
    
    // 4. System Health Indicators
    const systemHealth = {
      avgResponseTime: 0, // This would come from monitoring system
      errorRate: 0, // This would come from monitoring system
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
    const duration = Date.now() - startTime;
    logPerformance('system_metrics_query', duration);
    
    res.json({
      success: true,
      data: {
        database: dbStats.rows[0],
        recentActivity: recentActivity.rows[0],
        userActivity: userActivity.rows,
        systemHealth
      },
      message: 'Métricas do sistema carregadas com sucesso',
      meta: {
        queryTime: duration,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar métricas do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Export report data in different formats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportReport = async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';
    
    if (!['tasks', 'clients', 'analytics'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de relatório inválido. Use: tasks, clients, analytics',
        error: 'INVALID_REPORT_TYPE'
      });
    }
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Formato inválido. Use: json, csv',
        error: 'INVALID_FORMAT'
      });
    }
    
    let data = [];
    let filename = '';
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();
    
    switch (type) {
      case 'tasks':
        const taskFilter = isAdmin ? '' : 'AND assigned_to = ?';
        const taskParams = isAdmin ? [start, end] : [start, end, userId];
        
        const taskData = await pool.query(`
          SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.created_at,
            t.due_date,
            t.completed_at,
            c.name as client_name,
            assigned_user.name as assigned_to_name,
            created_user.name as created_by_name
          FROM tasks t
          LEFT JOIN clients c ON t.client_id = c.id
          LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
          LEFT JOIN users created_user ON t.created_by = created_user.id
          WHERE t.created_at >= ? AND t.created_at <= ?
          ${taskFilter}
          ORDER BY t.created_at DESC
        `, taskParams);
        
        data = taskData.rows;
        filename = `tasks_report_${start.split('T')[0]}_to_${end.split('T')[0]}`;
        break;
        
      case 'clients':
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado. Apenas administradores podem exportar relatórios de clientes.',
            error: 'ACCESS_DENIED'
          });
        }
        
        const clientData = await pool.query(`
          SELECT 
            c.id,
            c.name,
            c.email,
            c.phone,
            c.category,
            c.service_format,
            c.average_ticket,
            c.total_purchases,
            c.created_at,
            COUNT(t.id) as total_tasks
          FROM clients c
          LEFT JOIN tasks t ON c.id = t.client_id
          WHERE c.is_active = 1
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `);
        
        data = clientData.rows;
        filename = `clients_report_${new Date().toISOString().split('T')[0]}`;
        break;
    }
    
    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum dado encontrado para exportação',
          error: 'NO_DATA_FOUND'
        });
      }
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data,
        message: 'Relatório exportado com sucesso',
        meta: {
          type,
          format,
          recordCount: data.length,
          exportedAt: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

module.exports = {
  getDashboardSummary,
  getTaskAnalytics,
  getClientAnalytics,
  getSystemMetrics,
  exportReport
};