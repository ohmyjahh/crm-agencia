const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { validationResult } = require('express-validator');

const dbPath = path.join(__dirname, '../../crm_demo.db');

// CADÊNCIAS DE FOLLOW-UP

// Listar cadências
const getSequences = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM followup_sequences ${whereClause}`;
    const countResult = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Buscar cadências com contagem de passos
    const query = `
      SELECT fs.*, u.name as created_by_name,
             COUNT(fst.id) as steps_count
      FROM followup_sequences fs
      LEFT JOIN users u ON fs.created_by = u.id
      LEFT JOIN followup_steps fst ON fs.id = fst.sequence_id
      ${whereClause}
      GROUP BY fs.id
      ORDER BY fs.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const sequences = await new Promise((resolve, reject) => {
      db.all(query, [...params, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: sequences,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar cadências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar cadência por ID com seus passos
const getSequenceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    // Buscar cadência
    const sequenceQuery = `
      SELECT fs.*, u.name as created_by_name
      FROM followup_sequences fs
      LEFT JOIN users u ON fs.created_by = u.id
      WHERE fs.id = ?
    `;
    
    const sequence = await new Promise((resolve, reject) => {
      db.get(sequenceQuery, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!sequence) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Cadência não encontrada'
      });
    }
    
    // Buscar passos da cadência
    const stepsQuery = `
      SELECT * FROM followup_steps
      WHERE sequence_id = ?
      ORDER BY step_order
    `;
    
    const steps = await new Promise((resolve, reject) => {
      db.all(stepsQuery, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    sequence.steps = steps;
    
    res.json({
      success: true,
      data: sequence
    });
  } catch (error) {
    console.error('Erro ao buscar cadência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar nova cadência
const createSequence = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const { name, description, steps } = req.body;
    const created_by = req.user.id;
    
    // Verificar se usuário é administrador
    if (req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar cadências'
      });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Verificar se nome já existe
    const existingSequence = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM followup_sequences WHERE name = ?', [name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingSequence) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Já existe uma cadência com este nome'
      });
    }
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    try {
      // Criar cadência
      const sequenceQuery = `
        INSERT INTO followup_sequences (name, description, created_by)
        VALUES (?, ?, ?)
      `;
      
      const sequenceResult = await new Promise((resolve, reject) => {
        db.run(sequenceQuery, [name, description, created_by], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        });
      });
      
      const sequenceId = sequenceResult.id;
      
      // Criar passos
      if (steps && steps.length > 0) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const stepQuery = `
            INSERT INTO followup_steps (sequence_id, step_order, day_offset, interaction_type, title, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          await new Promise((resolve, reject) => {
            db.run(stepQuery, [sequenceId, i + 1, step.day_offset, step.interaction_type, step.title, step.notes], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }
      
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Buscar cadência criada com passos
      const createdSequence = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM followup_sequences WHERE rowid = ?', [sequenceResult.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      const createdSteps = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM followup_steps WHERE sequence_id = ? ORDER BY step_order', [sequenceId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      createdSequence.steps = createdSteps;
      
      db.close();
      
      res.status(201).json({
        success: true,
        data: createdSequence,
        message: 'Cadência criada com sucesso'
      });
    } catch (error) {
      await new Promise((resolve, reject) => {
        db.run('ROLLBACK', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar cadência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// ATRIBUIÇÕES DE CADÊNCIA

// Listar clientes com cadências ativas
const getClientAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE cfa.status = ?';
      params.push(status);
    }
    
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT cfa.*, 
             c.name as client_name, c.email as client_email,
             fs.name as sequence_name,
             u1.name as assigned_by_name,
             u2.name as responsible_name,
             (SELECT COUNT(*) FROM followups f WHERE f.assignment_id = cfa.id AND f.status = 'pending') as pending_followups
      FROM client_followup_assignments cfa
      JOIN clients c ON cfa.client_id = c.id
      JOIN followup_sequences fs ON cfa.sequence_id = fs.id
      JOIN users u1 ON cfa.assigned_by = u1.id
      JOIN users u2 ON cfa.responsible_user = u2.id
      ${whereClause}
      ORDER BY cfa.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const assignments = await new Promise((resolve, reject) => {
      db.all(query, [...params, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Erro ao buscar atribuições:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atribuir cadência a cliente
const assignSequenceToClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const { client_id, sequence_id, responsible_user, start_date } = req.body;
    const assigned_by = req.user.id;
    
    const db = new sqlite3.Database(dbPath);
    
    // Verificar se cliente já tem cadência ativa
    const existingAssignment = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM client_followup_assignments WHERE client_id = ? AND status = "active"', [client_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingAssignment) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Cliente já possui uma cadência ativa'
      });
    }
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    try {
      // Criar atribuição
      const assignmentQuery = `
        INSERT INTO client_followup_assignments (client_id, sequence_id, assigned_by, responsible_user, start_date)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const assignmentResult = await new Promise((resolve, reject) => {
        db.run(assignmentQuery, [client_id, sequence_id, assigned_by, responsible_user, start_date], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        });
      });
      
      const assignmentId = assignmentResult.id;
      
      // Buscar passos da cadência
      const steps = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM followup_steps WHERE sequence_id = ? ORDER BY step_order', [sequence_id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      // Criar follow-ups individuais
      for (const step of steps) {
        const scheduledDate = new Date(start_date);
        scheduledDate.setDate(scheduledDate.getDate() + step.day_offset);
        
        const followupQuery = `
          INSERT INTO followups (assignment_id, step_id, client_id, responsible_user, scheduled_date, interaction_type, title, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await new Promise((resolve, reject) => {
          db.run(followupQuery, [
            assignmentId, step.id, client_id, responsible_user,
            scheduledDate.toISOString().split('T')[0],
            step.interaction_type, step.title, step.notes
          ], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      db.close();
      
      res.status(201).json({
        success: true,
        message: 'Cadência atribuída com sucesso'
      });
    } catch (error) {
      await new Promise((resolve, reject) => {
        db.run('ROLLBACK', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atribuir cadência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// MEUS FOLLOW-UPS

// Listar follow-ups do usuário
const getMyFollowups = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const userId = req.user.id;
    
    let whereClause = 'WHERE f.responsible_user = ?';
    let params = [userId];
    
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        whereClause += ' AND f.scheduled_date = ? AND f.status = "pending"';
        params.push(today);
        break;
      case 'upcoming':
        whereClause += ' AND f.scheduled_date > ? AND f.status = "pending"';
        params.push(today);
        break;
      case 'overdue':
        whereClause += ' AND f.scheduled_date < ? AND f.status = "pending"';
        params.push(today);
        break;
      case 'pending':
        whereClause += ' AND f.status = "pending"';
        break;
    }
    
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT f.*, 
             c.name as client_name, c.email as client_email, c.phone as client_phone,
             fs.name as sequence_name,
             fst.step_order
      FROM followups f
      JOIN clients c ON f.client_id = c.id
      JOIN client_followup_assignments cfa ON f.assignment_id = cfa.id
      JOIN followup_sequences fs ON cfa.sequence_id = fs.id
      JOIN followup_steps fst ON f.step_id = fst.id
      ${whereClause}
      ORDER BY f.scheduled_date ASC, f.created_at ASC
    `;
    
    const followups = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Marcar follow-ups em atraso
    const updateOverdueQuery = `
      UPDATE followups 
      SET status = 'overdue' 
      WHERE scheduled_date < ? AND status = 'pending' AND responsible_user = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.run(updateOverdueQuery, [today, userId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: followups
    });
  } catch (error) {
    console.error('Erro ao buscar follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar follow-up como concluído
const completeFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_notes } = req.body;
    const userId = req.user.id;
    
    const db = new sqlite3.Database(dbPath);
    
    // Verificar se follow-up pertence ao usuário
    const followup = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM followups WHERE id = ? AND responsible_user = ?', [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!followup) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Follow-up não encontrado'
      });
    }
    
    if (followup.status !== 'pending' && followup.status !== 'overdue') {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Follow-up já foi processado'
      });
    }
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    try {
      // Marcar como concluído
      const updateQuery = `
        UPDATE followups 
        SET status = 'completed', completed_at = datetime('now'), completion_notes = ?
        WHERE id = ?
      `;
      
      await new Promise((resolve, reject) => {
        db.run(updateQuery, [completion_notes, id], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Avançar cadência se necessário
      const assignment = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM client_followup_assignments WHERE id = ?', [followup.assignment_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      // Verificar se há próximo passo
      const nextStep = await new Promise((resolve, reject) => {
        db.get(`
          SELECT fst.* FROM followup_steps fst
          WHERE fst.sequence_id = ? AND fst.step_order = ?
        `, [assignment.sequence_id, assignment.current_step + 1], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (nextStep) {
        // Atualizar passo atual na atribuição
        await new Promise((resolve, reject) => {
          db.run('UPDATE client_followup_assignments SET current_step = current_step + 1 WHERE id = ?', [assignment.id], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        // Marcar cadência como concluída
        await new Promise((resolve, reject) => {
          db.run('UPDATE client_followup_assignments SET status = "completed" WHERE id = ?', [assignment.id], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      db.close();
      
      res.json({
        success: true,
        message: 'Follow-up marcado como concluído'
      });
    } catch (error) {
      await new Promise((resolve, reject) => {
        db.run('ROLLBACK', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      throw error;
    }
  } catch (error) {
    console.error('Erro ao concluir follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Pular follow-up
const skipFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const { skip_reason } = req.body;
    const userId = req.user.id;
    
    const db = new sqlite3.Database(dbPath);
    
    // Verificar se follow-up pertence ao usuário
    const followup = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM followups WHERE id = ? AND responsible_user = ?', [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!followup) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Follow-up não encontrado'
      });
    }
    
    // Marcar como pulado
    const updateQuery = `
      UPDATE followups 
      SET status = 'skipped', completed_at = datetime('now'), completion_notes = ?
      WHERE id = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.run(updateQuery, [skip_reason, id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      message: 'Follow-up pulado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao pular follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar cadências ativas (para dropdown)
const getActiveSequences = async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT id, name, description
      FROM followup_sequences 
      WHERE is_active = 1
      ORDER BY name
    `;
    
    const sequences = await new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    res.json({
      success: true,
      data: sequences
    });
  } catch (error) {
    console.error('Erro ao buscar cadências ativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  // Cadências
  getSequences,
  getSequenceById,
  createSequence,
  getActiveSequences,
  
  // Atribuições
  getClientAssignments,
  assignSequenceToClient,
  
  // Follow-ups
  getMyFollowups,
  completeFollowup,
  skipFollowup
};