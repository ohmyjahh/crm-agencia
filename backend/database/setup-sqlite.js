const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database-sqlite');

async function setupSQLiteDatabase() {
  try {
    console.log('🗄️  Configurando banco SQLite para demonstração...');
    
    // Ler e executar schema
    const schemaPath = path.join(__dirname, 'schema-sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir e executar cada comando SQL
    const commands = schema.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        await pool.query(command.trim());
      }
    }
    
    console.log('✅ Schema SQLite criado!');
    
    // Inserir categorias financeiras
    await pool.query(`
      INSERT OR IGNORE INTO finance_categories (name, type, description) VALUES 
      ('Vendas de Serviços', 'entrada', 'Receitas provenientes de prestação de serviços'),
      ('Vendas de Produtos', 'entrada', 'Receitas provenientes de venda de produtos'),
      ('Consultoria', 'entrada', 'Receitas de serviços de consultoria'),
      ('Salários', 'saida', 'Pagamento de salários e benefícios'),
      ('Aluguel', 'saida', 'Despesas com aluguel do escritório'),
      ('Material de Escritório', 'saida', 'Compra de materiais para escritório')
    `);
    
    // Criar usuário admin
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT OR IGNORE INTO users (id, name, email, password_hash, role) 
      VALUES ('admin-id-123', 'Administrador', 'admin@crm.com', ?, 'administrador')
    `, [passwordHash]);
    
    // Inserir dados de exemplo
    await insertSampleData();
    
    console.log('✅ Dados iniciais inseridos!');
    console.log('\n🎉 Banco SQLite configurado com sucesso!');
    console.log('📧 Admin: admin@crm.com');
    console.log('🔑 Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro no setup SQLite:', error);
  }
}

async function insertSampleData() {
  // Inserir clientes de exemplo
  await pool.query(`
    INSERT OR IGNORE INTO clients (id, name, email, phone, document, document_type, created_by) VALUES 
    ('client-1', 'ABC Empresa', 'contato@abcempresa.com', '(11) 99999-9999', '12.345.678/0001-90', 'CNPJ', 'admin-id-123'),
    ('client-2', 'XYZ Negócios', 'info@xyznegócios.com', '(11) 88888-8888', '98.765.432/0001-10', 'CNPJ', 'admin-id-123'),
    ('client-3', 'João Silva', 'joao@email.com', '(11) 77777-7777', '123.456.789-00', 'CPF', 'admin-id-123')
  `);
  
  // Inserir tarefas de exemplo
  await pool.query(`
    INSERT OR IGNORE INTO tasks (title, description, client_id, assigned_to, created_by, priority, status, due_date) VALUES 
    ('Follow-up com cliente ABC', 'Entrar em contato para proposta', 'client-1', 'admin-id-123', 'admin-id-123', 'alta', 'pendente', date('now', '+3 days')),
    ('Criar apresentação XYZ', 'Preparar apresentação comercial', 'client-2', 'admin-id-123', 'admin-id-123', 'media', 'em_progresso', date('now', '+5 days')),
    ('Reunião com João', 'Reunião para definir escopo', 'client-3', 'admin-id-123', 'admin-id-123', 'baixa', 'concluida', date('now', '-1 day'))
  `);
  
  // Inserir transações de exemplo
  await pool.query(`
    INSERT OR IGNORE INTO finance_transactions (type, amount, description, client_id, transaction_date, created_by) VALUES 
    ('entrada', 5000.00, 'Pagamento projeto ABC', 'client-1', date('now', '-5 days'), 'admin-id-123'),
    ('entrada', 8000.00, 'Consultoria XYZ', 'client-2', date('now', '-10 days'), 'admin-id-123'),
    ('saida', 2000.00, 'Aluguel escritório', NULL, date('now', '-2 days'), 'admin-id-123'),
    ('saida', 1500.00, 'Material de escritório', NULL, date('now', '-7 days'), 'admin-id-123')
  `);
}

// Executar se chamado diretamente
if (require.main === module) {
  setupSQLiteDatabase().then(() => process.exit(0));
}

module.exports = setupSQLiteDatabase;