require('dotenv').config();

// Se USE_SQLITE for true, usar SQLite para demonstração
if (process.env.USE_SQLITE === 'true') {
  console.log('🔄 Usando SQLite para demonstração...');
  module.exports = require('./database-sqlite');
} else {
  // Configuração original PostgreSQL
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  module.exports = pool;
}