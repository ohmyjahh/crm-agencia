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

-- Tabela de Serviços/Produtos
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    base_price REAL,
    service_type TEXT DEFAULT 'avulso' CHECK (service_type IN ('recorrente', 'avulso', 'personalizado')),
    estimated_hours INTEGER,
    is_active INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

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
    service_id TEXT REFERENCES services(id), -- Nova referência para serviços
    assigned_to TEXT NOT NULL REFERENCES users(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'cancelada')),
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
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

-- Inserção de dados iniciais para serviços
INSERT OR IGNORE INTO services (id, name, description, category, base_price, service_type, estimated_hours, is_active, created_by, created_at) VALUES
('marketing-digital', 'Marketing Digital', 'Gestão completa de redes sociais e campanhas digitais', 'Marketing', 2500.00, 'recorrente', 40, 1, 'system', datetime('now')),
('desenvolvimento-web', 'Desenvolvimento Web', 'Criação e desenvolvimento de sites e sistemas web', 'Tecnologia', 8500.00, 'personalizado', 120, 1, 'system', datetime('now')),
('consultoria-empresarial', 'Consultoria Empresarial', 'Consultoria estratégica para crescimento empresarial', 'Consultoria', 3500.00, 'avulso', 20, 1, 'system', datetime('now')),
('design-grafico', 'Design Gráfico', 'Criação de identidade visual e materiais gráficos', 'Design', 1800.00, 'avulso', 30, 1, 'system', datetime('now')),
('seo-otimizacao', 'SEO e Otimização', 'Otimização de sites para mecanismos de busca', 'Marketing', 1500.00, 'recorrente', 25, 1, 'system', datetime('now')),
('manutencao-sistemas', 'Manutenção de Sistemas', 'Manutenção e suporte técnico de sistemas', 'Tecnologia', 800.00, 'recorrente', 10, 1, 'system', datetime('now'));

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date);