// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Command to get element by data-testid
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Command to get element by data-cy
Cypress.Commands.add('getByCy', (selector) => {
  return cy.get(`[data-cy="${selector}"]`);
});

// Command to wait for API call
Cypress.Commands.add('waitForApi', (alias, options = {}) => {
  return cy.wait(alias, { timeout: 15000, ...options });
});

// Command to create test client
Cypress.Commands.add('createTestClient', (clientData = {}) => {
  const defaultClient = {
    name: 'Test Client',
    email: 'testclient@example.com',
    phone: '1234567890',
    company: 'Test Company',
    document: '12345678901',
    status: 'active',
    category: 'standard',
    service_format: 'online',
    document_type: 'cpf'
  };

  return cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/clients',
    body: { ...defaultClient, ...clientData },
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body.data;
  });
});

// Command to create test task
Cypress.Commands.add('createTestTask', (taskData = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'Test task description',
    priority: 'media',
    status: 'novo'
  };

  return cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/tasks',
    body: { ...defaultTask, ...taskData },
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body.data;
  });
});

// Command to fill form with data
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(field => {
    if (formData[field] !== null && formData[field] !== undefined) {
      cy.get(`[name="${field}"]`).clear().type(formData[field]);
    }
  });
});

// Command to select dropdown option
Cypress.Commands.add('selectDropdown', (selector, value) => {
  cy.get(selector).click();
  cy.get(`[data-value="${value}"]`).click();
});

// Command to wait for loading to finish
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
});

// Command to check toast message
Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`).should('contain', message);
});

// Command to close modal
Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close"]').click();
  cy.get('[data-testid="modal"]').should('not.exist');
});

// Command to confirm dialog
Cypress.Commands.add('confirmDialog', () => {
  cy.get('[data-testid="confirm-dialog-yes"]').click();
});

// Command to cancel dialog
Cypress.Commands.add('cancelDialog', () => {
  cy.get('[data-testid="confirm-dialog-no"]').click();
});