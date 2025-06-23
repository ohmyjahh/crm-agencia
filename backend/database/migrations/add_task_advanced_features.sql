-- Migration: Add Advanced Task Features
-- Created: 2025-06-21
-- Description: Adds comments, history, and attachments tables for tasks, and updates status options

-- First, let's check if new tables exist
-- Note: SQLite doesn't support ALTER TABLE for CHECK constraints, so we need to be careful

-- Create new tables
CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0, -- 0 = público, 1 = interno (apenas equipe)
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_action ON task_history(action);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- For SQLite: Update existing tasks that have old status values
-- This is a data migration to handle existing records
UPDATE tasks SET status = 'novo' WHERE status = 'pendente';
UPDATE tasks SET status = 'concluido' WHERE status = 'concluida';
UPDATE tasks SET status = 'cancelado' WHERE status = 'cancelada';

-- Create triggers for automatic updated_at management
CREATE TRIGGER IF NOT EXISTS update_task_comments_timestamp 
AFTER UPDATE ON task_comments
FOR EACH ROW
BEGIN
  UPDATE task_comments SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Create triggers for task history tracking
CREATE TRIGGER IF NOT EXISTS track_task_status_changes
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN OLD.status != NEW.status
BEGIN
  INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
  VALUES (
    NEW.id,
    NEW.assigned_to, -- Assumindo que quem está atribuído pode alterar status
    'status_changed',
    'status',
    OLD.status,
    NEW.status,
    'Status alterado de ' || OLD.status || ' para ' || NEW.status
  );
END;

CREATE TRIGGER IF NOT EXISTS track_task_assignment_changes
AFTER UPDATE OF assigned_to ON tasks
FOR EACH ROW
WHEN OLD.assigned_to != NEW.assigned_to
BEGIN
  INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
  VALUES (
    NEW.id,
    NEW.assigned_to,
    'assigned',
    'assigned_to',
    OLD.assigned_to,
    NEW.assigned_to,
    'Tarefa reatribuída'
  );
END;

CREATE TRIGGER IF NOT EXISTS track_task_creation
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
  INSERT INTO task_history (task_id, user_id, action, description)
  VALUES (
    NEW.id,
    NEW.created_by,
    'created',
    'Tarefa criada'
  );
END;

-- Create additional composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status_assigned ON tasks(status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- Validate data integrity
UPDATE tasks SET updated_at = datetime('now') WHERE updated_at IS NULL;

-- Create view for task dashboard metrics
CREATE VIEW IF NOT EXISTS task_metrics_view AS
SELECT 
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'novo' THEN 1 END) as new_tasks,
  COUNT(CASE WHEN status = 'em_progresso' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN status = 'aguardando_validacao' THEN 1 END) as pending_validation_tasks,
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelled_tasks,
  COUNT(CASE WHEN due_date < date('now') AND status NOT IN ('concluido', 'cancelado') THEN 1 END) as overdue_tasks,
  COUNT(CASE WHEN priority = 'urgente' AND status NOT IN ('concluido', 'cancelado') THEN 1 END) as urgent_tasks
FROM tasks;

-- Migration completed successfully
INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES ('20250622_001_task_advanced_features', datetime('now'));