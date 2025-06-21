const { validationResult } = require('express-validator');
const pool = require('../config/database');
const XLSX = require('xlsx');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

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

// Importar clientes de arquivo
const importClients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    // Processar arquivo baseado na extensão
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      // Processar Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else if (fileExt === '.csv') {
      // Processar CSV
      const csvData = fs.readFileSync(filePath, 'utf8');
      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
      data = parsed.data;
    } else if (fileExt === '.json') {
      // Processar JSON
      const jsonData = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(jsonData);
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Arquivo vazio ou formato inválido' });
    }

    // Mapear colunas (flexível para diferentes formatos)
    const mappedData = data.map(row => {
      return {
        name: row.Nome || row.name || row.Name || '',
        email: row.Email || row.email || '',
        phone: row.Telefone || row.phone || row.Phone || '',
        document: row.Documento || row.document || row.Document || '',
        document_type: row['Tipo de Documento'] || row.document_type || row.DocumentType || 'CPF',
        address: row.Endereço || row.address || row.Address || '',
        city: row.Cidade || row.city || row.City || '',
        state: row.Estado || row.state || row.State || '',
        zip_code: row.CEP || row.zip_code || row.ZipCode || '',
        notes: row.Observações || row.notes || row.Notes || '',
        category: row.Categoria || row.category || row.Category || 'bronze',
        service_format: row['Formato do Serviço'] || row.service_format || row.ServiceFormat || 'avulso',
        average_ticket: parseFloat(row['Ticket Médio'] || row.average_ticket || row.AverageTicket || 0) || 0
      };
    });

    // Validar e inserir dados
    let imported = 0;
    let errors = [];
    const userId = req.user.id;

    for (let i = 0; i < mappedData.length; i++) {
      const clientData = mappedData[i];
      
      // Validação básica
      if (!clientData.name || clientData.name.trim() === '') {
        errors.push(`Linha ${i + 2}: Nome é obrigatório`);
        continue;
      }

      // Verificar se já existe (por documento ou email)
      let existingClient = null;
      if (clientData.document) {
        const result = await pool.query(
          'SELECT id FROM clients WHERE document = ? AND is_active = 1',
          [clientData.document]
        );
        existingClient = result.rows[0];
      }

      if (!existingClient && clientData.email) {
        const result = await pool.query(
          'SELECT id FROM clients WHERE email = ? AND is_active = 1',
          [clientData.email]
        );
        existingClient = result.rows[0];
      }

      if (existingClient) {
        errors.push(`Linha ${i + 2}: Cliente já existe (${clientData.name})`);
        continue;
      }

      try {
        // Inserir cliente
        await pool.query(`
          INSERT INTO clients (
            name, email, phone, document, document_type, 
            address, city, state, zip_code, notes, category, 
            service_format, average_ticket, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          clientData.name.trim(),
          clientData.email.trim() || null,
          clientData.phone.trim() || null,
          clientData.document.trim() || null,
          clientData.document_type,
          clientData.address.trim() || null,
          clientData.city.trim() || null,
          clientData.state.trim() || null,
          clientData.zip_code.trim() || null,
          clientData.notes.trim() || null,
          clientData.category || 'bronze',
          clientData.service_format || 'avulso',
          clientData.average_ticket || 0,
          userId
        ]);

        imported++;
      } catch (error) {
        errors.push(`Linha ${i + 2}: Erro ao inserir (${error.message})`);
      }
    }

    // Limpar arquivo temporário
    fs.unlinkSync(filePath);

    res.json({
      message: 'Importação concluída',
      imported,
      total: data.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erro ao importar clientes:', error);
    
    // Limpar arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Exportar clientes com filtros
const exportClients = async (req, res) => {
  try {
    console.log('📥 Iniciando exportação de clientes');
    console.log('Query params:', req.query);
    
    const { 
      status,
      category,
      service_format,
      document_type,
      min_ticket,
      max_ticket,
      start_date,
      end_date,
      city,
      state,
      format = 'xlsx'
    } = req.query;

    // Construir query com filtros
    let query = `
      SELECT c.*, u.name as created_by_name
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    let params = [];

    // Aplicar filtros
    if (status && status !== 'all') {
      query += ` AND c.is_active = ?`;
      params.push(status === 'true' ? 1 : 0);
    }

    if (category && category !== 'all') {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (service_format && service_format !== 'all') {
      query += ` AND c.service_format = ?`;
      params.push(service_format);
    }

    if (document_type && document_type !== 'all') {
      query += ` AND c.document_type = ?`;
      params.push(document_type);
    }

    if (min_ticket) {
      query += ` AND c.average_ticket >= ?`;
      params.push(parseFloat(min_ticket));
    }

    if (max_ticket) {
      query += ` AND c.average_ticket <= ?`;
      params.push(parseFloat(max_ticket));
    }

    if (start_date) {
      query += ` AND c.created_at >= ?`;
      params.push(start_date + ' 00:00:00');
    }

    if (end_date) {
      query += ` AND c.created_at <= ?`;
      params.push(end_date + ' 23:59:59');
    }

    if (city) {
      query += ` AND c.city LIKE ?`;
      params.push(`%${city}%`);
    }

    if (state) {
      query += ` AND c.state LIKE ?`;
      params.push(`%${state}%`);
    }

    query += ` ORDER BY c.created_at DESC`;

    console.log('📊 Executando query:', query);
    console.log('📋 Parâmetros:', params);
    
    const result = await pool.query(query, params);
    const clients = result.rows;

    console.log(`✅ Encontrados ${clients.length} clientes`);

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Nenhum cliente encontrado com os filtros aplicados' });
    }

    // Preparar dados para exportação
    const exportData = clients.map(client => ({
      'Nome': client.name,
      'Email': client.email || '',
      'Telefone': client.phone || '',
      'Documento': client.document || '',
      'Tipo de Documento': client.document_type || '',
      'Endereço': client.address || '',
      'Cidade': client.city || '',
      'Estado': client.state || '',
      'CEP': client.zip_code || '',
      'Categoria': client.category || '',
      'Formato do Serviço': client.service_format || '',
      'Ticket Médio': client.average_ticket || 0,
      'Status': client.is_active ? 'Ativo' : 'Inativo',
      'Data de Cadastro': client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '',
      'Criado por': client.created_by_name || '',
      'Observações': client.notes || ''
    }));

    console.log(`📄 Gerando arquivo no formato: ${format}`);
    
    // Gerar arquivo baseado no formato
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=clientes_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      console.log('🎉 Arquivo Excel gerado com sucesso');
      res.send(buffer);
      
    } else if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=clientes_export_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csv); // BOM para UTF-8
      
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=clientes_export_${new Date().toISOString().split('T')[0]}.json`);
      res.json(exportData);
    } else {
      return res.status(400).json({ error: 'Formato não suportado. Use: xlsx, csv ou json' });
    }

  } catch (error) {
    console.error('❌ Erro ao exportar clientes:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  activateClient,
  importClients,
  exportClients
};