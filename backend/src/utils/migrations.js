const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database-sqlite');

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../database/migrations');
  }

  /**
   * Executa todas as migrações pendentes
   */
  async migrate() {
    try {
      console.log('🔄 Iniciando processo de migração...');
      
      // Garantir que a tabela de migrações existe
      await this.ensureMigrationsTable();
      
      // Obter migrações pendentes
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        console.log('✅ Nenhuma migração pendente encontrada');
        return;
      }
      
      console.log(`📋 ${pendingMigrations.length} migrações pendentes encontradas`);
      
      // Executar migrações em ordem
      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }
      
      console.log('✅ Todas as migrações foram executadas com sucesso');
      
    } catch (error) {
      console.error('❌ Erro durante migração:', error);
      throw error;
    }
  }

  /**
   * Executa rollback da última migração
   */
  async rollback() {
    try {
      console.log('🔄 Iniciando rollback...');
      
      const lastMigration = await this.getLastMigration();
      if (!lastMigration) {
        console.log('ℹ️ Nenhuma migração para fazer rollback');
        return;
      }
      
      if (lastMigration.rollback_sql) {
        await db.query('BEGIN TRANSACTION');
        try {
          await db.query(lastMigration.rollback_sql);
          await db.query('DELETE FROM schema_migrations WHERE version = ?', [lastMigration.version]);
          await db.query('COMMIT');
          console.log(`✅ Rollback da migração ${lastMigration.version} executado com sucesso`);
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`⚠️ Migração ${lastMigration.version} não possui SQL de rollback`);
      }
      
    } catch (error) {
      console.error('❌ Erro durante rollback:', error);
      throw error;
    }
  }

  /**
   * Verifica o status das migrações
   */
  async status() {
    try {
      await this.ensureMigrationsTable();
      
      const allMigrations = await this.getAllMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      console.log('\n📊 Status das Migrações:');
      console.log('========================');
      
      for (const migration of allMigrations) {
        const isApplied = appliedMigrations.some(am => am.version === migration.version);
        const status = isApplied ? '✅ Aplicada' : '⏳ Pendente';
        const appliedAt = isApplied ? 
          appliedMigrations.find(am => am.version === migration.version).applied_at : 
          '';
        
        console.log(`${status} | ${migration.version} | ${migration.name} ${appliedAt ? '(' + appliedAt + ')' : ''}`);
      }
      
      console.log('========================\n');
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }

  /**
   * Garante que a tabela de migrações existe
   */
  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        name TEXT,
        applied_at TEXT DEFAULT (datetime('now')),
        rollback_sql TEXT
      )
    `;
    
    await db.query(createTableSQL);
  }

  /**
   * Obtém todas as migrações pendentes
   */
  async getPendingMigrations() {
    const allMigrations = await this.getAllMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    
    return allMigrations.filter(migration => 
      !appliedMigrations.some(applied => applied.version === migration.version)
    );
  }

  /**
   * Obtém todas as migrações aplicadas
   */
  async getAppliedMigrations() {
    const result = await db.query(
      'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
    );
    return result.rows;
  }

  /**
   * Obtém a última migração aplicada
   */
  async getLastMigration() {
    const result = await db.query(
      'SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    return result.rows[0] || null;
  }

  /**
   * Obtém todos os arquivos de migração
   */
  async getAllMigrationFiles() {
    const files = await fs.readdir(this.migrationsPath);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
    
    return sqlFiles.map(file => {
      const version = file.replace('.sql', '');
      const name = version.replace(/^\d+_/, '').replace(/_/g, ' ');
      return {
        version,
        name: this.capitalize(name),
        filename: file,
        filepath: path.join(this.migrationsPath, file)
      };
    });
  }

  /**
   * Executa uma migração específica
   */
  async runMigration(migration) {
    try {
      console.log(`🔄 Executando migração: ${migration.version}`);
      
      const sql = await fs.readFile(migration.filepath, 'utf8');
      
      await db.query('BEGIN TRANSACTION');
      
      try {
        // Dividir o SQL em comandos individuais
        const commands = this.splitSQLCommands(sql);
        
        for (const command of commands) {
          if (command.trim()) {
            await db.query(command);
          }
        }
        
        // Registrar migração como aplicada (se não estiver já registrada no próprio SQL)
        if (!sql.includes('INSERT OR IGNORE INTO schema_migrations')) {
          await db.query(
            'INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (?, ?)',
            [migration.version, migration.name]
          );
        }
        
        await db.query('COMMIT');
        console.log(`✅ Migração ${migration.version} executada com sucesso`);
        
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
      
    } catch (error) {
      console.error(`❌ Erro ao executar migração ${migration.version}:`, error);
      throw error;
    }
  }

  /**
   * Divide comandos SQL (lidando com comandos multi-linha como CREATE TRIGGER)
   */
  splitSQLCommands(sql) {
    // Remover comentários
    sql = sql.replace(/--.*$/gm, '');
    
    // Dividir por ponto e vírgula, mas considerar comandos multi-linha
    const commands = [];
    let currentCommand = '';
    let inTrigger = false;
    
    const lines = sql.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toUpperCase().startsWith('CREATE TRIGGER')) {
        inTrigger = true;
      }
      
      currentCommand += line + '\n';
      
      if (trimmedLine.endsWith(';')) {
        if (inTrigger && trimmedLine.toUpperCase() === 'END;') {
          inTrigger = false;
          commands.push(currentCommand.trim());
          currentCommand = '';
        } else if (!inTrigger) {
          commands.push(currentCommand.trim());
          currentCommand = '';
        }
      }
    }
    
    if (currentCommand.trim()) {
      commands.push(currentCommand.trim());
    }
    
    return commands.filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
  }

  /**
   * Capitaliza primeira letra de cada palavra
   */
  capitalize(str) {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  /**
   * Gera uma nova migração
   */
  async generate(name) {
    const timestamp = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s/g, '_')}.sql`;
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = `-- Migration: ${this.capitalize(name)}
-- Created: ${new Date().toISOString().split('T')[0]}
-- Description: ${this.capitalize(name)}

-- Add your SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--   id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
--   name TEXT NOT NULL,
--   created_at TEXT DEFAULT (datetime('now'))
-- );

-- Add indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_example_table_name ON example_table(name);

-- Register migration (optional - will be done automatically if not present)
-- INSERT OR IGNORE INTO schema_migrations (version, name) VALUES ('${filename.replace('.sql', '')}', '${this.capitalize(name)}');
`;

    await fs.writeFile(filepath, template);
    console.log(`✅ Nova migração criada: ${filename}`);
    return filepath;
  }
}

module.exports = new MigrationManager();