const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { testDb } = require('../setup');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';

describe('ClientController', () => {
  let testUser, authToken;
  
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
            testUser = { id: this.lastID, name: 'Test User', email: 'test@example.com', role: 'admin' };
            resolve();
          }
        }
      );
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/clients', () => {
    beforeEach(async () => {
      const db = testDb();
      // Create test clients
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, category, service_format, document_type, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['Test Client 1', 'client1@example.com', '1234567890', 'Company 1', '12345678901', 'active', 'premium', 'presencial', 'cpf', 1, testUser.id],
          resolve
        );
      });
      
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, category, service_format, document_type, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['Test Client 2', 'client2@example.com', '0987654321', 'Company 2', '98765432100', 'inactive', 'standard', 'online', 'cnpj', 1, testUser.id],
          resolve
        );
      });
    });

    it('should return list of clients with authentication', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.pagination).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should filter clients by active status', async () => {
      const response = await request(app)
        .get('/api/clients?active=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(client => client.is_active === 1)).toBe(true);
    });

    it('should filter clients by category', async () => {
      const response = await request(app)
        .get('/api/clients?category=premium')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(client => client.category === 'premium')).toBe(true);
    });

    it('should search clients by name', async () => {
      const response = await request(app)
        .get('/api/clients?search=Test Client 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.some(client => client.name.includes('Test Client 1'))).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/clients?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.pagination.per_page).toBe(1);
      expect(response.body.meta.pagination.current_page).toBe(1);
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        name: 'New Test Client',
        email: 'newclient@example.com',
        phone: '1111111111',
        company: 'New Company',
        document: '11111111111',
        status: 'active',
        category: 'standard',
        service_format: 'online',
        document_type: 'cpf',
        address: 'Test Address',
        notes: 'Test notes'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(clientData.name);
      expect(response.body.data.email).toBe(clientData.email);
      expect(response.body.data.phone).toBe(clientData.phone);
      expect(response.body.data.company).toBe(clientData.company);
      expect(response.body.data.document).toBe(clientData.document);
      expect(response.body.data.status).toBe(clientData.status);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newclient@example.com'
          // Missing name
        })
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should return 400 for invalid email format', async () => {
      const clientData = {
        name: 'New Test Client',
        email: 'invalid-email',
        phone: '1111111111',
        company: 'New Company',
        document: '11111111111'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should return 400 for duplicate email', async () => {
      const db = testDb();
      // Create existing client
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Existing Client', 'existing@example.com', '1234567890', 'Company', '12345678901', 'active', 1, testUser.id],
          resolve
        );
      });

      const clientData = {
        name: 'New Test Client',
        email: 'existing@example.com', // Duplicate email
        phone: '1111111111',
        company: 'New Company',
        document: '99999999999'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body.error).toBe('Email já está em uso');
    });

    it('should return 400 for duplicate document', async () => {
      const db = testDb();
      // Create existing client
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Existing Client', 'existing@example.com', '1234567890', 'Company', '12345678901', 'active', 1, testUser.id],
          resolve
        );
      });

      const clientData = {
        name: 'New Test Client',
        email: 'newclient@example.com',
        phone: '1111111111',
        company: 'New Company',
        document: '12345678901' // Duplicate document
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body.error).toBe('Documento já está em uso');
    });
  });

  describe('GET /api/clients/:id', () => {
    let testClientId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Test Client', 'client@example.com', '1234567890', 'Test Company', '12345678901', 'active', 1, testUser.id],
          function(err) {
            if (err) reject(err);
            else {
              testClientId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should return client by ID', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testClientId);
      expect(response.body.data.name).toBe('Test Client');
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cliente não encontrado');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/clients/:id', () => {
    let testClientId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Test Client', 'client@example.com', '1234567890', 'Test Company', '12345678901', 'active', 1, testUser.id],
          function(err) {
            if (err) reject(err);
            else {
              testClientId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should update client with valid data', async () => {
      const updateData = {
        name: 'Updated Client Name',
        email: 'updated@example.com',
        phone: '9999999999',
        company: 'Updated Company',
        document: '99999999999',
        status: 'inactive',
        category: 'premium',
        service_format: 'presencial',
        document_type: 'cnpj'
      };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.company).toBe(updateData.company);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent client', async () => {
      const updateData = {
        name: 'Updated Client Name',
        email: 'updated@example.com',
        phone: '9999999999',
        company: 'Updated Company',
        document: '99999999999'
      };

      const response = await request(app)
        .put('/api/clients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cliente não encontrado');
    });

    it('should return 400 for invalid email format', async () => {
      const updateData = {
        name: 'Updated Client Name',
        email: 'invalid-email',
        phone: '9999999999',
        company: 'Updated Company',
        document: '99999999999'
      };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    let testClientId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Test Client', 'client@example.com', '1234567890', 'Test Company', '12345678901', 'active', 1, testUser.id],
          function(err) {
            if (err) reject(err);
            else {
              testClientId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should soft delete client (set is_active to false)', async () => {
      const response = await request(app)
        .delete(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cliente removido com sucesso');

      // Verify client was soft deleted
      const getResponse = await request(app)
        .get(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.is_active).toBe(0);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .delete('/api/clients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cliente não encontrado');
    });
  });

  describe('GET /api/clients/stats', () => {
    beforeEach(async () => {
      const db = testDb();
      // Create clients with different statuses and categories
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, category, service_format, document_type, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['Client 1', 'client1@example.com', '1234567890', 'Company 1', '11111111111', 'active', 'premium', 'presencial', 'cpf', 1, testUser.id],
          resolve
        );
      });
      
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, category, service_format, document_type, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['Client 2', 'client2@example.com', '2222222222', 'Company 2', '22222222222', 'inactive', 'standard', 'online', 'cnpj', 1, testUser.id],
          resolve
        );
      });
      
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO clients (name, email, phone, company, document, status, category, service_format, document_type, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['Client 3', 'client3@example.com', '3333333333', 'Company 3', '33333333333', 'pending', 'premium', 'hibrido', 'cpf', 1, testUser.id],
          resolve
        );
      });
    });

    it('should return client statistics', async () => {
      const response = await request(app)
        .get('/api/clients/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeInstanceOf(Array);
      expect(response.body.data.category).toBeInstanceOf(Array);
      expect(response.body.data.service_format).toBeInstanceOf(Array);
      expect(response.body.data.document_type).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.active).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/clients/stats')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});