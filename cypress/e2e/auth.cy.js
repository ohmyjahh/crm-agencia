describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanDatabase();
    cy.seedTestData();
    cy.visit('/login');
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.get('[data-testid="email-input"]').type('admin@test.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Bem-vindo');
    });

    it('should show error for invalid credentials', () => {
      cy.get('[data-testid="email-input"]').type('invalid@test.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();

      cy.get('[data-testid="error-message"]').should('contain', 'Email ou senha incorretos');
      cy.url().should('include', '/login');
    });

    it('should show validation errors for empty fields', () => {
      cy.get('[data-testid="login-button"]').click();

      cy.get('[data-testid="email-error"]').should('contain', 'Email é obrigatório');
      cy.get('[data-testid="password-error"]').should('contain', 'Senha é obrigatória');
    });

    it('should show validation error for invalid email format', () => {
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();

      cy.get('[data-testid="email-error"]').should('contain', 'Email inválido');
    });

    it('should toggle password visibility', () => {
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');

      cy.get('[data-testid="password-toggle"]').click();
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'text');

      cy.get('[data-testid="password-toggle"]').click();
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/dashboard');
    });

    it('should logout successfully', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
      
      // Should clear localStorage
      cy.window().then((window) => {
        expect(window.localStorage.getItem('token')).to.be.null;
        expect(window.localStorage.getItem('user')).to.be.null;
      });
    });
  });

  describe('Authentication Guard', () => {
    it('should redirect to login when accessing protected route without token', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when token is invalid', () => {
      cy.window().then((window) => {
        window.localStorage.setItem('token', 'invalid-token');
      });
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should maintain intended route after login', () => {
      cy.visit('/clients');
      cy.url().should('include', '/login');

      cy.get('[data-testid="email-input"]').type('admin@test.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();

      // Should redirect to originally intended route
      cy.url().should('include', '/clients');
    });
  });

  describe('Session Management', () => {
    it('should handle expired token gracefully', () => {
      // Login first
      cy.login();
      cy.visit('/dashboard');

      // Simulate expired token by setting an old token
      cy.window().then((window) => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTYwMDAwMDAwMH0.invalid';
        window.localStorage.setItem('token', expiredToken);
      });

      // Try to access protected resource
      cy.get('[data-testid="clients-menu"]').click();

      // Should redirect to login due to expired token
      cy.url().should('include', '/login');
      cy.get('[data-testid="error-message"]').should('contain', 'Sessão expirada');
    });

    it('should refresh user data on page reload', () => {
      cy.login();
      cy.visit('/dashboard');

      cy.get('[data-testid="user-name"]').should('contain', 'Admin User');

      cy.reload();

      cy.get('[data-testid="user-name"]').should('contain', 'Admin User');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Remember Me', () => {
    it('should persist login when remember me is checked', () => {
      cy.get('[data-testid="email-input"]').type('admin@test.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="remember-me"]').check();
      cy.get('[data-testid="login-button"]').click();

      cy.url().should('include', '/dashboard');

      // Reload page to simulate browser restart
      cy.reload();

      // Should still be logged in
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should not persist login when remember me is not checked', () => {
      cy.get('[data-testid="email-input"]').type('admin@test.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();

      cy.url().should('include', '/dashboard');

      // Clear session storage to simulate browser close/reopen
      cy.clearLocalStorage();
      cy.reload();

      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});