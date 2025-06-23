const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { testDb } = require('../setup');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';

describe('AuthController', () => {
  let testUser;
  
  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordHash: hashedPassword,
      role: 'admin'
    };
    
    // Insert test user into database
    const db = testDb();
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
        [testUser.name, testUser.email, testUser.passwordHash, testUser.role, 1],
        function(err) {
          if (err) reject(err);
          else {
            testUser.id = this.lastID;
            resolve();
          }
        }
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.message).toBe('Login realizado com sucesso');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      });
      
      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.error).toBe('Email ou senha incorretos');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Email ou senha incorretos');
    });

    it('should return 401 for inactive user', async () => {
      // Deactivate user
      const db = testDb();
      await new Promise((resolve) => {
        db.run('UPDATE users SET is_active = 0 WHERE id = ?', [testUser.id], resolve);
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(401);

      expect(response.body.error).toBe('Usuário inativo');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password
        })
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newpassword123',
        role: 'funcionario'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.message).toBe('Usuário criado com sucesso');
      expect(response.body.user).toMatchObject({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.created_at).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: testUser.email,
        password: 'password123',
        role: 'funcionario'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.error).toBe('Email já está em uso');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid-email',
        password: 'password123',
        role: 'funcionario'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should return 400 for short password', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid@example.com',
        password: '123',
        role: 'funcionario'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should default to funcionario role if not specified', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser2@example.com',
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.user.role).toBe('funcionario');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(() => {
      authToken = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Token não fornecido');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Token inválido');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let authToken;

    beforeEach(() => {
      authToken = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.message).toBe('Senha alterada com sucesso');

      // Verify old password no longer works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(401);

      // Verify new password works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123'
        })
        .expect(200);
    });

    it('should return 400 for incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.error).toBe('Senha atual incorreta');
    });

    it('should return 400 for missing current password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.error).toBe('Token não fornecido');
    });
  });
});