#!/usr/bin/env node

const backupManager = require('../src/utils/backup');

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'create':
      case 'backup':
        const type = args[0] || 'manual';
        const description = args[1] || '';
        await backupManager.createBackup({ 
          type, 
          description: description || `Backup ${type} via CLI` 
        });
        break;
        
      case 'list':
        const backups = await backupManager.getBackupList();
        console.log('\n📋 Lista de Backups:');
        console.log('==================');
        
        if (backups.length === 0) {
          console.log('Nenhum backup encontrado.');
        } else {
          backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.name}`);
            console.log(`   Tipo: ${backup.type}`);
            console.log(`   Tamanho: ${backupManager.formatFileSize(backup.size)}`);
            console.log(`   Criado: ${new Date(backup.created_at).toLocaleString()}`);
            console.log(`   Comprimido: ${backup.compressed ? 'Sim' : 'Não'}`);
            console.log(`   Verificado: ${backup.verified ? 'Sim' : 'Não'}`);
            if (backup.description) {
              console.log(`   Descrição: ${backup.description}`);
            }
            console.log('');
          });
        }
        break;
        
      case 'restore':
        if (!args[0]) {
          console.error('❌ Nome do backup é obrigatório');
          console.log('Uso: npm run backup:restore "nome_do_backup"');
          process.exit(1);
        }
        
        await backupManager.restoreBackup(args[0]);
        break;
        
      case 'stats':
        const stats = await backupManager.getBackupStats();
        if (stats) {
          console.log('\n📊 Estatísticas dos Backups:');
          console.log('============================');
          console.log(`Total de backups: ${stats.total}`);
          console.log(`Tamanho total: ${backupManager.formatFileSize(stats.totalSize)}`);
          console.log(`Tamanho médio: ${backupManager.formatFileSize(stats.averageSize)}`);
          
          if (stats.total > 0) {
            console.log('\nPor tipo:');
            Object.entries(stats.types).forEach(([type, count]) => {
              console.log(`  ${type}: ${count}`);
            });
            
            console.log(`\nMais antigo: ${stats.oldestBackup.name} (${new Date(stats.oldestBackup.created_at).toLocaleString()})`);
            console.log(`Mais recente: ${stats.newestBackup.name} (${new Date(stats.newestBackup.created_at).toLocaleString()})`);
          }
        }
        break;
        
      case 'health':
      case 'check':
        await backupManager.healthCheck();
        break;
        
      case 'cleanup':
        await backupManager.cleanupOldBackups();
        break;
        
      case 'start-auto':
        const autoBackup = backupManager.setupAutomaticBackup();
        autoBackup.start();
        console.log('⏰ Backup automático iniciado. Pressione Ctrl+C para parar.');
        
        // Manter o processo rodando
        process.on('SIGINT', () => {
          autoBackup.stop();
          console.log('\n⏸️ Backup automático parado.');
          process.exit(0);
        });
        
        // Manter vivo
        setInterval(() => {}, 1000);
        break;
        
      default:
        console.log(`
💾 Gerenciador de Backup CRM

Comandos disponíveis:
  create, backup [tipo] [descrição] - Cria um novo backup
  list                              - Lista todos os backups
  restore <nome>                    - Restaura um backup específico
  stats                            - Mostra estatísticas dos backups
  health, check                    - Verifica integridade dos backups
  cleanup                          - Remove backups antigos
  start-auto                       - Inicia backup automático (cron)
  
Exemplos:
  node scripts/backup.js create manual "Backup antes da atualização"
  node scripts/backup.js list
  node scripts/backup.js restore "crm_backup_manual_2025-06-22T10-00-00"
  node scripts/backup.js stats
  node scripts/backup.js health
  
Via npm scripts:
  npm run backup:create
  npm run backup:list
  npm run backup:restore "nome_do_backup"
  npm run backup:stats
  npm run backup:health
  npm run backup:auto
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();