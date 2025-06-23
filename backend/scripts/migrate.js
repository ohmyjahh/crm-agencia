#!/usr/bin/env node

const migrationManager = require('../src/utils/migrations');

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'migrate':
      case 'up':
        await migrationManager.migrate();
        break;
        
      case 'rollback':
      case 'down':
        await migrationManager.rollback();
        break;
        
      case 'status':
        await migrationManager.status();
        break;
        
      case 'generate':
      case 'create':
        if (!args[0]) {
          console.error('❌ Nome da migração é obrigatório');
          console.log('Uso: npm run migrate:generate "nome da migração"');
          process.exit(1);
        }
        await migrationManager.generate(args[0]);
        break;
        
      default:
        console.log(`
🗃️  Gerenciador de Migrações CRM

Comandos disponíveis:
  migrate, up      - Executa todas as migrações pendentes
  rollback, down   - Desfaz a última migração
  status           - Mostra o status de todas as migrações
  generate, create - Gera uma nova migração
  
Exemplos:
  node scripts/migrate.js migrate
  node scripts/migrate.js rollback
  node scripts/migrate.js status
  node scripts/migrate.js generate "add user preferences"
  
Via npm scripts:
  npm run migrate
  npm run migrate:rollback
  npm run migrate:status
  npm run migrate:generate "add user preferences"
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();