-- Migration: Add Strategic Indexes
-- Created: 2025-06-22
-- Description: Adds strategic indexes for performance optimization

-- Cliente indexes para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);
CREATE INDEX IF NOT EXISTS idx_clients_service_format ON clients(service_format);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- Índices compostos para clientes
CREATE INDEX IF NOT EXISTS idx_clients_active_category ON clients(is_active, category);
CREATE INDEX IF NOT EXISTS idx_clients_category_service_format ON clients(category, service_format);
CREATE INDEX IF NOT EXISTS idx_clients_created_at_active ON clients(created_at, is_active);

-- Task indexes adicionais para dashboard e relatórios
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Índices compostos para tasks (consultas mais complexas)
CREATE INDEX IF NOT EXISTS idx_tasks_client_priority ON tasks(client_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_priority ON tasks(assigned_to, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_priority ON tasks(due_date, priority);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_created_by ON services(created_by);
CREATE INDEX IF NOT EXISTS idx_services_base_price ON services(base_price);

-- Índices compostos para services
CREATE INDEX IF NOT EXISTS idx_services_active_type ON services(is_active, service_type);
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services(category, is_active);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Índices compostos para projects
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects(client_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status_start_date ON projects(status, start_date);

-- Finance indexes para relatórios DRE
CREATE INDEX IF NOT EXISTS idx_finance_transactions_client_id ON finance_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_project_id ON finance_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category_id ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_by ON finance_transactions(created_by);

-- Índices compostos para finanças (consultas de dashboard)
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type_date ON finance_transactions(type, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date_type ON finance_transactions(transaction_date, type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_client_type ON finance_transactions(client_id, type);

-- Client relationships indexes
CREATE INDEX IF NOT EXISTS idx_client_purchases_client_id ON client_purchases(client_id);
CREATE INDEX IF NOT EXISTS idx_client_purchases_service_id ON client_purchases(service_id);
CREATE INDEX IF NOT EXISTS idx_client_purchases_purchase_date ON client_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_client_purchases_status ON client_purchases(status);

-- Índices compostos para client_purchases
CREATE INDEX IF NOT EXISTS idx_client_purchases_client_status ON client_purchases(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_purchases_date_status ON client_purchases(purchase_date, status);

-- Client services indexes
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_id ON client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_client_services_status ON client_services(status);
CREATE INDEX IF NOT EXISTS idx_client_services_contract_date ON client_services(contract_date);
CREATE INDEX IF NOT EXISTS idx_client_services_end_date ON client_services(end_date);

-- Índices compostos para client_services
CREATE INDEX IF NOT EXISTS idx_client_services_client_status ON client_services(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_services_service_status ON client_services(service_id, status);

-- DRE uploads indexes
CREATE INDEX IF NOT EXISTS idx_dre_uploads_month_year ON dre_uploads(month, year);
CREATE INDEX IF NOT EXISTS idx_dre_uploads_status ON dre_uploads(status);
CREATE INDEX IF NOT EXISTS idx_dre_uploads_uploaded_by ON dre_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_dre_uploads_uploaded_at ON dre_uploads(uploaded_at);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Índices compostos para users
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(is_active, role);

-- Payment methods e finance categories
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_finance_categories_type ON finance_categories(type);
CREATE INDEX IF NOT EXISTS idx_finance_categories_is_active ON finance_categories(is_active);

-- Register migration
INSERT OR IGNORE INTO schema_migrations (version, name) VALUES ('20250622_002_add_strategic_indexes', 'Add Strategic Indexes');