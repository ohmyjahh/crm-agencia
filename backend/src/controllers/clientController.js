const { validationResult } = require('express-validator');
const pool = require('../config/database');

// Listar todos os clientes
const getClients = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10, 
      active = 'true',
      category,
      service_format,
      document_type 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.name as created_by_name
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    // Filtro por status ativo
    if (active !== 'all') {
      query += ` AND c.is_active = ?`;
      params.push(active === 'true' ? 1 : 0);
      paramIndex++;
    }

    // Filtro por categoria
    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
      paramIndex++;
    }

    // Filtro por formato do serviço
    if (service_format) {
      query += ` AND c.service_format = ?`;
      params.push(service_format);
      paramIndex++;
    }

    // Filtro por tipo de documento
    if (document_type) {
      query += ` AND c.document_type = ?`;
      params.push(document_type);
      paramIndex++;
    }

    // Filtro de busca
    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.document LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    // Ordenação e paginação
    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM clients c
      WHERE 1=1
    `;
    let countParams = [];
    let countParamIndex = 1;

    if (active !== 'all') {
      countQuery += ` AND c.is_active = ?`;
      countParams.push(active === 'true' ? 1 : 0);
    }

    if (category) {
      countQuery += ` AND c.category = ?`;
      countParams.push(category);
    }

    if (service_format) {
      countQuery += ` AND c.service_format = ?`;
      countParams.push(service_format);
    }

    if (document_type) {
      countQuery += ` AND c.document_type = ?`;
      countParams.push(document_type);
    }

    if (search) {
      countQuery += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.document LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0].total;

    res.json({
      clients: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar cliente por ID
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.*, u.name as created_by_name
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({ client: result.rows[0] });

  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo cliente
const createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const {
      name,
      email,
      phone,
      document,
      document_type,
      address,
      city,
      state,
      zip_code,
      notes,
      category,
      service_format,
      average_ticket
    } = req.body;

    const userId = req.user.id;

    // Verificar se documento já existe
    if (document) {
      const existingClient = await pool.query(
        'SELECT id FROM clients WHERE document = ? AND is_active = 1',
        [document]
      );

      if (existingClient.rows.length > 0) {
        return res.status(400).json({ error: 'Documento já cadastrado' });
      }
    }

    // Verificar se email já existe
    if (email) {
      const existingEmail = await pool.query(
        'SELECT id FROM clients WHERE email = ? AND is_active = 1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    const result = await pool.query(`
      INSERT INTO clients (
        name, email, phone, document, document_type, 
        address, city, state, zip_code, notes, category, 
        service_format, average_ticket, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, email, phone, document, document_type, address, city, state, zip_code, notes, category || 'bronze', service_format || 'avulso', average_ticket || 0, userId]);

    // Buscar cliente criado para retornar dados completos
    const newClientResult = await pool.query(`
      SELECT c.*, u.name as created_by_name
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      client: newClientResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar cliente
const updateClient = async (req, res) => {
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
      name,
      email,
      phone,
      document,
      document_type,
      address,
      city,
      state,
      zip_code,
      notes,
      category,
      service_format,
      average_ticket,
      is_active
    } = req.body;

    // Verificar se cliente existe
    const existingClient = await pool.query('SELECT id FROM clients WHERE id = ?', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar documento duplicado (exceto o próprio cliente)
    if (document) {
      const duplicateDoc = await pool.query(
        'SELECT id FROM clients WHERE document = ? AND id != ? AND is_active = 1',
        [document, id]
      );

      if (duplicateDoc.rows.length > 0) {
        return res.status(400).json({ error: 'Documento já cadastrado' });
      }
    }

    // Verificar email duplicado (exceto o próprio cliente)
    if (email) {
      const duplicateEmail = await pool.query(
        'SELECT id FROM clients WHERE email = ? AND id != ? AND is_active = 1',
        [email, id]
      );

      if (duplicateEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    await pool.query(`
      UPDATE clients SET
        name = ?, email = ?, phone = ?, document = ?, document_type = ?,
        address = ?, city = ?, state = ?, zip_code = ?, notes = ?,
        category = ?, service_format = ?, average_ticket = ?, is_active = ?
      WHERE id = ?
    `, [name, email, phone, document, document_type, address, city, state, zip_code, notes, category || 'bronze', service_format || 'avulso', average_ticket || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1, id]);

    // Buscar cliente atualizado
    const updatedClientResult = await pool.query(`
      SELECT c.*, u.name as created_by_name
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `, [id]);

    res.json({
      message: 'Cliente atualizado com sucesso',
      client: updatedClientResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Desativar cliente (soft delete)
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const existingClient = await pool.query('SELECT id FROM clients WHERE id = ?', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await pool.query('UPDATE clients SET is_active = 0 WHERE id = ?', [id]);

    res.json({ message: 'Cliente desativado com sucesso' });

  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Reativar cliente
const activateClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const existingClient = await pool.query('SELECT id FROM clients WHERE id = ?', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await pool.query('UPDATE clients SET is_active = 1 WHERE id = ?', [id]);

    res.json({ message: 'Cliente reativado com sucesso' });

  } catch (error) {
    console.error('Erro ao reativar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  activateClient
};