// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global test configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  return false
});

// Custom command to clean database before tests
Cypress.Commands.add('cleanDatabase', () => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/test/clean-database',
    headers: {
      'Content-Type': 'application/json'
    },
    failOnStatusCode: false
  });
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/test/seed-data',
    headers: {
      'Content-Type': 'application/json'
    },
    failOnStatusCode: false
  });
});

// Custom command for login
Cypress.Commands.add('login', (email = 'admin@test.com', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Custom command to visit page with authentication
Cypress.Commands.add('visitWithAuth', (url, options = {}) => {
  cy.login();
  cy.visit(url, options);
});