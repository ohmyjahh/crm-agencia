const pool = require('./src/config/database');

console.log('🔄 Iniciando migração do banco de dados...');

// Executar migrações em sequência
async function runMigrations() {
  try {
    console.log('📝 Adicionando novas colunas na tabela clients...');
    
    // Adicionar novas colunas na tabela clients
    try {
      await pool.query(`ALTER TABLE clients ADD COLUMN category TEXT DEFAULT 'bronze'`);
      console.log('✅ Coluna category adicionada');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna category já existe');
      } else {
        console.error('Erro ao adicionar coluna category:', err.message);
      }
    }

    try {
      await pool.query(`ALTER TABLE clients ADD COLUMN service_format TEXT DEFAULT 'avulso'`);
      console.log('✅ Coluna service_format adicionada');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna service_format já existe');
      } else {
        console.error('Erro ao adicionar coluna service_format:', err.message);
      }
    }

    try {
      await pool.query(`ALTER TABLE clients ADD COLUMN average_ticket REAL DEFAULT 0`);
      console.log('✅ Coluna average_ticket adicionada');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna average_ticket já existe');
      } else {
        console.error('Erro ao adicionar coluna average_ticket:', err.message);
      }
    }

    try {
      await pool.query(`ALTER TABLE clients ADD COLUMN total_purchases INTEGER DEFAULT 0`);
      console.log('✅ Coluna total_purchases adicionada');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna total_purchases já existe');
      } else {
        console.error('Erro ao adicionar coluna total_purchases:', err.message);
      }
    }

    try {
      await pool.query(`ALTER TABLE clients ADD COLUMN first_purchase_date TEXT`);
      console.log('✅ Coluna first_purchase_date adicionada');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna first_purchase_date já existe');
      } else {
        console.error('Erro ao adicionar coluna first_purchase_date:', err.message);
      }
    }

    try {
      await pool.query(`ALTER TABLE clients ADD COLUMN last_purchase_date TEXT`);
      console.log('✅ Coluna last_purchase_date adicionada');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna last_purchase_date já existe');
      } else {
        console.error('Erro ao adicionar coluna last_purchase_date:', err.message);
      }
    }

    console.log('📝 Criando tabela services...');
    
    // Criar tabela de serviços
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        base_price REAL,
        service_type TEXT DEFAULT 'avulso' CHECK (service_type IN ('recorrente', 'avulso', 'personalizado')),
        estimated_hours INTEGER,
        is_active INTEGER DEFAULT 1,
        created_by TEXT REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`);
      console.log('✅ Tabela services criada/verificada');
    } catch (err) {
      console.error('Erro ao criar tabela services:', err.message);
    }

    console.log('📝 Criando tabela client_purchases...');
    
    // Criar tabela de histórico de compras
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS client_purchases (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        service_id TEXT REFERENCES services(id),
        purchase_number INTEGER NOT NULL,
        amount REAL NOT NULL,
        purchase_date TEXT NOT NULL,
        status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
        payment_method TEXT,
        notes TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(client_id, purchase_number)
      )`);
      console.log('✅ Tabela client_purchases criada/verificada');
    } catch (err) {
      console.error('Erro ao criar tabela client_purchases:', err.message);
    }

    console.log('📝 Criando tabela client_services...');
    
    // Criar tabela de serviços contratados
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS client_services (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        contract_date TEXT NOT NULL,
        end_date TEXT,
        monthly_value REAL,
        status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'concluido')),
        notes TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(client_id, service_id, contract_date)
      )`);
      console.log('✅ Tabela client_services criada/verificada');
    } catch (err) {
      console.error('Erro ao criar tabela client_services:', err.message);
    }

    console.log('📝 Adicionando coluna service_id na tabela tasks...');
    
    // Adicionar coluna service_id na tabela tasks
    try {
      await pool.query(`ALTER TABLE tasks ADD COLUMN service_id TEXT REFERENCES services(id)`);
      console.log('✅ Coluna service_id adicionada na tabela tasks');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Coluna service_id já existe na tabela tasks');
      } else {
        console.error('Erro ao adicionar coluna service_id em tasks:', err.message);
      }
    }

    console.log('📝 Inserindo dados iniciais de serviços...');
    
    // Inserir dados iniciais de serviços
    const services = [
      ['marketing-digital', 'Marketing Digital', 'Gestão completa de redes sociais e campanhas digitais', 'Marketing', 2500.00, 'recorrente', 40],
      ['desenvolvimento-web', 'Desenvolvimento Web', 'Criação e desenvolvimento de sites e sistemas web', 'Tecnologia', 8500.00, 'personalizado', 120],
      ['consultoria-empresarial', 'Consultoria Empresarial', 'Consultoria estratégica para crescimento empresarial', 'Consultoria', 3500.00, 'avulso', 20],
      ['design-grafico', 'Design Gráfico', 'Criação de identidade visual e materiais gráficos', 'Design', 1800.00, 'avulso', 30],
      ['seo-otimizacao', 'SEO e Otimização', 'Otimização de sites para mecanismos de busca', 'Marketing', 1500.00, 'recorrente', 25],
      ['manutencao-sistemas', 'Manutenção de Sistemas', 'Manutenção e suporte técnico de sistemas', 'Tecnologia', 800.00, 'recorrente', 10]
    ];

    for (const [id, name, description, category, base_price, service_type, estimated_hours] of services) {
      try {
        await pool.query(
          `INSERT OR IGNORE INTO services (id, name, description, category, base_price, service_type, estimated_hours, is_active, created_by, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'system', datetime('now'))`,
          [id, name, description, category, base_price, service_type, estimated_hours]
        );
        console.log(`✅ Serviço ${name} inserido/verificado`);
      } catch (err) {
        console.error(`Erro ao inserir serviço ${name}:`, err.message);
      }
    }

    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

runMigrations().then(() => {
  console.log('✨ Banco de dados atualizado. Você pode reiniciar o servidor agora.');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});