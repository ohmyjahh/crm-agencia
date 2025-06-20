const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function setupDatabase() {
  try {
    console.log('🗄️  Iniciando setup do banco de dados...');
    
    // Ler arquivo de schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Executar schema
    await pool.query(schema);
    console.log('✅ Schema criado com sucesso!');
    
    // Ler arquivo de seeds
    const seedsPath = path.join(__dirname, 'seeds.sql');
    const seeds = fs.readFileSync(seedsPath, 'utf8');
    
    // Executar seeds
    await pool.query(seeds);
    console.log('✅ Dados iniciais inseridos!');
    
    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('📧 Admin: admin@crm.com');
    console.log('🔑 Senha: admin123');
    console.log('⚠️  Lembre-se de alterar a senha padrão!');
    
  } catch (error) {
    console.error('❌ Erro no setup:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;