const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Criar banco SQLite em memória para demonstração
const dbPath = path.join(__dirname, '../../crm_demo.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar com SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao banco SQLite');
  }
});

// Adapter para simular interface do PostgreSQL
const sqliteAdapter = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Converter SQL PostgreSQL para SQLite
      let convertedSql = sql
        .replace(/\$(\d+)/g, '?')  // $1, $2 -> ?
        .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")  // CURRENT_TIMESTAMP
        .replace(/uuid_generate_v4\(\)/g, "lower(hex(randomblob(16)))")  // UUID
        .replace(/UUID/g, 'TEXT')  // UUID type
        .replace(/BOOLEAN/g, 'INTEGER')  // BOOLEAN type
        .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL')  // DECIMAL type
        .replace(/CREATE EXTENSION[^;]+;/g, '')  // Remove extensions
        .replace(/CREATE OR REPLACE FUNCTION[^$]+\$\$/g, '')  // Remove functions
        .replace(/CREATE TRIGGER[^;]+;/g, '');  // Remove triggers

      if (sql.toLowerCase().includes('select')) {
        db.all(convertedSql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      } else {
        db.run(convertedSql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              rows: [], 
              rowCount: this.changes,
              lastID: this.lastID 
            });
          }
        });
      }
    });
  },

  end: () => {
    return new Promise((resolve) => {
      db.close(resolve);
    });
  }
};

module.exports = sqliteAdapter;