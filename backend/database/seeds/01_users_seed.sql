-- Seed: Users
-- Description: Dados de teste para usuários do sistema

-- Inserir usuários de teste
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('admin-user-001', 'João Silva', 'joao.admin@crm.com', '$2b$10$example.hash.admin', 'administrador', 1, datetime('now', '-90 days')),
('func-user-002', 'Maria Santos', 'maria.func@crm.com', '$2b$10$example.hash.func1', 'funcionario', 1, datetime('now', '-60 days')),
('func-user-003', 'Carlos Oliveira', 'carlos.func@crm.com', '$2b$10$example.hash.func2', 'funcionario', 1, datetime('now', '-45 days')),
('func-user-004', 'Ana Costa', 'ana.func@crm.com', '$2b$10$example.hash.func3', 'funcionario', 1, datetime('now', '-30 days')),
('func-user-005', 'Pedro Lima', 'pedro.func@crm.com', '$2b$10$example.hash.func4', 'funcionario', 0, datetime('now', '-15 days'));