// Teste mock para verificar se as configurações estão corretas
// sem necessidade de PostgreSQL rodando

console.log('🔍 Verificando configurações do projeto...\n');

// Verificar se .env existe
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado');
  
  // Carregar variáveis
  require('dotenv').config({ path: envPath });
  
  console.log('📊 Configurações:');
  console.log(`  - Porta: ${process.env.PORT || 'NÃO DEFINIDA'}`);
  console.log(`  - Banco: ${process.env.DB_NAME || 'NÃO DEFINIDA'}`);
  console.log(`  - Host: ${process.env.DB_HOST || 'NÃO DEFINIDA'}`);
  console.log(`  - Usuário: ${process.env.DB_USER || 'NÃO DEFINIDA'}`);
  console.log(`  - JWT Secret: ${process.env.JWT_SECRET ? 'DEFINIDO' : 'NÃO DEFINIDO'}`);
} else {
  console.log('❌ Arquivo .env não encontrado');
}

// Verificar arquivos do banco
const schemaPath = path.join(__dirname, 'schema.sql');
const seedsPath = path.join(__dirname, 'seeds.sql');

console.log('\n🗄️ Arquivos do banco:');
console.log(`  - Schema: ${fs.existsSync(schemaPath) ? '✅' : '❌'}`);
console.log(`  - Seeds: ${fs.existsSync(seedsPath) ? '✅' : '❌'}`);

// Verificar dependências
console.log('\n📦 Dependências críticas:');
try {
  require('express');
  console.log('  - Express: ✅');
} catch (e) {
  console.log('  - Express: ❌');
}

try {
  require('pg');
  console.log('  - PostgreSQL driver: ✅');
} catch (e) {
  console.log('  - PostgreSQL driver: ❌');
}

try {
  require('dotenv');
  console.log('  - Dotenv: ✅');
} catch (e) {
  console.log('  - Dotenv: ❌');
}

console.log('\n🎯 Próximos passos:');
console.log('1. Instale PostgreSQL (veja SETUP.md)');
console.log('2. Execute: npm run setup:db');
console.log('3. Execute: npm run dev');
console.log('\n📖 Consulte o arquivo SETUP.md para instruções detalhadas.');