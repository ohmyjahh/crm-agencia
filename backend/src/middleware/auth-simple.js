const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../crm_demo.db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const db = new sqlite3.Database(dbPath);
    
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
        [decoded.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    db.close();

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuário inativo'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
    
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido'
    });
  }
};

module.exports = authenticateToken;