const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório de uploads para tarefas se não existir
const tasksUploadsDir = path.join(__dirname, '../../uploads/tasks');
if (!fs.existsSync(tasksUploadsDir)) {
  fs.mkdirSync(tasksUploadsDir, { recursive: true });
}

// Configuração do storage para anexos de tarefas
const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar subdiretório por ano/mês para organização
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthlyDir = path.join(tasksUploadsDir, `${year}`, `${month}`);
    
    if (!fs.existsSync(monthlyDir)) {
      fs.mkdirSync(monthlyDir, { recursive: true });
    }
    
    cb(null, monthlyDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: taskId_timestamp_original-name
    const taskId = req.params.taskId || req.params.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const cleanName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `task_${taskId}_${timestamp}_${cleanName}${ext}`);
  }
});

// Filtro de arquivos permitidos para tarefas (mais tipos que o upload geral)
const taskFileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Imagens
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documentos
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Arquivos comprimidos
    'application/zip',
    'application/x-rar-compressed',
    
    // Outros
    'application/json',
    'text/xml',
    'application/xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const allowedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'pdf', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'zip', 'rar', 'json', 'xml'
    ];
    cb(new Error(`Tipo de arquivo não permitido. Use: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configuração do multer para tarefas
const taskUpload = multer({
  storage: taskStorage,
  fileFilter: taskFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max para tarefas
    files: 5 // Até 5 arquivos por vez
  }
});

// Middleware para upload único de tarefa
const uploadTaskSingle = taskUpload.single('attachment');

// Middleware para múltiplos uploads de tarefa
const uploadTaskMultiple = taskUpload.array('attachments', 5);

// Middleware para tratar erros de upload de tarefas
const handleTaskUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 25MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Muitos arquivos. Envie no máximo 5 arquivos por vez' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Campo de arquivo inválido. Use "attachment" para um arquivo ou "attachments" para múltiplos' });
    }
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

// Função auxiliar para deletar arquivo do filesystem
const deleteTaskFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
};

// Função auxiliar para obter informações de arquivo
const getFileInfo = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    }
    return { exists: false };
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
    return { exists: false, error: error.message };
  }
};

module.exports = {
  uploadTaskSingle,
  uploadTaskMultiple,
  handleTaskUploadError,
  deleteTaskFile,
  getFileInfo,
  tasksUploadsDir
};