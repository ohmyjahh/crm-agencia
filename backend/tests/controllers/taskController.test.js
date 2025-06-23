const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { testDb } = require('../setup');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';

describe('TaskController', () => {
  let testUser, testClient, authToken;
  
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

    // Create test client
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO clients (name, email, phone, company, status, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test Client', 'client@example.com', '1234567890', 'Test Company', 'active', 1],
        function(err) {
          if (err) reject(err);
          else {
            testClient = { id: this.lastID };
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

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      const db = testDb();
      // Create test tasks
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO tasks (title, description, client_id, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['Test Task 1', 'Description 1', testClient.id, testUser.id, testUser.id, 'alta', 'novo'],
          resolve
        );
      });
      
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO tasks (title, description, client_id, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['Test Task 2', 'Description 2', testClient.id, testUser.id, testUser.id, 'media', 'em_progresso'],
          resolve
        );
      });
    });

    it('should return list of tasks with authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.pagination).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=novo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(task => task.status === 'novo')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=alta')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(task => task.priority === 'alta')).toBe(true);
    });

    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Test Task 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.some(task => task.title.includes('Test Task 1'))).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.pagination.per_page).toBe(1);
      expect(response.body.meta.pagination.current_page).toBe(1);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'Test task description',
        client_id: testClient.id,
        assigned_to: testUser.id,
        priority: 'alta',
        due_date: '2024-12-31'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.client_id).toBe(taskData.client_id);
      expect(response.body.data.assigned_to).toBe(taskData.assigned_to);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.status).toBe('novo'); // Default status
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing title'
        })
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });

    it('should return 400 for invalid client_id', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'Test task description',
        client_id: 99999,
        assigned_to: testUser.id,
        priority: 'alta'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Cliente não encontrado');
    });

    it('should return 400 for invalid assigned_to user', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'Test task description',
        client_id: testClient.id,
        assigned_to: 99999,
        priority: 'alta'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.message).toBe('Usuário atribuído não encontrado');
    });

    it('should default to media priority if not specified', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'Test task description',
        client_id: testClient.id,
        assigned_to: testUser.id
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.data.priority).toBe('media');
    });
  });

  describe('GET /api/tasks/:id', () => {
    let testTaskId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tasks (title, description, client_id, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['Test Task', 'Description', testClient.id, testUser.id, testUser.id, 'alta', 'novo'],
          function(err) {
            if (err) reject(err);
            else {
              testTaskId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should return task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testTaskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tarefa não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTaskId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tasks (title, description, client_id, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['Test Task', 'Original Description', testClient.id, testUser.id, testUser.id, 'media', 'novo'],
          function(err) {
            if (err) reject(err);
            else {
              testTaskId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        client_id: testClient.id,
        assigned_to: testUser.id,
        priority: 'alta',
        status: 'em_progresso',
        due_date: '2024-12-31'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        client_id: testClient.id,
        assigned_to: testUser.id,
        priority: 'alta',
        status: 'em_progresso'
      };

      const response = await request(app)
        .put('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tarefa não encontrada');
    });

    it('should set completed_at when status changes to concluido', async () => {
      const updateData = {
        title: 'Test Task',
        description: 'Original Description',
        client_id: testClient.id,
        assigned_to: testUser.id,
        priority: 'media',
        status: 'concluido'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('concluido');
      expect(response.body.data.completed_at).toBeDefined();
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTaskId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tasks (title, description, client_id, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['Test Task', 'Description', testClient.id, testUser.id, testUser.id, 'media', 'novo'],
          function(err) {
            if (err) reject(err);
            else {
              testTaskId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tarefa deletada com sucesso');

      // Verify task was deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tarefa não encontrada');
    });
  });

  describe('PUT /api/tasks/:id/status', () => {
    let testTaskId;

    beforeEach(async () => {
      const db = testDb();
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tasks (title, description, client_id, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['Test Task', 'Description', testClient.id, testUser.id, testUser.id, 'media', 'novo'],
          function(err) {
            if (err) reject(err);
            else {
              testTaskId = this.lastID;
              resolve();
            }
          }
        );
      });
    });

    it('should update task status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTaskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'em_progresso' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('em_progresso');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTaskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Status inválido');
    });

    it('should set completed_at when status changes to concluido', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTaskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'concluido' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('concluido');
      expect(response.body.data.completed_at).toBeDefined();
    });
  });

  describe('GET /api/tasks/stats', () => {
    beforeEach(async () => {
      const db = testDb();
      // Create tasks with different statuses and priorities
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO tasks (title, description, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
          ['Task 1', 'Description', testUser.id, testUser.id, 'alta', 'novo'],
          resolve
        );
      });
      
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO tasks (title, description, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
          ['Task 2', 'Description', testUser.id, testUser.id, 'media', 'em_progresso'],
          resolve
        );
      });
      
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO tasks (title, description, assigned_to, created_by, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
          ['Task 3', 'Description', testUser.id, testUser.id, 'baixa', 'concluido'],
          resolve
        );
      });
    });

    it('should return task statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeInstanceOf(Array);
      expect(response.body.data.priority).toBeInstanceOf(Array);
      expect(response.body.data.overdue).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/tasks/users', () => {
    it('should return list of active users', async () => {
      const response = await request(app)
        .get('/api/tasks/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('role');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks/users')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});