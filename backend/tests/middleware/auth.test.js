const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../src/middleware/auth');
const { testDb } = require('../setup');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';

describe('Auth Middleware', () => {
  let testUser;
  let req, res, next;

  beforeEach(async () => {
    const db = testDb();
    
    // Create test user
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
        ['Test User', 'test@example.com', 'hashedpassword', 'admin', 1],
        function(err) {
          if (err) reject(err);
          else {
            testUser = { 
              id: this.lastID, 
              name: 'Test User', 
              email: 'test@example.com', 
              role: 'admin' 
            };
            resolve();
          }
        }
      );
    });

    // Setup mock request, response, and next
    req = {
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers['authorization'] = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      });
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token de acesso requerido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      req.headers['authorization'] = 'InvalidHeader';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token de acesso requerido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', async () => {
      req.headers['authorization'] = 'Bearer invalid-token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      req.headers['authorization'] = `Bearer ${expiredToken}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expirado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user does not exist', async () => {
      const token = jwt.sign(
        { userId: 99999, email: 'nonexistent@example.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers['authorization'] = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não encontrado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is inactive', async () => {
      const db = testDb();
      
      // Deactivate the user
      await new Promise((resolve) => {
        db.run('UPDATE users SET is_active = 0 WHERE id = ?', [testUser.id], resolve);
      });

      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers['authorization'] = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário inativo' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle different token formats correctly', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Test with proper Bearer format
      req.headers['authorization'] = `Bearer ${token}`;
      await authenticateToken(req, res, next);
      expect(next).toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Test with lowercase bearer
      req.headers['authorization'] = `bearer ${token}`;
      await authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token de acesso requerido' });
    });

    it('should preserve user data in request object', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers['authorization'] = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(testUser.id);
      expect(req.user.name).toBe(testUser.name);
      expect(req.user.email).toBe(testUser.email);
      expect(req.user.role).toBe(testUser.role);
      expect(req.user).not.toHaveProperty('password_hash');
      expect(req.user).not.toHaveProperty('is_active');
    });

    it('should handle token with different user roles', async () => {
      const db = testDb();
      
      // Create user with different role
      let employeeUser;
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
          ['Employee User', 'employee@example.com', 'hashedpassword', 'funcionario', 1],
          function(err) {
            if (err) reject(err);
            else {
              employeeUser = { 
                id: this.lastID, 
                name: 'Employee User', 
                email: 'employee@example.com', 
                role: 'funcionario' 
              };
              resolve();
            }
          }
        );
      });

      const token = jwt.sign(
        { userId: employeeUser.id, email: employeeUser.email, role: employeeUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers['authorization'] = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.role).toBe('funcionario');
    });
  });
});