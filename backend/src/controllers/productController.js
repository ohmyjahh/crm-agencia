const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { validationResult } = require('express-validator');

const dbPath = path.join(__dirname, '../../crm_demo.db');

// Listar todos os produtos
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereConditions = [];
    let params = [];
    
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }
    
    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const db = new sqlite3.Database(dbPath);
    
    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Buscar produtos
    const query = `
      SELECT p.*, u.name as created_by_name
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const products = await new Promise((resolve, reject) => {
      db.all(query, [...params, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: products,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar produto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT p.*, u.name as created_by_name
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `;
    
    const product = await new Promise((resolve, reject) => {
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    db.close();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar novo produto
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const { name, description, category, tags, average_ticket, status = 'ativo' } = req.body;
    const created_by = req.user.id;
    
    // Verificar se o usuário é administrador
    if (req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar produtos'
      });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      INSERT INTO products (name, description, category, tags, average_ticket, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await new Promise((resolve, reject) => {
      db.run(query, [name, description, category, tags, average_ticket, status, created_by], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
    
    // Buscar produto criado
    const createdProduct = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE rowid = ?', [result.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    db.close();
    
    res.status(201).json({
      success: true,
      data: createdProduct,
      message: 'Produto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar produto
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { name, description, category, tags, average_ticket, status } = req.body;
    
    // Verificar se o usuário é administrador
    if (req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem editar produtos'
      });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Verificar se produto existe
    const existingProduct = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!existingProduct) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    const query = `
      UPDATE products 
      SET name = ?, description = ?, category = ?, tags = ?, average_ticket = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.run(query, [name, description, category, tags, average_ticket, status, id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Buscar produto atualizado
    const updatedProduct = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: updatedProduct,
      message: 'Produto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar produto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário é administrador
    if (req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem deletar produtos'
      });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Verificar se produto existe
    const existingProduct = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!existingProduct) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    // Verificar se produto está em uso (tarefas)
    const productInUse = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM tasks WHERE product_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      });
    });
    
    if (productInUse) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar produto que está sendo usado em tarefas'
      });
    }
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      message: 'Produto deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar produtos ativos (para dropdowns)
const getActiveProducts = async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT id, name, category, average_ticket
      FROM products 
      WHERE status = 'ativo'
      ORDER BY name
    `;
    
    const products = await new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Erro ao buscar produtos ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getActiveProducts
};