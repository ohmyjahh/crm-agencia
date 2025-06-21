const { validationResult } = require('express-validator');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// Listar transações financeiras
const getTransactions = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10, 
      type, 
      category_id, 
      client_id,
      start_date,
      end_date,
      month,
      year
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, 
             c.name as client_name,
             cat.name as category_name,
             cat.type as category_type,
             u.name as created_by_name
      FROM finance_transactions t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN finance_categories cat ON t.category_id = cat.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    let params = [];

    // Filtro por tipo
    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    // Filtro por categoria
    if (category_id) {
      query += ` AND t.category_id = ?`;
      params.push(category_id);
    }

    // Filtro por cliente
    if (client_id) {
      query += ` AND t.client_id = ?`;
      params.push(client_id);
    }

    // Filtro por período
    if (start_date && end_date) {
      query += ` AND t.transaction_date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    } else if (month && year) {
      query += ` AND strftime('%Y-%m', t.transaction_date) = ?`;
      params.push(`${year}-${month.padStart(2, '0')}`);
    }

    // Filtro de busca
    if (search) {
      query += ` AND (t.description LIKE ? OR c.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Ordenação e paginação
    query += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM finance_transactions t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN finance_categories cat ON t.category_id = cat.id
      WHERE 1=1
    `;
    let countParams = [];

    if (type) {
      countQuery += ` AND t.type = ?`;
      countParams.push(type);
    }

    if (category_id) {
      countQuery += ` AND t.category_id = ?`;
      countParams.push(category_id);
    }

    if (client_id) {
      countQuery += ` AND t.client_id = ?`;
      countParams.push(client_id);
    }

    if (start_date && end_date) {
      countQuery += ` AND t.transaction_date BETWEEN ? AND ?`;
      countParams.push(start_date, end_date);
    } else if (month && year) {
      countQuery += ` AND strftime('%Y-%m', t.transaction_date) = ?`;
      countParams.push(`${year}-${month.padStart(2, '0')}`);
    }

    if (search) {
      countQuery += ` AND (t.description LIKE ? OR c.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0].total;

    res.json({
      transactions: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar transação por ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             cat.name as category_name,
             cat.type as category_type,
             u.name as created_by_name
      FROM finance_transactions t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN finance_categories cat ON t.category_id = cat.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({ transaction: result.rows[0] });

  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova transação
const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const {
      type,
      amount,
      description,
      category_id,
      client_id,
      project_id,
      transaction_date,
      payment_method,
      notes
    } = req.body;

    const userId = req.user.id;

    // Verificar se categoria existe
    if (category_id) {
      const categoryExists = await pool.query('SELECT id FROM finance_categories WHERE id = ? AND is_active = 1', [category_id]);
      if (categoryExists.rows.length === 0) {
        return res.status(400).json({ error: 'Categoria não encontrada' });
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
      INSERT INTO finance_transactions (
        type, amount, description, category_id, client_id, project_id,
        transaction_date, payment_method, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [type, amount, description, category_id, client_id, project_id, transaction_date, payment_method, notes, userId]);

    // Buscar transação criada com dados completos
    const newTransactionResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             cat.name as category_name,
             cat.type as category_type,
             u.name as created_by_name
      FROM finance_transactions t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN finance_categories cat ON t.category_id = cat.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Transação criada com sucesso',
      transaction: newTransactionResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar transação
const updateTransaction = async (req, res) => {
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
      type,
      amount,
      description,
      category_id,
      client_id,
      project_id,
      transaction_date,
      payment_method,
      notes
    } = req.body;

    // Verificar se transação existe
    const existingTransaction = await pool.query('SELECT id FROM finance_transactions WHERE id = ?', [id]);
    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Verificar se categoria existe (se alterada)
    if (category_id) {
      const categoryExists = await pool.query('SELECT id FROM finance_categories WHERE id = ? AND is_active = 1', [category_id]);
      if (categoryExists.rows.length === 0) {
        return res.status(400).json({ error: 'Categoria não encontrada' });
      }
    }

    // Verificar se cliente existe (se alterado)
    if (client_id) {
      const clientExists = await pool.query('SELECT id FROM clients WHERE id = ? AND is_active = 1', [client_id]);
      if (clientExists.rows.length === 0) {
        return res.status(400).json({ error: 'Cliente não encontrado' });
      }
    }

    await pool.query(`
      UPDATE finance_transactions SET
        type = ?, amount = ?, description = ?, category_id = ?, client_id = ?,
        project_id = ?, transaction_date = ?, payment_method = ?, notes = ?
      WHERE id = ?
    `, [type, amount, description, category_id, client_id, project_id, transaction_date, payment_method, notes, id]);

    // Buscar transação atualizada
    const updatedTransactionResult = await pool.query(`
      SELECT t.*, 
             c.name as client_name,
             cat.name as category_name,
             cat.type as category_type,
             u.name as created_by_name
      FROM finance_transactions t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN finance_categories cat ON t.category_id = cat.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [id]);

    res.json({
      message: 'Transação atualizada com sucesso',
      transaction: updatedTransactionResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar transação
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se transação existe
    const existingTransaction = await pool.query('SELECT id FROM finance_transactions WHERE id = ?', [id]);
    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    await pool.query('DELETE FROM finance_transactions WHERE id = ?', [id]);

    res.json({ message: 'Transação deletada com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar categorias
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM finance_categories WHERE is_active = 1';
    let params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);

    res.json({ categories: result.rows });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar categoria
const createCategory = async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const userId = req.user.id;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    // Verificar se categoria já existe
    const existingCategory = await pool.query(
      'SELECT id FROM finance_categories WHERE name = ? AND type = ? AND is_active = 1',
      [name, type]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ error: 'Categoria já existe para este tipo' });
    }

    const result = await pool.query(`
      INSERT INTO finance_categories (name, type, description, created_by)
      VALUES (?, ?, ?, ?)
    `, [name, type, description, userId]);

    // Buscar categoria criada
    const newCategory = await pool.query(
      'SELECT * FROM finance_categories WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category: newCategory.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar formas de pagamento
const getPaymentMethods = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM payment_methods 
      WHERE is_active = 1 
      ORDER BY name
    `);

    res.json({ payment_methods: result.rows });

  } catch (error) {
    console.error('Erro ao buscar formas de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar forma de pagamento
const createPaymentMethod = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verificar se forma de pagamento já existe
    const existingMethod = await pool.query(
      'SELECT id FROM payment_methods WHERE name = ? AND is_active = 1',
      [name]
    );

    if (existingMethod.rows.length > 0) {
      return res.status(400).json({ error: 'Forma de pagamento já existe' });
    }

    const result = await pool.query(`
      INSERT INTO payment_methods (name, description, created_by)
      VALUES (?, ?, ?)
    `, [name, description, userId]);

    // Buscar forma de pagamento criada
    const newMethod = await pool.query(
      'SELECT * FROM payment_methods WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      message: 'Forma de pagamento criada com sucesso',
      payment_method: newMethod.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Estatísticas financeiras
const getFinanceStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let dateFilter = '';
    let params = [];

    if (month && year) {
      dateFilter = ` AND strftime('%Y-%m', transaction_date) = ?`;
      params.push(`${year}-${month.padStart(2, '0')}`);
    } else if (year) {
      dateFilter = ` AND strftime('%Y', transaction_date) = ?`;
      params.push(year);
    }

    // Total por tipo
    const totalsResult = await pool.query(`
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM finance_transactions 
      WHERE 1=1 ${dateFilter}
      GROUP BY type
    `, params);

    // Por categoria
    const categoriesResult = await pool.query(`
      SELECT 
        cat.name as category_name,
        cat.type,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM finance_transactions t
      LEFT JOIN finance_categories cat ON t.category_id = cat.id
      WHERE 1=1 ${dateFilter}
      GROUP BY cat.id, cat.name, cat.type
      ORDER BY total DESC
    `, params);

    // Saldo mensal (últimos 12 meses)
    const monthlyResult = await pool.query(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        type,
        SUM(amount) as total
      FROM finance_transactions 
      WHERE transaction_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', transaction_date), type
      ORDER BY month DESC
    `);

    // Calcular saldo
    const totals = totalsResult.rows.reduce((acc, row) => {
      acc[row.type] = { total: parseFloat(row.total), count: row.count };
      return acc;
    }, {});

    const receitas = totals.entrada?.total || 0;
    const despesas = totals.saida?.total || 0;
    const saldo = receitas - despesas;

    res.json({
      summary: {
        receitas,
        despesas,
        saldo,
        total_transactions: (totals.entrada?.count || 0) + (totals.saida?.count || 0)
      },
      by_category: categoriesResult.rows,
      monthly_flow: monthlyResult.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Upload de arquivo para DRE
const uploadDREFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { month, year, description } = req.body;

    // Salvar informações do arquivo no banco
    const result = await pool.query(`
      INSERT INTO dre_uploads (
        filename, original_name, file_path, file_size, mime_type,
        month, year, description, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      month,
      year,
      description,
      req.user.id
    ]);

    res.status(201).json({
      message: 'Arquivo enviado com sucesso',
      file: {
        id: result.lastID,
        filename: req.file.filename,
        original_name: req.file.originalname,
        size: req.file.size,
        month,
        year,
        description
      }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Processar DRE com IA
const processDREWithAI = async (req, res) => {
  try {
    const { file_id } = req.params;

    // Buscar arquivo
    const fileResult = await pool.query(`
      SELECT * FROM dre_uploads WHERE id = ?
    `, [file_id]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const file = fileResult.rows[0];

    // Aqui seria a integração com IA (Claude/GPT)
    // Por enquanto, vou simular o processamento
    const mockDREResult = {
      period: `${file.month}/${file.year}`,
      receitas: [
        { description: 'Vendas de Serviços', amount: 50000 },
        { description: 'Consultoria', amount: 15000 }
      ],
      despesas: [
        { description: 'Salários', amount: 20000 },
        { description: 'Aluguel', amount: 5000 },
        { description: 'Marketing', amount: 3000 }
      ],
      resumo: {
        total_receitas: 65000,
        total_despesas: 28000,
        lucro_liquido: 37000,
        margem_liquida: 56.92
      },
      sugestoes: [
        'Considere aumentar investimento em marketing',
        'Margem de lucro está saudável',
        'Monitore crescimento de despesas operacionais'
      ]
    };

    // Salvar resultado processado
    await pool.query(`
      UPDATE dre_uploads SET
        processed_at = datetime('now'),
        ai_result = ?,
        status = 'processed'
      WHERE id = ?
    `, [JSON.stringify(mockDREResult), file_id]);

    res.json({
      message: 'DRE processada com sucesso',
      result: mockDREResult
    });

  } catch (error) {
    console.error('Erro ao processar DRE:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  createCategory,
  getPaymentMethods,
  createPaymentMethod,
  getFinanceStats,
  uploadDREFile,
  processDREWithAI
};