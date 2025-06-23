const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const zlib = require('zlib');
const crypto = require('crypto');

class BackupManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../../crm_demo.db');
    this.backupDir = path.join(__dirname, '../../backups');
    this.maxBackups = 30; // manter 30 backups
    this.compressionLevel = 6; // nível de compressão gzip
    
    this.isRunning = false;
    this.cronJobs = [];
    
    this.ensureBackupDirectory();
  }

  /**
   * Garantir que o diretório de backup existe
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Diretório de backup criado: ${this.backupDir}`);
    }
  }

  /**
   * Criar backup do banco de dados
   */
  async createBackup(options = {}) {
    const { 
      type = 'manual',
      compress = true,
      verify = true,
      description = ''
    } = options;

    if (this.isRunning) {
      throw new Error('Backup já está em execução');
    }

    this.isRunning = true;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `crm_backup_${type}_${timestamp}`;
      const backupPath = path.join(this.backupDir, `${backupName}.db`);
      const compressedPath = `${backupPath}.gz`;

      console.log(`🔄 Iniciando backup ${type}: ${backupName}`);

      // Verificar se o banco de dados existe
      await fs.access(this.dbPath);

      // Copiar arquivo do banco
      await fs.copyFile(this.dbPath, backupPath);

      let finalPath = backupPath;
      let fileSize = (await fs.stat(backupPath)).size;

      // Comprimir se solicitado
      if (compress) {
        await this.compressFile(backupPath, compressedPath);
        await fs.unlink(backupPath); // remover arquivo não comprimido
        finalPath = compressedPath;
        fileSize = (await fs.stat(compressedPath)).size;
      }

      // Verificar integridade do backup
      if (verify) {
        const isValid = await this.verifyBackup(finalPath, compress);
        if (!isValid) {
          throw new Error('Verificação de integridade do backup falhou');
        }
      }

      // Calcular hash para verificação
      const hash = await this.calculateFileHash(finalPath);

      // Criar metadata do backup
      const metadata = {
        name: backupName,
        type,
        path: finalPath,
        size: fileSize,
        compressed: compress,
        hash,
        created_at: new Date().toISOString(),
        description: description || `Backup ${type} criado automaticamente`,
        verified: verify
      };

      // Salvar metadata
      await this.saveBackupMetadata(metadata);

      console.log(`✅ Backup criado com sucesso: ${path.basename(finalPath)} (${this.formatFileSize(fileSize)})`);

      // Limpar backups antigos
      await this.cleanupOldBackups();

      return metadata;

    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Comprimir arquivo usando gzip
   */
  async compressFile(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const readStream = require('fs').createReadStream(inputPath);
      const writeStream = require('fs').createWriteStream(outputPath);
      const gzip = zlib.createGzip({ level: this.compressionLevel });

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  /**
   * Descomprimir arquivo gzip
   */
  async decompressFile(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const readStream = require('fs').createReadStream(inputPath);
      const writeStream = require('fs').createWriteStream(outputPath);
      const gunzip = zlib.createGunzip();

      readStream
        .pipe(gunzip)
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  /**
   * Verificar integridade do backup
   */
  async verifyBackup(backupPath, isCompressed = false) {
    try {
      let tempPath = backupPath;

      // Se comprimido, descomprimir temporariamente
      if (isCompressed) {
        tempPath = backupPath.replace('.gz', '.temp');
        await this.decompressFile(backupPath, tempPath);
      }

      // Verificar se é um arquivo SQLite válido
      const buffer = await fs.readFile(tempPath, { encoding: null, flag: 'r' });
      const isValidSQLite = buffer.slice(0, 16).toString() === 'SQLite format 3\0';

      // Limpar arquivo temporário se foi criado
      if (isCompressed && tempPath !== backupPath) {
        await fs.unlink(tempPath).catch(() => {}); // ignorar erro se arquivo não existe
      }

      return isValidSQLite;

    } catch (error) {
      console.error('❌ Erro na verificação do backup:', error);
      return false;
    }
  }

  /**
   * Calcular hash SHA256 do arquivo
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Salvar metadata do backup
   */
  async saveBackupMetadata(metadata) {
    const metadataPath = path.join(this.backupDir, 'backups.json');
    
    try {
      // Ler metadata existente
      let backups = [];
      try {
        const data = await fs.readFile(metadataPath, 'utf8');
        backups = JSON.parse(data);
      } catch (error) {
        // Arquivo não existe, criar novo array
      }

      // Adicionar novo backup
      backups.push(metadata);

      // Ordenar por data (mais recente primeiro)
      backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Salvar
      await fs.writeFile(metadataPath, JSON.stringify(backups, null, 2));

    } catch (error) {
      console.error('❌ Erro ao salvar metadata do backup:', error);
    }
  }

  /**
   * Obter lista de backups
   */
  async getBackupList() {
    const metadataPath = path.join(this.backupDir, 'backups.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf8');
      const backups = JSON.parse(data);
      
      // Verificar se os arquivos ainda existem
      const validBackups = [];
      for (const backup of backups) {
        try {
          await fs.access(backup.path);
          validBackups.push(backup);
        } catch (error) {
          console.warn(`⚠️ Arquivo de backup não encontrado: ${backup.path}`);
        }
      }

      // Atualizar metadata se necessário
      if (validBackups.length !== backups.length) {
        await fs.writeFile(metadataPath, JSON.stringify(validBackups, null, 2));
      }

      return validBackups;

    } catch (error) {
      console.error('❌ Erro ao obter lista de backups:', error);
      return [];
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupName, options = {}) {
    const { 
      target = this.dbPath,
      createBackupBeforeRestore = true
    } = options;

    try {
      console.log(`🔄 Iniciando restauração do backup: ${backupName}`);

      // Obter lista de backups
      const backups = await this.getBackupList();
      const backup = backups.find(b => b.name === backupName);

      if (!backup) {
        throw new Error(`Backup não encontrado: ${backupName}`);
      }

      // Verificar se o arquivo de backup existe
      await fs.access(backup.path);

      // Criar backup atual antes de restaurar (se solicitado)
      if (createBackupBeforeRestore) {
        await this.createBackup({
          type: 'pre-restore',
          description: `Backup automático antes de restaurar ${backupName}`
        });
      }

      let sourceFile = backup.path;

      // Se o backup está comprimido, descomprimir primeiro
      if (backup.compressed) {
        const tempPath = path.join(this.backupDir, `restore_temp_${Date.now()}.db`);
        await this.decompressFile(backup.path, tempPath);
        sourceFile = tempPath;
      }

      // Verificar integridade antes de restaurar
      const isValid = await this.verifyBackup(sourceFile, false);
      if (!isValid) {
        throw new Error('Backup corrompido ou inválido');
      }

      // Copiar arquivo para o destino
      await fs.copyFile(sourceFile, target);

      // Limpar arquivo temporário se foi criado
      if (backup.compressed) {
        await fs.unlink(sourceFile).catch(() => {});
      }

      console.log(`✅ Backup restaurado com sucesso: ${backupName}`);

      return {
        success: true,
        backupName,
        restoredTo: target,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      throw error;
    }
  }

  /**
   * Limpar backups antigos
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.getBackupList();
      
      if (backups.length <= this.maxBackups) {
        return;
      }

      // Ordenar por data (mais antigo primeiro para remoção)
      const sortedBackups = [...backups].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const backupsToRemove = sortedBackups.slice(0, backups.length - this.maxBackups);

      console.log(`🧹 Limpando ${backupsToRemove.length} backups antigos...`);

      for (const backup of backupsToRemove) {
        try {
          await fs.unlink(backup.path);
          console.log(`🗑️ Backup removido: ${backup.name}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao remover backup ${backup.name}:`, error.message);
        }
      }

      // Atualizar metadata
      const remainingBackups = backups.filter(b => !backupsToRemove.some(r => r.name === b.name));
      const metadataPath = path.join(this.backupDir, 'backups.json');
      await fs.writeFile(metadataPath, JSON.stringify(remainingBackups, null, 2));

    } catch (error) {
      console.error('❌ Erro na limpeza de backups:', error);
    }
  }

  /**
   * Configurar backup automático com cron
   */
  setupAutomaticBackup() {
    // Backup diário às 2:00 AM
    const dailyJob = cron.schedule('0 2 * * *', async () => {
      try {
        await this.createBackup({
          type: 'daily',
          description: 'Backup automático diário'
        });
      } catch (error) {
        console.error('❌ Erro no backup automático diário:', error);
      }
    }, { scheduled: false });

    // Backup semanal aos domingos às 3:00 AM  
    const weeklyJob = cron.schedule('0 3 * * 0', async () => {
      try {
        await this.createBackup({
          type: 'weekly',
          description: 'Backup automático semanal'
        });
      } catch (error) {
        console.error('❌ Erro no backup automático semanal:', error);
      }
    }, { scheduled: false });

    this.cronJobs = [dailyJob, weeklyJob];

    return {
      start: () => {
        this.cronJobs.forEach(job => job.start());
        console.log('⏰ Backup automático iniciado');
      },
      stop: () => {
        this.cronJobs.forEach(job => job.stop());
        console.log('⏸️ Backup automático parado');
      }
    };
  }

  /**
   * Obter estatísticas dos backups
   */
  async getBackupStats() {
    try {
      const backups = await this.getBackupList();
      
      const stats = {
        total: backups.length,
        totalSize: backups.reduce((sum, b) => sum + b.size, 0),
        types: {},
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0
      };

      if (backups.length > 0) {
        // Agrupar por tipo
        backups.forEach(backup => {
          stats.types[backup.type] = (stats.types[backup.type] || 0) + 1;
        });

        // Backup mais antigo e mais novo
        const sorted = [...backups].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        stats.oldestBackup = sorted[0];
        stats.newestBackup = sorted[sorted.length - 1];

        // Tamanho médio
        stats.averageSize = stats.totalSize / backups.length;
      }

      return stats;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de backup:', error);
      return null;
    }
  }

  /**
   * Formatar tamanho do arquivo
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Health check dos backups
   */
  async healthCheck() {
    try {
      console.log('🏥 Executando health check dos backups...');

      const backups = await this.getBackupList();
      const results = {
        total: backups.length,
        healthy: 0,
        corrupted: 0,
        missing: 0,
        details: []
      };

      for (const backup of backups) {
        const result = {
          name: backup.name,
          status: 'unknown'
        };

        try {
          // Verificar se arquivo existe
          await fs.access(backup.path);

          // Verificar integridade
          const isValid = await this.verifyBackup(backup.path, backup.compressed);
          
          if (isValid) {
            result.status = 'healthy';
            results.healthy++;
          } else {
            result.status = 'corrupted';
            results.corrupted++;
          }

        } catch (error) {
          result.status = 'missing';
          result.error = error.message;
          results.missing++;
        }

        results.details.push(result);
      }

      console.log(`✅ Health check concluído: ${results.healthy} saudáveis, ${results.corrupted} corrompidos, ${results.missing} ausentes`);

      return results;

    } catch (error) {
      console.error('❌ Erro no health check:', error);
      throw error;
    }
  }
}

module.exports = new BackupManager();