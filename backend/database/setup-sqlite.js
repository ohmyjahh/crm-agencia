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
    
    // Inserir dados dos novos módulos
    await insertProductsAndFollowupData();
    
    // Criar view de compatibilidade
    await pool.query(`
      CREATE VIEW IF NOT EXISTS services AS 
      SELECT id, name, description, category, 
             average_ticket as base_price, 
             'avulso' as service_type,
             NULL as estimated_hours,
             CASE WHEN status = 'ativo' THEN 1 ELSE 0 END as is_active,
             created_by, created_at, updated_at
      FROM products
    `);
    
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
    ('Follow-up com cliente ABC', 'Entrar em contato para proposta', 'client-1', 'admin-id-123', 'admin-id-123', 'alta', 'novo', date('now', '+3 days')),
    ('Criar apresentação XYZ', 'Preparar apresentação comercial', 'client-2', 'admin-id-123', 'admin-id-123', 'media', 'em_progresso', date('now', '+5 days')),
    ('Reunião com João', 'Reunião para definir escopo', 'client-3', 'admin-id-123', 'admin-id-123', 'baixa', 'concluido', date('now', '-1 day'))
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

async function insertProductsAndFollowupData() {
  // Inserir produtos de exemplo
  await pool.query(`
    INSERT OR IGNORE INTO products (id, name, description, category, tags, average_ticket, status, created_by) VALUES 
    ('marketing-digital', 'Marketing Digital', 'Gestão completa de redes sociais e campanhas digitais', 'Marketing', 'redes sociais,campanhas,digital', 2500.00, 'ativo', 'admin-id-123'),
    ('desenvolvimento-web', 'Desenvolvimento Web', 'Criação e desenvolvimento de sites e sistemas web', 'Tecnologia', 'websites,sistemas,desenvolvimento', 8500.00, 'ativo', 'admin-id-123'),
    ('consultoria-empresarial', 'Consultoria Empresarial', 'Consultoria estratégica para crescimento empresarial', 'Consultoria', 'estratégia,crescimento,consultoria', 3500.00, 'ativo', 'admin-id-123'),
    ('design-grafico', 'Design Gráfico', 'Criação de identidade visual e materiais gráficos', 'Design', 'identidade visual,gráfico,criação', 1800.00, 'ativo', 'admin-id-123'),
    ('seo-otimizacao', 'SEO e Otimização', 'Otimização de sites para mecanismos de busca', 'Marketing', 'seo,otimização,busca', 1500.00, 'ativo', 'admin-id-123'),
    ('manutencao-sistemas', 'Manutenção de Sistemas', 'Manutenção e suporte técnico de sistemas', 'Tecnologia', 'manutenção,suporte,sistemas', 800.00, 'ativo', 'admin-id-123')
  `);
  
  // Inserir cadências de exemplo
  await pool.query(`
    INSERT OR IGNORE INTO followup_sequences (id, name, description, created_by) VALUES 
    ('seq-prospect-inicial', 'Cadência Prospect Inicial', 'Cadência padrão para novos prospects', 'admin-id-123'),
    ('seq-pos-reuniao', 'Pós-Reunião', 'Follow-up após primeira reunião comercial', 'admin-id-123')
  `);
  
  // Inserir passos da cadência inicial
  await pool.query(`
    INSERT OR IGNORE INTO followup_steps (sequence_id, step_order, day_offset, interaction_type, title, notes) VALUES 
    ('seq-prospect-inicial', 1, 0, 'ligacao', 'Primeira ligação', 'Apresentar a empresa e verificar interesse'),
    ('seq-prospect-inicial', 2, 3, 'email', 'Email com materiais', 'Enviar portfólio e casos de sucesso'),
    ('seq-prospect-inicial', 3, 7, 'whatsapp', 'Follow-up WhatsApp', 'Mensagem perguntando se recebeu os materiais'),
    ('seq-prospect-inicial', 4, 14, 'ligacao', 'Segunda ligação', 'Propor reunião para apresentação detalhada')
  `);
  
  // Inserir passos da cadência pós-reunião
  await pool.query(`
    INSERT OR IGNORE INTO followup_steps (sequence_id, step_order, day_offset, interaction_type, title, notes) VALUES 
    ('seq-pos-reuniao', 1, 1, 'email', 'Email pós-reunião', 'Agradecer reunião e enviar proposta'),
    ('seq-pos-reuniao', 2, 5, 'ligacao', 'Follow-up proposta', 'Ligar para tirar dúvidas sobre a proposta'),
    ('seq-pos-reuniao', 3, 10, 'whatsapp', 'Lembrete WhatsApp', 'Lembrar da proposta enviada'),
    ('seq-pos-reuniao', 4, 15, 'ligacao', 'Última tentativa', 'Última tentativa antes de considerar perdido')
  `);
}

// Executar se chamado diretamente
if (require.main === module) {
  setupSQLiteDatabase().then(() => process.exit(0));
}

module.exports = setupSQLiteDatabase;