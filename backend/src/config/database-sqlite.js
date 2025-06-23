const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class OptimizedSQLiteAdapter {
  constructor() {
    // Configurar caminho do banco
    this.dbPath = path.join(__dirname, '../../crm_demo.db');
    
    // Pool de prepared statements para reutilização
    this.preparedStatements = new Map();
    
    // Estatísticas de performance
    this.stats = {
      queries: 0,
      transactions: 0,
      preparedHits: 0,
      errors: 0,
      avgQueryTime: 0,
      totalQueryTime: 0
    };
    
    this.initialize();
  }

  async initialize() {
    // Conectar ao banco com configurações otimizadas
    this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar com SQLite:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Conectado ao banco SQLite');
        this.setupOptimizations();
      }
    });

    // Configurar event listeners
    this.setupEventListeners();
  }

  /**
   * Configurar otimizações SQLite usando PRAGMAs
   */
  async setupOptimizations() {
    const optimizations = [
      // Otimizações de performance
      'PRAGMA journal_mode = WAL',              // Write-Ahead Logging para melhor concorrência
      'PRAGMA synchronous = NORMAL',            // Balanço entre segurança e performance
      'PRAGMA cache_size = 10000',              // 10MB de cache (10000 páginas de 1KB)
      'PRAGMA temp_store = MEMORY',             // Armazenar tabelas temporárias em memória
      'PRAGMA mmap_size = 268435456',           // 256MB de memory-mapped I/O
      
      // Otimizações de análise de queries
      'PRAGMA optimize',                        // Análise automática de estatísticas
      
      // Configurações de segurança
      'PRAGMA foreign_keys = ON',               // Habilitar foreign keys
      'PRAGMA case_sensitive_like = ON',        // LIKE case-sensitive
      
      // Configurações de checkpoint automático (para WAL)
      'PRAGMA wal_autocheckpoint = 1000',       // Checkpoint a cada 1000 páginas
    ];

    for (const pragma of optimizations) {
      try {
        await this.runPragma(pragma);
      } catch (error) {
        console.warn(`⚠️ Não foi possível executar: ${pragma}`, error.message);
      }
    }

    console.log('⚡ Otimizações SQLite aplicadas');
  }

  /**
   * Executar PRAGMA
   */
  runPragma(pragma) {
    return new Promise((resolve, reject) => {
      this.db.exec(pragma, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Configurar listeners de eventos
   */
  setupEventListeners() {
    // Log de estatísticas a cada 1000 queries
    setInterval(() => {
      if (this.stats.queries > 0 && this.stats.queries % 1000 === 0) {
        this.logStats();
      }
    }, 60000); // verificar a cada minuto
  }

  /**
   * Método principal de query com otimizações
   */
  async query(sql, params = []) {
    const startTime = Date.now();
    this.stats.queries++;

    try {
      // Converter SQL PostgreSQL para SQLite
      const convertedSql = this.convertPostgreSQLToSQLite(sql);
      
      // Usar prepared statement se possível
      const result = await this.executeOptimizedQuery(convertedSql, params);
      
      // Registrar tempo de execução
      const queryTime = Date.now() - startTime;
      this.stats.totalQueryTime += queryTime;
      this.stats.avgQueryTime = this.stats.totalQueryTime / this.stats.queries;

      // Log queries lentas (>100ms)
      if (queryTime > 100) {
        console.warn(`🐌 Query lenta (${queryTime}ms): ${convertedSql.substring(0, 100)}...`);
      }

      return result;

    } catch (error) {
      this.stats.errors++;
      console.error('❌ Erro na query:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Executar query otimizada com prepared statements
   */
  executeOptimizedQuery(sql, params) {
    return new Promise((resolve, reject) => {
      // Gerar chave para cache de prepared statement
      const stmtKey = this.generateStatementKey(sql);
      
      if (sql.toLowerCase().trim().startsWith('select')) {
        // SELECT queries
        if (this.preparedStatements.has(stmtKey)) {
          // Usar prepared statement existente
          this.stats.preparedHits++;
          const stmt = this.preparedStatements.get(stmtKey);
          stmt.all(params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows: rows || [] });
          });
        } else {
          // Criar novo prepared statement
          const stmt = this.db.prepare(sql);
          this.preparedStatements.set(stmtKey, stmt);
          
          stmt.all(params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows: rows || [] });
          });
        }
      } else {
        // INSERT, UPDATE, DELETE queries
        if (this.preparedStatements.has(stmtKey)) {
          this.stats.preparedHits++;
          const stmt = this.preparedStatements.get(stmtKey);
          stmt.run(params, function(err) {
            if (err) reject(err);
            else resolve({ 
              rows: [], 
              rowCount: this.changes,
              lastID: this.lastID 
            });
          });
        } else {
          const stmt = this.db.prepare(sql);
          this.preparedStatements.set(stmtKey, stmt);
          
          stmt.run(params, function(err) {
            if (err) reject(err);
            else resolve({ 
              rows: [], 
              rowCount: this.changes,
              lastID: this.lastID 
            });
          });
        }
      }
    });
  }

  /**
   * Converter SQL PostgreSQL para SQLite
   */
  convertPostgreSQLToSQLite(sql) {
    return sql
      .replace(/\$(\d+)/g, '?')  // $1, $2 -> ?
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")  // CURRENT_TIMESTAMP
      .replace(/NOW\(\)/g, "datetime('now')")  // NOW()
      .replace(/uuid_generate_v4\(\)/g, "lower(hex(randomblob(16)))")  // UUID
      .replace(/UUID/g, 'TEXT')  // UUID type
      .replace(/BOOLEAN/g, 'INTEGER')  // BOOLEAN type
      .replace(/SERIAL/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')  // SERIAL type
      .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL')  // DECIMAL type
      .replace(/VARCHAR\(\d+\)/g, 'TEXT')  // VARCHAR type
      .replace(/TIMESTAMP/g, 'TEXT')  // TIMESTAMP type
      .replace(/CREATE EXTENSION[^;]+;/g, '')  // Remove extensions
      .replace(/CREATE OR REPLACE FUNCTION[^$]+\$\$/g, '')  // Remove functions
      .replace(/LIMIT\s+ALL/gi, '')  // Remove LIMIT ALL
      .replace(/OFFSET\s+0/gi, '');  // Remove OFFSET 0
  }

  /**
   * Gerar chave única para statement
   */
  generateStatementKey(sql) {
    // Normalizar SQL para cache
    const normalized = sql
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    
    // Usar hash simples para chave
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  /**
   * Executar transação
   */
  async transaction(queries) {
    this.stats.transactions++;
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        
        const results = [];
        let completed = 0;
        let hasError = false;

        const executeNext = (index) => {
          if (index >= queries.length) {
            if (hasError) {
              this.db.run("ROLLBACK", () => {
                reject(new Error('Transaction rolled back due to error'));
              });
            } else {
              this.db.run("COMMIT", () => {
                resolve(results);
              });
            }
            return;
          }

          const { sql, params = [] } = queries[index];
          const convertedSql = this.convertPostgreSQLToSQLite(sql);

          if (convertedSql.toLowerCase().trim().startsWith('select')) {
            this.db.all(convertedSql, params, (err, rows) => {
              if (err) {
                hasError = true;
                results.push({ error: err.message });
              } else {
                results.push({ rows: rows || [] });
              }
              executeNext(index + 1);
            });
          } else {
            this.db.run(convertedSql, params, function(err) {
              if (err) {
                hasError = true;
                results.push({ error: err.message });
              } else {
                results.push({ 
                  rows: [], 
                  rowCount: this.changes,
                  lastID: this.lastID 
                });
              }
              executeNext(index + 1);
            });
          }
        };

        executeNext(0);
      });
    });
  }

  /**
   * Executar batch de queries (mais eficiente que múltiplas queries individuais)
   */
  async batch(queries) {
    const results = [];
    
    for (const { sql, params = [] } of queries) {
      try {
        const result = await this.query(sql, params);
        results.push(result);
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Executar EXPLAIN QUERY PLAN para análise de performance
   */
  async explain(sql, params = []) {
    const explainSql = `EXPLAIN QUERY PLAN ${sql}`;
    return await this.query(explainSql, params);
  }

  /**
   * Obter estatísticas de performance
   */
  getStats() {
    return {
      ...this.stats,
      preparedStatementsCount: this.preparedStatements.size,
      hitRate: this.stats.preparedHits / this.stats.queries || 0
    };
  }

  /**
   * Log de estatísticas
   */
  logStats() {
    const stats = this.getStats();
    console.log('📊 Database Stats:', {
      queries: stats.queries,
      avgQueryTime: `${stats.avgQueryTime.toFixed(2)}ms`,
      hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
      preparedStatements: stats.preparedStatementsCount,
      errors: stats.errors
    });
  }

  /**
   * Limpar cache de prepared statements
   */
  clearPreparedStatements() {
    this.preparedStatements.forEach(stmt => {
      try {
        stmt.finalize();
      } catch (error) {
        // Ignorar erros na finalização
      }
    });
    this.preparedStatements.clear();
    console.log('🧹 Cache de prepared statements limpo');
  }

  /**
   * Análise de índices
   */
  async analyzeIndexes() {
    const indexQuery = `
      SELECT 
        name,
        tbl_name,
        sql
      FROM sqlite_master 
      WHERE type = 'index' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `;
    
    return await this.query(indexQuery);
  }

  /**
   * Vacuum e analyze para otimização
   */
  async optimize() {
    console.log('⚡ Otimizando banco de dados...');
    
    try {
      await this.runPragma('VACUUM');
      await this.runPragma('ANALYZE');
      await this.runPragma('PRAGMA optimize');
      
      console.log('✅ Otimização concluída');
    } catch (error) {
      console.error('❌ Erro na otimização:', error);
    }
  }

  /**
   * Fechar conexão
   */
  async end() {
    return new Promise((resolve) => {
      // Finalizar prepared statements
      this.clearPreparedStatements();
      
      // Fechar conexão
      this.db.close((err) => {
        if (err) {
          console.error('❌ Erro ao fechar banco:', err.message);
        } else {
          console.log('✅ Conexão com banco fechada');
        }
        resolve();
      });
    });
  }

  /**
   * Checkpoint manual para WAL mode
   */
  async checkpoint() {
    return new Promise((resolve, reject) => {
      this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Criar instância singleton
const sqliteAdapter = new OptimizedSQLiteAdapter();

module.exports = sqliteAdapter;