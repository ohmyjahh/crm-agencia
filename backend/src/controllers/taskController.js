const { validationResult } = require('express-validator');
const pool = require('../config/database');
const path = require('path');
const { deleteTaskFile, getFileInfo } = require('../middleware/taskUpload');

// Helper function to log task history
const logTaskHistory = async (taskId, userId, action, fieldName = null, oldValue = null, newValue = null, description = null) => {
  try {
    await pool.query(`
      INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [taskId, userId, action, fieldName, oldValue, newValue, description]);
  } catch (error) {
    console.error('Erro ao registrar histórico da tarefa:', error);
    // Não vamos interromper a operação principal por falha no log
  }
};

// Helper function to check task permissions
const checkTaskPermission = async (taskId, userId, isAdmin = false) => {
  try {
    let query = 'SELECT * FROM tasks WHERE id = ?';
    let params = [taskId];

    if (!isAdmin) {
      query += ' AND (assigned_to = ? OR created_by = ?)';
      params.push(userId, userId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Erro ao verificar permissão da tarefa:', error);
    return null;
  }
};

// Listar tarefas com filtros
const getTasks = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      assigned_to, 
      client_id,
      my_tasks = 'false' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    let query = `
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    // Se não for admin e my_tasks for true, só mostrar tarefas do usuário
    if (!isAdmin || my_tasks === 'true') {
      query += ` AND t.assigned_to = ?`;
      params.push(userId);
    }

    // Filtro por usuário atribuído (só admin pode filtrar por outros usuários)
    if (assigned_to && isAdmin) {
      query += ` AND t.assigned_to = ?`;
      params.push(assigned_to);
    }

    // Filtro por status
    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    // Filtro por prioridade
    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    // Filtro por cliente
    if (client_id) {
      query += ` AND t.client_id = ?`;
      params.push(client_id);
    }

    // Filtro de busca
    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ? OR c.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Ordenação e paginação
    query += ` ORDER BY 
      CASE t.priority 
        WHEN 'urgente' THEN 1 
        WHEN 'alta' THEN 2 
        WHEN 'media' THEN 3 
        WHEN 'baixa' THEN 4 
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
      LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE 1=1
    `;
    let countParams = [];

    if (!isAdmin || my_tasks === 'true') {
      countQuery += ` AND t.assigned_to = ?`;
      countParams.push(userId);
    }

    if (assigned_to && isAdmin) {
      countQuery += ` AND t.assigned_to = ?`;
      countParams.push(assigned_to);
    }

    if (status) {
      countQuery += ` AND t.status = ?`;
      countParams.push(status);
    }

    if (priority) {
      countQuery += ` AND t.priority = ?`;
      countParams.push(priority);
    }

    if (client_id) {
      countQuery += ` AND t.client_id = ?`;
      countParams.push(client_id);
    }

    if (search) {
      countQuery += ` AND (t.title LIKE ? OR t.description LIKE ? OR c.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0].total;

    res.json({
      success: true,
      data: result.rows,
      message: 'Tarefas carregadas com sucesso',
      meta: {
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_records: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar tarefa por ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    let query = `
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      WHERE t.id = ?
    `;

    // Se não for admin, só pode ver suas próprias tarefas
    if (!isAdmin) {
      query += ` AND t.assigned_to = ?`;
    }

    const params = isAdmin ? [id] : [id, userId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tarefa não encontrada',
        error: 'TASK_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tarefa carregada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Criar nova tarefa
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const {
      title,
      description,
      client_id,
      project_id,
      assigned_to,
      priority = 'media',
      due_date
    } = req.body;

    const userId = req.user.id;

    // Verificar se usuário atribuído existe
    if (assigned_to) {
      const userExists = await pool.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [assigned_to]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Usuário atribuído não encontrado',
          error: 'USER_NOT_FOUND'
        });
      }
    }

    // Verificar se cliente existe (se informado)
    if (client_id) {
      const clientExists = await pool.query('SELECT id FROM clients WHERE id = ? AND is_active = 1', [client_id]);
      if (clientExists.rows.length === 0) {
        return res.status(400).json({ error: 'Cliente não encontrado' });
      }
    }

    const result = await pool.query(`
      INSERT INTO tasks (
        title, description, client_id, project_id, assigned_to, 
        created_by, priority, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, client_id, project_id, assigned_to, userId, priority, due_date]);

    const taskId = result.lastID;

    // Log task creation history
    await logTaskHistory(taskId, userId, 'created', null, null, null, 'Tarefa criada');

    // Buscar tarefa criada com dados completos
    const newTaskResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      WHERE t.id = ?
    `, [taskId]);

    res.status(201).json({
      success: true,
      data: newTaskResult.rows[0],
      message: 'Tarefa criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Atualizar tarefa
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const {
      title,
      description,
      client_id,
      project_id,
      assigned_to,
      priority,
      status,
      due_date
    } = req.body;

    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar se tarefa existe e se usuário tem permissão
    let checkQuery = 'SELECT * FROM tasks WHERE id = ?';
    let checkParams = [id];

    if (!isAdmin) {
      checkQuery += ' AND assigned_to = ?';
      checkParams.push(userId);
    }

    const existingTask = await pool.query(checkQuery, checkParams);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tarefa não encontrada',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Verificar se usuário atribuído existe (se alterado)
    if (assigned_to && assigned_to !== existingTask.rows[0].assigned_to) {
      const userExists = await pool.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [assigned_to]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Usuário atribuído não encontrado',
          error: 'USER_NOT_FOUND'
        });
      }
    }

    // Verificar se cliente existe (se alterado)
    if (client_id && client_id !== existingTask.rows[0].client_id) {
      const clientExists = await pool.query('SELECT id FROM clients WHERE id = ? AND is_active = 1', [client_id]);
      if (clientExists.rows.length === 0) {
        return res.status(400).json({ error: 'Cliente não encontrado' });
      }
    }

    const oldTask = existingTask.rows[0];
    
    // Atualizar completed_at se status mudou para concluído
    let completed_at = null;
    if (status === 'concluido' && oldTask.status !== 'concluido') {
      completed_at = new Date().toISOString();
    } else if (status !== 'concluido') {
      completed_at = null;
    }

    let updateQuery = `
      UPDATE tasks SET
        title = ?, description = ?, client_id = ?, project_id = ?,
        assigned_to = ?, priority = ?, status = ?, due_date = ?, updated_at = datetime('now')
    `;
    let updateParams = [title, description, client_id, project_id, assigned_to, priority, status, due_date];

    if (completed_at !== null) {
      updateQuery += ', completed_at = ?';
      updateParams.push(completed_at);
    } else if (status !== 'concluido') {
      updateQuery += ', completed_at = NULL';
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    // Log changes in history
    const changes = [];
    if (title !== oldTask.title) {
      changes.push({ field: 'title', old: oldTask.title, new: title, desc: 'Título alterado' });
    }
    if (description !== oldTask.description) {
      changes.push({ field: 'description', old: oldTask.description, new: description, desc: 'Descrição alterada' });
    }
    if (assigned_to !== oldTask.assigned_to) {
      changes.push({ field: 'assigned_to', old: oldTask.assigned_to, new: assigned_to, desc: 'Responsável alterado' });
    }
    if (priority !== oldTask.priority) {
      changes.push({ field: 'priority', old: oldTask.priority, new: priority, desc: 'Prioridade alterada' });
    }
    if (status !== oldTask.status) {
      changes.push({ field: 'status', old: oldTask.status, new: status, desc: 'Status alterado' });
    }
    if (due_date !== oldTask.due_date) {
      changes.push({ field: 'due_date', old: oldTask.due_date, new: due_date, desc: 'Data de vencimento alterada' });
    }

    // Log each change
    for (const change of changes) {
      await logTaskHistory(id, userId, 'updated', change.field, change.old, change.new, change.desc);
    }

    // Special log for status changes
    if (status !== oldTask.status) {
      await logTaskHistory(id, userId, 'status_changed', 'status', oldTask.status, status, `Status alterado de "${oldTask.status}" para "${status}"`);
    }

    // Special log for assignment changes
    if (assigned_to !== oldTask.assigned_to) {
      await logTaskHistory(id, userId, 'assigned', 'assigned_to', oldTask.assigned_to, assigned_to, 'Tarefa reatribuída');
    }

    // Buscar tarefa atualizada
    const updatedTaskResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      WHERE t.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedTaskResult.rows[0],
      message: 'Tarefa atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Deletar tarefa (apenas admin)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se tarefa existe
    const existingTask = await pool.query('SELECT id FROM tasks WHERE id = ?', [id]);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tarefa não encontrada',
        error: 'TASK_NOT_FOUND'
      });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({ 
      success: true,
      message: 'Tarefa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar usuários para atribuição
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE is_active = 1 
      ORDER BY name
    `);

    res.json({
      success: true,
      data: result.rows,
      message: 'Usuários carregados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Estatísticas de tarefas
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    let baseQuery = 'FROM tasks t';
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (!isAdmin) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(userId);
    }

    // Estatísticas por status
    const statusStats = await pool.query(`
      SELECT status, COUNT(*) as count
      ${baseQuery}
      ${whereClause}
      GROUP BY status
    `, params);

    // Estatísticas por prioridade
    const priorityStats = await pool.query(`
      SELECT priority, COUNT(*) as count
      ${baseQuery}
      ${whereClause}
      GROUP BY priority
    `, params);

    // Tarefas vencidas
    const overdueStats = await pool.query(`
      SELECT COUNT(*) as count
      ${baseQuery}
      ${whereClause}
      AND t.due_date < date('now')
      AND t.status != 'concluido'
    `, params);

    res.json({
      success: true,
      data: {
        status: statusStats.rows,
        priority: priorityStats.rows,
        overdue: overdueStats.rows[0].count
      },
      message: 'Estatísticas carregadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Adicionar comentário à tarefa
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const { taskId } = req.params;
    const { comment, is_internal = false } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar se usuário tem permissão para comentar na tarefa
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    const result = await pool.query(`
      INSERT INTO task_comments (task_id, user_id, comment, is_internal)
      VALUES (?, ?, ?, ?)
    `, [taskId, userId, comment, is_internal ? 1 : 0]);

    // Log comment in history
    await logTaskHistory(taskId, userId, 'commented', null, null, null, is_internal ? 'Comentário interno adicionado' : 'Comentário adicionado');

    // Buscar comentário criado com dados do usuário
    const newCommentResult = await pool.query(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.status(201).json({
      success: true,
      data: newCommentResult.rows[0],
      message: 'Comentário adicionado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar comentários da tarefa
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar se usuário tem permissão para ver comentários da tarefa
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    let query = `
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
    `;
    let params = [taskId];

    // Se não for admin, não mostrar comentários internos (a menos que sejam do próprio usuário)
    if (!isAdmin) {
      query += ` AND (c.is_internal = 0 OR c.user_id = ?)`;
      params.push(userId);
    }

    query += ` ORDER BY c.created_at ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      message: 'Comentários carregados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar histórico da tarefa
const getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar se usuário tem permissão para ver histórico da tarefa
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    const result = await pool.query(`
      SELECT h.*, u.name as user_name, u.role as user_role
      FROM task_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.task_id = ?
      ORDER BY h.created_at DESC
    `, [taskId]);

    res.json({
      success: true,
      data: result.rows,
      message: 'Histórico carregado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Atualizar apenas o status da tarefa (método simplificado com validação robusta)
const updateTaskStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Validar status
    const validStatuses = ['novo', 'em_progresso', 'aguardando_validacao', 'concluido', 'cancelado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Status inválido',
        error: 'INVALID_STATUS'
      });
    }

    // Verificar se usuário tem permissão para alterar status da tarefa
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    const oldStatus = task.status;

    // Regras de negócio para mudança de status
    if (!isAdmin) {
      // Funcionários não podem cancelar tarefas ou alterar para "aguardando_validacao" diretamente
      if (status === 'cancelado') {
        return res.status(403).json({ 
          success: false,
          message: 'Apenas administradores podem cancelar tarefas',
          error: 'PERMISSION_DENIED'
        });
      }
      
      // Funcionários só podem marcar como "aguardando_validacao" se a tarefa estava "em_progresso"
      if (status === 'aguardando_validacao' && oldStatus !== 'em_progresso') {
        return res.status(403).json({ 
          success: false,
          message: 'Tarefa deve estar em progresso para aguardar validação',
          error: 'INVALID_STATUS_TRANSITION'
        });
      }
    }

    // Atualizar status e completed_at se necessário
    let completed_at = null;
    if (status === 'concluido' && oldStatus !== 'concluido') {
      completed_at = new Date().toISOString();
    }

    let updateQuery = 'UPDATE tasks SET status = ?, updated_at = datetime(\'now\')';
    let updateParams = [status];

    if (completed_at) {
      updateQuery += ', completed_at = ?';
      updateParams.push(completed_at);
    } else if (status !== 'concluido' && oldStatus === 'concluido') {
      updateQuery += ', completed_at = NULL';
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(taskId);

    await pool.query(updateQuery, updateParams);

    // Log status change
    await logTaskHistory(taskId, userId, 'status_changed', 'status', oldStatus, status, `Status alterado de "${oldStatus}" para "${status}"`);

    // Buscar tarefa atualizada
    const updatedTaskResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      WHERE t.id = ?
    `, [taskId]);

    res.json({
      success: true,
      data: updatedTaskResult.rows[0],
      message: 'Status da tarefa atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Upload de anexo para tarefa
const uploadTaskAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Nenhum arquivo foi enviado',
        error: 'NO_FILE_UPLOADED'
      });
    }

    const { taskId } = req.params;
    const { description = '' } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar se tarefa existe e se usuário tem permissão
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      // Se não tem permissão, deletar o arquivo que foi enviado
      deleteTaskFile(req.file.path);
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    // Salvar informações do anexo no banco
    const result = await pool.query(`
      INSERT INTO task_attachments 
      (task_id, user_id, filename, original_name, file_path, file_size, mime_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      taskId,
      userId,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      description.trim()
    ]);

    // Log no histórico
    await logTaskHistory(taskId, userId, 'attachment_added', null, null, null, `Anexo "${req.file.originalname}" adicionado`);

    // Buscar anexo criado com dados do usuário
    const newAttachmentResult = await pool.query(`
      SELECT ta.*, u.name as user_name
      FROM task_attachments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.id = ?
    `, [result.lastID]);

    res.status(201).json({
      success: true,
      data: newAttachmentResult.rows[0],
      message: 'Anexo enviado com sucesso'
    });

  } catch (error) {
    // Se houver erro, deletar o arquivo enviado
    if (req.file) {
      deleteTaskFile(req.file.path);
    }
    console.error('Erro ao enviar anexo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar anexos da tarefa
const getTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar permissão
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    // Buscar anexos
    const attachmentsResult = await pool.query(`
      SELECT ta.*, u.name as user_name
      FROM task_attachments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ?
      ORDER BY ta.created_at DESC
    `, [taskId]);

    // Verificar se arquivos ainda existem no filesystem
    const attachments = attachmentsResult.rows.map(attachment => {
      const fileInfo = getFileInfo(attachment.file_path);
      return {
        ...attachment,
        file_exists: fileInfo.exists,
        file_size_mb: (attachment.file_size / (1024 * 1024)).toFixed(2)
      };
    });

    res.json({
      success: true,
      data: attachments,
      message: 'Anexos carregados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar anexos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Download de anexo
const downloadTaskAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar permissão na tarefa
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    // Buscar anexo
    const attachmentResult = await pool.query(`
      SELECT * FROM task_attachments 
      WHERE id = ? AND task_id = ?
    `, [attachmentId, taskId]);

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Anexo não encontrado',
        error: 'ATTACHMENT_NOT_FOUND'
      });
    }

    const attachment = attachmentResult.rows[0];

    // Verificar se arquivo existe
    const fileInfo = getFileInfo(attachment.file_path);
    if (!fileInfo.exists) {
      return res.status(404).json({ 
        success: false,
        message: 'Arquivo não encontrado no servidor',
        error: 'FILE_NOT_FOUND'
      });
    }

    // Enviar arquivo
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.setHeader('Content-Type', attachment.mime_type);
    res.sendFile(path.resolve(attachment.file_path));

  } catch (error) {
    console.error('Erro ao fazer download do anexo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Deletar anexo
const deleteTaskAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    // Verificar permissão na tarefa
    const task = await checkTaskPermission(taskId, userId, isAdmin);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Tarefa não encontrada ou sem permissão',
        error: 'TASK_NOT_FOUND_OR_PERMISSION_DENIED'
      });
    }

    // Buscar anexo
    const attachmentResult = await pool.query(`
      SELECT * FROM task_attachments 
      WHERE id = ? AND task_id = ?
    `, [attachmentId, taskId]);

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Anexo não encontrado',
        error: 'ATTACHMENT_NOT_FOUND'
      });
    }

    const attachment = attachmentResult.rows[0];

    // Só o uploader ou admin pode deletar
    if (attachment.user_id !== userId && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Sem permissão para deletar este anexo',
        error: 'PERMISSION_DENIED'
      });
    }

    // Deletar do banco
    await pool.query('DELETE FROM task_attachments WHERE id = ?', [attachmentId]);

    // Deletar arquivo do filesystem
    deleteTaskFile(attachment.file_path);

    // Log no histórico
    await logTaskHistory(taskId, userId, 'attachment_deleted', null, null, null, `Anexo "${attachment.original_name}" removido`);

    res.json({ 
      success: true,
      message: 'Anexo removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar anexo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar tarefas vencidas (para notificações)
const getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    let whereClause = `WHERE t.due_date < date('now') AND t.status NOT IN ('concluido', 'cancelado')`;
    let params = [];

    if (!isAdmin) {
      whereClause += ` AND t.assigned_to = ?`;
      params.push(userId);
    }

    const overdueResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name,
             julianday('now') - julianday(t.due_date) as days_overdue
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      ${whereClause}
      ORDER BY t.due_date ASC
    `, params);

    res.json({ 
      success: true,
      data: overdueResult.rows,
      message: 'Tarefas vencidas carregadas com sucesso',
      meta: {
        count: overdueResult.rows.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas vencidas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Buscar tarefas próximas ao vencimento (para notificações)
const getUpcomingTasks = async (req, res) => {
  try {
    const { days = 3 } = req.query; // Próximos X dias
    const userId = req.user.id;
    const isAdmin = req.user.role === 'administrador';

    let whereClause = `WHERE t.due_date BETWEEN date('now') AND date('now', '+${parseInt(days)} days') 
                       AND t.status NOT IN ('concluido', 'cancelado')`;
    let params = [];

    if (!isAdmin) {
      whereClause += ` AND t.assigned_to = ?`;
      params.push(userId);
    }

    const upcomingResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             assigned_user.name as assigned_to_name,
             created_user.name as created_by_name,
             julianday(t.due_date) - julianday('now') as days_until_due
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users created_user ON t.created_by = created_user.id
      ${whereClause}
      ORDER BY t.due_date ASC
    `, params);

    res.json({ 
      success: true,
      data: upcomingResult.rows,
      message: 'Tarefas próximas ao vencimento carregadas com sucesso',
      meta: {
        count: upcomingResult.rows.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas próximas ao vencimento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getUsers,
  getTaskStats,
  addComment,
  getTaskComments,
  getTaskHistory,
  updateTaskStatus,
  uploadTaskAttachment,
  getTaskAttachments,
  downloadTaskAttachment,
  deleteTaskAttachment,
  getOverdueTasks,
  getUpcomingTasks
};