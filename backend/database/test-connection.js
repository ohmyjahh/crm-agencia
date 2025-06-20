const pool = require('../src/config/database');

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    // Teste básico de conexão
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão bem sucedida!');
    console.log('⏰ Horário do servidor:', result.rows[0].current_time);
    
    // Verificar se as tabelas existem
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('\n📊 Tabelas encontradas:');
      tables.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('\n⚠️  Nenhuma tabela encontrada. Execute: npm run setup:db');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.log('\n🔧 Verifique se:');
    console.log('  - PostgreSQL está rodando');
    console.log('  - Banco de dados existe');
    console.log('  - Credenciais no .env estão corretas');
  } finally {
    await pool.end();
  }
}

testConnection();