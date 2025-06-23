#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando CRM Backend em modo produção...');

// Set production environment
process.env.NODE_ENV = 'production';

// Initialize database if needed
console.log('📊 Verificando banco de dados...');

const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    exec('npm run setup:sqlite', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️  Database setup failed (may already exist):', error.message);
        resolve(); // Continue anyway
      } else {
        console.log('✅ Database setup completed');
        resolve();
      }
    });
  });
};

const startServer = () => {
  console.log('🔧 Iniciando servidor...');
  require('./src/server.js');
};

// Run setup and start server
setupDatabase()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });