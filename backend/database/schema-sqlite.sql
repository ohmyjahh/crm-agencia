-- CRM Database Schema - SQLite Version
-- Versão simplificada para demonstração

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'funcionario' CHECK (role IN ('administrador', 'funcionario')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document TEXT,
    document_type TEXT CHECK (document_type IN ('CPF', 'CNPJ')),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    notes TEXT,
    -- Novos campos para categorização e relacionamento
    category TEXT DEFAULT 'bronze' CHECK (category IN ('bronze', 'prata', 'ouro')),
    service_format TEXT DEFAULT 'avulso' CHECK (service_format IN ('recorrente', 'avulso', 'personalizado')),
    average_ticket REAL DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    first_purchase_date TEXT,
    last_purchase_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Serviços/Produtos (renomeada para products)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT, -- Armazenado como JSON ou string separada por vírgulas
    average_ticket REAL DEFAULT 0,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Manter compatibilidade com services (view) - será criada depois dos dados

-- Tabela de Histórico de Compras dos Clientes
CREATE TABLE IF NOT EXISTS client_purchases (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id),
    purchase_number INTEGER NOT NULL, -- 1ª, 2ª, 3ª compra, etc.
    amount REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
    payment_method TEXT,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(client_id, purchase_number)
);

-- Tabela de Serviços Contratados pelos Clientes (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS client_services (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    contract_date TEXT NOT NULL,
    end_date TEXT,
    monthly_value REAL,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'concluido')),
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(client_id, service_id, contract_date)
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'pausado', 'cancelado')),
    start_date TEXT,
    end_date TEXT,
    budget REAL,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT,
    client_id TEXT REFERENCES clients(id),
    project_id TEXT REFERENCES projects(id),
    product_id TEXT REFERENCES products(id), -- Referência para produtos
    assigned_to TEXT NOT NULL REFERENCES users(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
    status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_progresso', 'aguardando_validacao', 'concluido', 'cancelado')),
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Comentários de Tarefas
CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0, -- 0 = público, 1 = interno (apenas equipe)
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Histórico de Tarefas
CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'commented'
    field_name TEXT, -- nome do campo alterado
    old_value TEXT, -- valor anterior
    new_value TEXT, -- novo valor
    description TEXT, -- descrição da alteração
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Anexos de Tarefas
CREATE TABLE IF NOT EXISTS task_attachments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Categorias Financeiras
CREATE TABLE IF NOT EXISTS finance_categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Formas de Pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS finance_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT REFERENCES finance_categories(id),
    client_id TEXT REFERENCES clients(id),
    project_id TEXT REFERENCES projects(id),
    transaction_date TEXT NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabela de Uploads para DRE com IA
CREATE TABLE IF NOT EXISTS dre_uploads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
    ai_result TEXT, -- JSON com resultado da IA
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    uploaded_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT
);

-- Inserção de dados iniciais para métodos de pagamento
INSERT OR IGNORE INTO payment_methods (id, name, description, is_active, created_by, created_at) VALUES
('credito', 'Crédito', 'Pagamento com cartão de crédito', 1, 'system', datetime('now')),
('debito', 'Débito', 'Pagamento com cartão de débito', 1, 'system', datetime('now')),
('pix', 'PIX', 'Transferência via PIX', 1, 'system', datetime('now')),
('transferencia', 'Transferência', 'Transferência bancária', 1, 'system', datetime('now'));

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

-- Dados iniciais serão inseridos pelo script de setup

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_action ON task_history(action);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_followup_sequences_active ON followup_sequences(is_active);
CREATE INDEX IF NOT EXISTS idx_followup_steps_sequence ON followup_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_client_followup_assignments_client ON client_followup_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_followup_assignments_status ON client_followup_assignments(status);
CREATE INDEX IF NOT EXISTS idx_followups_responsible ON followups(responsible_user, status);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON followups(scheduled_date);