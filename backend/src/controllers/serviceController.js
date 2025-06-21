const { validationResult } = require('express-validator');
const pool = require('../config/database');

// Listar serviços
const getServices = async (req, res) => {
  try {
    const { category, service_type, active_only = true } = req.query;

    let query = `
      SELECT s.*, u.name as created_by_name
      FROM services s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    let params = [];

    if (active_only === 'true') {
      query += ' AND s.is_active = 1';
    }

    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    if (service_type) {
      query += ' AND s.service_type = ?';
      params.push(service_type);
    }

    query += ' ORDER BY s.name';

    const result = await pool.query(query, params);

    res.json({ services: result.rows });

  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar serviço por ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT s.*, u.name as created_by_name
      FROM services s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    res.json({ service: result.rows[0] });

  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo serviço
const createService = async (req, res) => {
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
      description,
      category,
      base_price,
      service_type,
      estimated_hours
    } = req.body;

    const userId = req.user.id;

    const result = await pool.query(`
      INSERT INTO services (
        name, description, category, base_price, service_type, 
        estimated_hours, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, category, base_price, service_type, estimated_hours, userId]);

    // Buscar serviço criado
    const newServiceResult = await pool.query(`
      SELECT s.*, u.name as created_by_name
      FROM services s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Serviço criado com sucesso',
      service: newServiceResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar serviço
const updateService = async (req, res) => {
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
      description,
      category,
      base_price,
      service_type,
      estimated_hours
    } = req.body;

    // Verificar se serviço existe
    const existingService = await pool.query('SELECT id FROM services WHERE id = ?', [id]);
    if (existingService.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    await pool.query(`
      UPDATE services SET
        name = ?, description = ?, category = ?, base_price = ?,
        service_type = ?, estimated_hours = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [name, description, category, base_price, service_type, estimated_hours, id]);

    // Buscar serviço atualizado
    const updatedServiceResult = await pool.query(`
      SELECT s.*, u.name as created_by_name
      FROM services s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    res.json({
      message: 'Serviço atualizado com sucesso',
      service: updatedServiceResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar serviço (soft delete)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se serviço existe
    const existingService = await pool.query('SELECT id FROM services WHERE id = ?', [id]);
    if (existingService.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    await pool.query('UPDATE services SET is_active = 0 WHERE id = ?', [id]);

    res.json({ message: 'Serviço desativado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter histórico de compras de um cliente
const getClientPurchases = async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await pool.query(`
      SELECT 
        cp.*,
        s.name as service_name,
        s.category as service_category,
        u.name as created_by_name
      FROM client_purchases cp
      LEFT JOIN services s ON cp.service_id = s.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.client_id = ?
      ORDER BY cp.purchase_number
    `, [clientId]);

    res.json({ purchases: result.rows });

  } catch (error) {
    console.error('Erro ao buscar histórico de compras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova compra para cliente
const createClientPurchase = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      service_id,
      amount,
      purchase_date,
      payment_method,
      notes
    } = req.body;

    const userId = req.user.id;

    // Buscar próximo número da compra
    const lastPurchaseResult = await pool.query(
      'SELECT MAX(purchase_number) as max_number FROM client_purchases WHERE client_id = ?',
      [clientId]
    );
    
    const purchaseNumber = (lastPurchaseResult.rows[0]?.max_number || 0) + 1;

    const result = await pool.query(`
      INSERT INTO client_purchases (
        client_id, service_id, purchase_number, amount, purchase_date,
        payment_method, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientId, service_id, purchaseNumber, amount, purchase_date, payment_method, notes, userId]);

    // Atualizar dados do cliente
    await pool.query(`
      UPDATE clients SET
        total_purchases = ?,
        average_ticket = (
          SELECT AVG(amount) FROM client_purchases WHERE client_id = ?
        ),
        first_purchase_date = COALESCE(first_purchase_date, ?),
        last_purchase_date = ?
      WHERE id = ?
    `, [purchaseNumber, clientId, purchase_date, purchase_date, clientId]);

    // Buscar compra criada
    const newPurchaseResult = await pool.query(`
      SELECT 
        cp.*,
        s.name as service_name,
        s.category as service_category,
        u.name as created_by_name
      FROM client_purchases cp
      LEFT JOIN services s ON cp.service_id = s.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Compra registrada com sucesso',
      purchase: newPurchaseResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter serviços contratados por um cliente
const getClientServices = async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await pool.query(`
      SELECT 
        cs.*,
        s.name as service_name,
        s.description as service_description,
        s.category as service_category,
        s.service_type,
        u.name as created_by_name
      FROM client_services cs
      LEFT JOIN services s ON cs.service_id = s.id
      LEFT JOIN users u ON cs.created_by = u.id
      WHERE cs.client_id = ?
      ORDER BY cs.contract_date DESC
    `, [clientId]);

    res.json({ client_services: result.rows });

  } catch (error) {
    console.error('Erro ao buscar serviços do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Contratar serviço para cliente
const createClientService = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      service_id,
      contract_date,
      end_date,
      monthly_value,
      notes
    } = req.body;

    const userId = req.user.id;

    const result = await pool.query(`
      INSERT INTO client_services (
        client_id, service_id, contract_date, end_date, monthly_value, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [clientId, service_id, contract_date, end_date, monthly_value, notes, userId]);

    // Buscar serviço contratado
    const newServiceResult = await pool.query(`
      SELECT 
        cs.*,
        s.name as service_name,
        s.description as service_description,
        s.category as service_category,
        s.service_type,
        u.name as created_by_name
      FROM client_services cs
      LEFT JOIN services s ON cs.service_id = s.id
      LEFT JOIN users u ON cs.created_by = u.id
      WHERE cs.id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Serviço contratado com sucesso',
      client_service: newServiceResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao contratar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getClientPurchases,
  createClientPurchase,
  getClientServices,
  createClientService
};