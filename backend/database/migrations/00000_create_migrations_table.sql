-- Migration: Create Schema Migrations Table
-- Created: 2025-06-22
-- Description: Creates the migrations tracking table for database versioning

CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    name TEXT,
    applied_at TEXT DEFAULT (datetime('now')),
    rollback_sql TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);

-- Insert initial migration record
INSERT OR IGNORE INTO schema_migrations (version, name, applied_at) VALUES 
('00000_create_migrations_table', 'Create Schema Migrations Table', datetime('now'));