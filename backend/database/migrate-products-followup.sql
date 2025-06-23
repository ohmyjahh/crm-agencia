-- Migration para adicionar módulos Produtos e Follow-up
-- Renomear services para products (mantendo compatibilidade)

-- Criar tabela products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT, -- Armazenado como string separada por vírgulas
    average_ticket REAL DEFAULT 0,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Migrar dados existentes de services para products (se existir)
INSERT OR IGNORE INTO products (id, name, description, category, average_ticket, status, created_by, created_at, updated_at)
SELECT id, name, description, category, base_price, 
       CASE WHEN is_active = 1 THEN 'ativo' ELSE 'inativo' END,
       created_by, created_at, updated_at
FROM services WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='services');

-- Adicionar campo product_id na tabela tasks
ALTER TABLE tasks ADD COLUMN product_id TEXT REFERENCES products(id);

-- SISTEMA DE FOLLOW-UP

-- Tabela de Cadências de Follow-up
CREATE TABLE IF NOT EXISTS followup_sequences (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Passos da Cadência
CREATE TABLE IF NOT EXISTS followup_steps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sequence_id TEXT NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL, -- Ordem do passo (1, 2, 3...)
    day_offset INTEGER NOT NULL, -- Dias após início da cadência
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('ligacao', 'email', 'whatsapp', 'reuniao', 'outro')),
    title TEXT NOT NULL,
    notes TEXT, -- Roteiro/observações para o follow-up
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sequence_id, step_order),
    UNIQUE(sequence_id, day_offset)
);

-- Tabela de Atribuições de Cadência a Clientes
CREATE TABLE IF NOT EXISTS client_followup_assignments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    sequence_id TEXT NOT NULL REFERENCES followup_sequences(id),
    assigned_by TEXT NOT NULL REFERENCES users(id),
    responsible_user TEXT NOT NULL REFERENCES users(id), -- Quem será responsável pelos follow-ups
    start_date TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(client_id) -- Um cliente só pode ter uma cadência ativa por vez
);

-- Tabela de Follow-ups Individuais
CREATE TABLE IF NOT EXISTS followups (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    assignment_id TEXT NOT NULL REFERENCES client_followup_assignments(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL REFERENCES followup_steps(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    responsible_user TEXT NOT NULL REFERENCES users(id),
    scheduled_date TEXT NOT NULL,
    interaction_type TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'overdue')),
    completed_at TEXT,
    completion_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Inserção de dados iniciais para produtos
INSERT OR IGNORE INTO products (id, name, description, category, tags, average_ticket, status, created_by, created_at) VALUES
('marketing-digital', 'Marketing Digital', 'Gestão completa de redes sociais e campanhas digitais', 'Marketing', 'redes sociais,campanhas,digital', 2500.00, 'ativo', 'admin-id-123', datetime('now')),
('desenvolvimento-web', 'Desenvolvimento Web', 'Criação e desenvolvimento de sites e sistemas web', 'Tecnologia', 'websites,sistemas,desenvolvimento', 8500.00, 'ativo', 'admin-id-123', datetime('now')),
('consultoria-empresarial', 'Consultoria Empresarial', 'Consultoria estratégica para crescimento empresarial', 'Consultoria', 'estratégia,crescimento,consultoria', 3500.00, 'ativo', 'admin-id-123', datetime('now')),
('design-grafico', 'Design Gráfico', 'Criação de identidade visual e materiais gráficos', 'Design', 'identidade visual,gráfico,criação', 1800.00, 'ativo', 'admin-id-123', datetime('now')),
('seo-otimizacao', 'SEO e Otimização', 'Otimização de sites para mecanismos de busca', 'Marketing', 'seo,otimização,busca', 1500.00, 'ativo', 'admin-id-123', datetime('now')),
('manutencao-sistemas', 'Manutenção de Sistemas', 'Manutenção e suporte técnico de sistemas', 'Tecnologia', 'manutenção,suporte,sistemas', 800.00, 'ativo', 'admin-id-123', datetime('now'));

-- Inserção de cadências de exemplo
INSERT OR IGNORE INTO followup_sequences (id, name, description, created_by, created_at) VALUES
('seq-prospect-inicial', 'Cadência Prospect Inicial', 'Cadência padrão para novos prospects', 'admin-id-123', datetime('now')),
('seq-pos-reuniao', 'Pós-Reunião', 'Follow-up após primeira reunião comercial', 'admin-id-123', datetime('now'));

-- Passos da cadência inicial
INSERT OR IGNORE INTO followup_steps (sequence_id, step_order, day_offset, interaction_type, title, notes, created_at) VALUES
('seq-prospect-inicial', 1, 0, 'ligacao', 'Primeira ligação', 'Apresentar a empresa e verificar interesse', datetime('now')),
('seq-prospect-inicial', 2, 3, 'email', 'Email com materiais', 'Enviar portfólio e casos de sucesso', datetime('now')),
('seq-prospect-inicial', 3, 7, 'whatsapp', 'Follow-up WhatsApp', 'Mensagem perguntando se recebeu os materiais', datetime('now')),
('seq-prospect-inicial', 4, 14, 'ligacao', 'Segunda ligação', 'Propor reunião para apresentação detalhada', datetime('now'));

-- Passos da cadência pós-reunião
INSERT OR IGNORE INTO followup_steps (sequence_id, step_order, day_offset, interaction_type, title, notes, created_at) VALUES
('seq-pos-reuniao', 1, 1, 'email', 'Email pós-reunião', 'Agradecer reunião e enviar proposta', datetime('now')),
('seq-pos-reuniao', 2, 5, 'ligacao', 'Follow-up proposta', 'Ligar para tirar dúvidas sobre a proposta', datetime('now')),
('seq-pos-reuniao', 3, 10, 'whatsapp', 'Lembrete WhatsApp', 'Lembrar da proposta enviada', datetime('now')),
('seq-pos-reuniao', 4, 15, 'ligacao', 'Última tentativa', 'Última tentativa antes de considerar perdido', datetime('now'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_followup_sequences_active ON followup_sequences(is_active);
CREATE INDEX IF NOT EXISTS idx_followup_steps_sequence ON followup_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_client_followup_assignments_client ON client_followup_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_followup_assignments_status ON client_followup_assignments(status);
CREATE INDEX IF NOT EXISTS idx_followups_responsible ON followups(responsible_user, status);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON followups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_product_id ON tasks(product_id);