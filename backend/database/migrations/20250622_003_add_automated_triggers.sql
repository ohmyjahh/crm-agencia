-- Migration: Add Automated Triggers
-- Created: 2025-06-22
-- Description: Adds triggers for automatic updated_at and audit trail

-- Triggers para updated_at automático em todas as tabelas principais

-- Users table
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Clients table
CREATE TRIGGER IF NOT EXISTS update_clients_timestamp 
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Services table
CREATE TRIGGER IF NOT EXISTS update_services_timestamp 
AFTER UPDATE ON services
FOR EACH ROW
BEGIN
  UPDATE services SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Projects table
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Tasks table
CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Finance transactions table
CREATE TRIGGER IF NOT EXISTS update_finance_transactions_timestamp 
AFTER UPDATE ON finance_transactions
FOR EACH ROW
BEGIN
  UPDATE finance_transactions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Triggers para atualização automática de métricas de clientes

-- Trigger para atualizar total_purchases quando uma compra é adicionada
CREATE TRIGGER IF NOT EXISTS update_client_purchase_count_insert
AFTER INSERT ON client_purchases
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    total_purchases = total_purchases + 1,
    last_purchase_date = NEW.purchase_date,
    first_purchase_date = CASE 
      WHEN first_purchase_date IS NULL THEN NEW.purchase_date
      ELSE first_purchase_date
    END,
    updated_at = datetime('now')
  WHERE id = NEW.client_id;
END;

-- Trigger para atualizar total_purchases quando uma compra é removida
CREATE TRIGGER IF NOT EXISTS update_client_purchase_count_delete
AFTER DELETE ON client_purchases
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    total_purchases = total_purchases - 1,
    updated_at = datetime('now')
  WHERE id = OLD.client_id;
  
  -- Recalcular first_purchase_date e last_purchase_date
  UPDATE clients 
  SET 
    first_purchase_date = (
      SELECT MIN(purchase_date) 
      FROM client_purchases 
      WHERE client_id = OLD.client_id
    ),
    last_purchase_date = (
      SELECT MAX(purchase_date) 
      FROM client_purchases 
      WHERE client_id = OLD.client_id
    )
  WHERE id = OLD.client_id;
END;

-- Trigger para recalcular average_ticket quando uma compra é modificada
CREATE TRIGGER IF NOT EXISTS update_client_average_ticket
AFTER INSERT ON client_purchases
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    average_ticket = (
      SELECT AVG(amount) 
      FROM client_purchases 
      WHERE client_id = NEW.client_id AND status = 'ativo'
    ),
    updated_at = datetime('now')
  WHERE id = NEW.client_id;
END;

-- Trigger para recalcular average_ticket quando uma compra é atualizada
CREATE TRIGGER IF NOT EXISTS update_client_average_ticket_update
AFTER UPDATE ON client_purchases
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    average_ticket = (
      SELECT AVG(amount) 
      FROM client_purchases 
      WHERE client_id = NEW.client_id AND status = 'ativo'
    ),
    updated_at = datetime('now')
  WHERE id = NEW.client_id;
END;

-- Trigger para atualizar completed_at quando task status muda para concluido
CREATE TRIGGER IF NOT EXISTS update_task_completed_at
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN NEW.status = 'concluido' AND OLD.status != 'concluido'
BEGIN
  UPDATE tasks 
  SET completed_at = datetime('now') 
  WHERE id = NEW.id;
END;

-- Trigger para limpar completed_at quando task sai do status concluido
CREATE TRIGGER IF NOT EXISTS clear_task_completed_at
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN OLD.status = 'concluido' AND NEW.status != 'concluido'
BEGIN
  UPDATE tasks 
  SET completed_at = NULL 
  WHERE id = NEW.id;
END;

-- Triggers para auditoria de mudanças críticas em clientes
CREATE TRIGGER IF NOT EXISTS audit_client_category_changes
AFTER UPDATE OF category ON clients
FOR EACH ROW
WHEN OLD.category != NEW.category
BEGIN
  INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
  VALUES (
    NULL, -- não é relacionado a uma task específica
    'system',
    'client_category_changed',
    'category',
    OLD.category,
    NEW.category,
    'Categoria do cliente ' || NEW.name || ' alterada de ' || OLD.category || ' para ' || NEW.category
  );
END;

-- Trigger para auditoria de mudanças de status em projects
CREATE TRIGGER IF NOT EXISTS audit_project_status_changes
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN OLD.status != NEW.status
BEGIN
  INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
  VALUES (
    NULL,
    'system',
    'project_status_changed',
    'status',
    OLD.status,
    NEW.status,
    'Status do projeto ' || NEW.name || ' alterado de ' || OLD.status || ' para ' || NEW.status
  );
END;

-- Trigger para soft delete - marcar como inativo em vez de deletar
CREATE TRIGGER IF NOT EXISTS soft_delete_clients
BEFORE DELETE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    is_active = 0,
    updated_at = datetime('now')
  WHERE id = OLD.id;
  
  -- Impedir a exclusão física
  SELECT RAISE(IGNORE);
END;

-- Trigger para soft delete de services
CREATE TRIGGER IF NOT EXISTS soft_delete_services
BEFORE DELETE ON services
FOR EACH ROW
BEGIN
  UPDATE services 
  SET 
    is_active = 0,
    updated_at = datetime('now')
  WHERE id = OLD.id;
  
  SELECT RAISE(IGNORE);
END;

-- Trigger para soft delete de users
CREATE TRIGGER IF NOT EXISTS soft_delete_users
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
  UPDATE users 
  SET 
    is_active = 0,
    updated_at = datetime('now')
  WHERE id = OLD.id;
  
  SELECT RAISE(IGNORE);
END;

-- Trigger para validação de dados críticos
CREATE TRIGGER IF NOT EXISTS validate_client_data
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
  -- Validar email se fornecido
  SELECT CASE 
    WHEN NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email NOT LIKE '%@%' THEN
      RAISE(ABORT, 'Email inválido')
  END;
  
  -- Validar documento se fornecido
  SELECT CASE 
    WHEN NEW.document IS NOT NULL AND NEW.document != '' AND LENGTH(NEW.document) < 11 THEN
      RAISE(ABORT, 'Documento deve ter pelo menos 11 caracteres')
  END;
END;

-- Trigger para normalização de dados
CREATE TRIGGER IF NOT EXISTS normalize_client_data
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    email = LOWER(TRIM(NEW.email)),
    name = TRIM(NEW.name),
    phone = REPLACE(REPLACE(REPLACE(REPLACE(NEW.phone, '(', ''), ')', ''), '-', ''), ' ', '')
  WHERE ROWID = NEW.ROWID;
END;

CREATE TRIGGER IF NOT EXISTS normalize_client_data_update
BEFORE UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients 
  SET 
    email = CASE WHEN NEW.email IS NOT NULL THEN LOWER(TRIM(NEW.email)) ELSE NEW.email END,
    name = TRIM(NEW.name),
    phone = CASE WHEN NEW.phone IS NOT NULL THEN REPLACE(REPLACE(REPLACE(REPLACE(NEW.phone, '(', ''), ')', ''), '-', ''), ' ', '') ELSE NEW.phone END
  WHERE ROWID = NEW.ROWID;
END;

-- Register migration
INSERT OR IGNORE INTO schema_migrations (version, name) VALUES ('20250622_003_add_automated_triggers', 'Add Automated Triggers');