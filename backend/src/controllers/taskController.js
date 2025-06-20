const { validationResult } = require('express-validator');
const pool = require('../config/database');

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
      tasks: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json({ task: result.rows[0] });

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
        return res.status(400).json({ error: 'Usuário atribuído não encontrado' });
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
    `, [result.lastID]);

    res.status(201).json({
      message: 'Tarefa criada com sucesso',
      task: newTaskResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Verificar se usuário atribuído existe (se alterado)
    if (assigned_to && assigned_to !== existingTask.rows[0].assigned_to) {
      const userExists = await pool.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [assigned_to]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ error: 'Usuário atribuído não encontrado' });
      }
    }

    // Verificar se cliente existe (se alterado)
    if (client_id && client_id !== existingTask.rows[0].client_id) {
      const clientExists = await pool.query('SELECT id FROM clients WHERE id = ? AND is_active = 1', [client_id]);
      if (clientExists.rows.length === 0) {
        return res.status(400).json({ error: 'Cliente não encontrado' });
      }
    }

    // Atualizar completed_at se status mudou para concluída
    let completed_at = null;
    if (status === 'concluida' && existingTask.rows[0].status !== 'concluida') {
      completed_at = new Date().toISOString();
    } else if (status !== 'concluida') {
      completed_at = null;
    }

    let updateQuery = `
      UPDATE tasks SET
        title = ?, description = ?, client_id = ?, project_id = ?,
        assigned_to = ?, priority = ?, status = ?, due_date = ?
    `;
    let updateParams = [title, description, client_id, project_id, assigned_to, priority, status, due_date];

    if (completed_at !== null) {
      updateQuery += ', completed_at = ?';
      updateParams.push(completed_at);
    } else if (status !== 'concluida') {
      updateQuery += ', completed_at = NULL';
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

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
      message: 'Tarefa atualizada com sucesso',
      task: updatedTaskResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar tarefa (apenas admin)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se tarefa existe
    const existingTask = await pool.query('SELECT id FROM tasks WHERE id = ?', [id]);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({ message: 'Tarefa deletada com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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

    res.json({ users: result.rows });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
      AND t.status != 'concluida'
    `, params);

    res.json({
      status: statusStats.rows,
      priority: priorityStats.rows,
      overdue: overdueStats.rows[0].count
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getUsers,
  getTaskStats
};