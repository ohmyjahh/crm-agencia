-- Migration: Add Notifications System
-- Created: 2025-06-22
-- Description: Adds notifications table for real-time notifications system

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'task_created', 'task_updated', 'task_status_changed', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON string with additional data
    is_read INTEGER DEFAULT 0, -- 0 = unread, 1 = read
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TEXT DEFAULT (datetime('now')),
    read_at TEXT -- When the notification was read
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- Create notification preferences table (for future use)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    enabled INTEGER DEFAULT 1, -- 0 = disabled, 1 = enabled
    email_enabled INTEGER DEFAULT 0, -- 0 = disabled, 1 = enabled
    push_enabled INTEGER DEFAULT 1, -- 0 = disabled, 1 = enabled
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, notification_type)
);

-- Add index for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Insert default notification preferences for existing users
INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
SELECT 
    u.id, 
    'task_created',
    1, 0, 1
FROM users u WHERE u.is_active = 1;

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
SELECT 
    u.id, 
    'task_updated',
    1, 0, 1
FROM users u WHERE u.is_active = 1;

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
SELECT 
    u.id, 
    'task_status_changed',
    1, 0, 1
FROM users u WHERE u.is_active = 1;

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
SELECT 
    u.id, 
    'task_comment_added',
    1, 0, 1
FROM users u WHERE u.is_active = 1;

INSERT OR IGNORE INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
SELECT 
    u.id, 
    'task_overdue',
    1, 0, 1
FROM users u WHERE u.is_active = 1;