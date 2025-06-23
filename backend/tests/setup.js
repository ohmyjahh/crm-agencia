const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

// Test database configuration
const TEST_DB_PATH = ':memory:'; // In-memory database for tests

let testDb;

// Setup test database
async function setupTestDatabase() {
  return new Promise((resolve, reject) => {
    testDb = new sqlite3.Database(TEST_DB_PATH, (err) => {
      if (err) {
        console.error('Error creating test database:', err);
        reject(err);
      } else {
        console.log('Test database created successfully');
        resolve(testDb);
      }
    });
  });
}

// Initialize database schema
async function initializeSchema() {
  const schemaPath = path.join(__dirname, '../database/schema-sqlite.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  
  return new Promise((resolve, reject) => {
    testDb.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing schema:', err);
        reject(err);
      } else {
        console.log('Test schema initialized');
        resolve();
      }
    });
  });
}

// Seed test data
async function seedTestData() {
  const insertUser = `
    INSERT INTO users (name, email, password, role) 
    VALUES ('Test User', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
  `;
  
  const insertClient = `
    INSERT INTO clients (name, email, phone, company, status) 
    VALUES ('Test Client', 'client@example.com', '1234567890', 'Test Company', 'active')
  `;

  return new Promise((resolve, reject) => {
    testDb.serialize(() => {
      testDb.run(insertUser);
      testDb.run(insertClient, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Clean database between tests
async function cleanDatabase() {
  const tables = ['users', 'clients', 'tasks', 'task_attachments', 'finances', 'services'];
  
  return new Promise((resolve, reject) => {
    testDb.serialize(() => {
      tables.forEach(table => {
        testDb.run(`DELETE FROM ${table}`);
      });
      resolve();
    });
  });
}

// Close test database
async function closeTestDatabase() {
  if (testDb) {
    return new Promise((resolve) => {
      testDb.close((err) => {
        if (err) {
          console.error('Error closing test database:', err);
        }
        resolve();
      });
    });
  }
}

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
  await initializeSchema();
  await seedTestData();
});

// Clean between tests
beforeEach(async () => {
  await cleanDatabase();
  await seedTestData();
});

// Global test teardown
afterAll(async () => {
  await closeTestDatabase();
});

// Export test utilities
module.exports = {
  testDb: () => testDb,
  setupTestDatabase,
  initializeSchema,
  seedTestData,
  cleanDatabase,
  closeTestDatabase
};