/**
 * WebSocket Notification System for CRM
 * Real-time notifications for task updates, comments, and system events
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logSecurityEvent } = require('../middleware/logger');

// Store active connections by user ID
const userConnections = new Map();

// Store connection metadata
const connectionMetadata = new Map();

/**
 * Initialize WebSocket server
 */
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    verifyClient: async (info) => {
      try {
        // Extract token from query parameters or headers
        const url = new URL(info.req.url, 'http://localhost');
        const token = url.searchParams.get('token') || 
                     info.req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return false;
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists and is active
        const result = await pool.query(
          'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
          [decoded.userId]
        );
        
        if (result.rows.length === 0 || !result.rows[0].is_active) {
          return false;
        }
        
        // Store user info for connection
        info.req.user = result.rows[0];
        return true;
        
      } catch (error) {
        console.error('WebSocket verification error:', error);
        return false;
      }
    }
  });

  wss.on('connection', (ws, req) => {
    const user = req.user;
    const connectionId = generateConnectionId();
    
    // Store connection
    if (!userConnections.has(user.id)) {
      userConnections.set(user.id, new Set());
    }
    userConnections.get(user.id).add(ws);
    
    // Store connection metadata
    connectionMetadata.set(ws, {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      connectionId,
      connectedAt: new Date(),
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`WebSocket connected: ${user.name} (${user.id})`);
    
    // Send welcome message
    sendToUser(user.id, {
      type: 'connection_established',
      message: 'Conectado ao sistema de notificações',
      timestamp: new Date().toISOString(),
      connectionId
    });
    
    // Send pending notifications count
    sendPendingNotificationsCount(user.id);
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleClientMessage(ws, user, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Formato de mensagem inválido',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      const connections = userConnections.get(user.id);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          userConnections.delete(user.id);
        }
      }
      connectionMetadata.delete(ws);
      console.log(`WebSocket disconnected: ${user.name} (${user.id})`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      logSecurityEvent('websocket_error', req, { error: error.message });
    });
    
    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);
  });
  
  return wss;
};

/**
 * Generate unique connection ID
 */
const generateConnectionId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Handle messages from client
 */
const handleClientMessage = async (ws, user, data) => {
  const { type, payload } = data;
  
  switch (type) {
    case 'subscribe_task':
      await subscribeToTask(ws, user, payload.taskId);
      break;
      
    case 'unsubscribe_task':
      await unsubscribeFromTask(ws, user, payload.taskId);
      break;
      
    case 'mark_notification_read':
      await markNotificationAsRead(user.id, payload.notificationId);
      break;
      
    case 'get_notifications':
      await sendNotifications(user.id, payload.limit || 10);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Tipo de mensagem desconhecido: ${type}`,
        timestamp: new Date().toISOString()
      }));
  }
};

/**
 * Send message to specific user
 */
const sendToUser = (userId, message) => {
  const connections = userConnections.get(userId);
  if (connections) {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });
    
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
};

/**
 * Send message to multiple users
 */
const sendToUsers = (userIds, message) => {
  userIds.forEach(userId => sendToUser(userId, message));
};

/**
 * Send message to all connected users
 */
const broadcast = (message) => {
  userConnections.forEach((connections, userId) => {
    sendToUser(userId, message);
  });
};

/**
 * Send message to users with specific role
 */
const sendToRole = (role, message) => {
  connectionMetadata.forEach((metadata, ws) => {
    if (metadata.userRole === role && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      }));
    }
  });
};

/**
 * Task-related notifications
 */
const notifyTaskCreated = async (task, createdBy) => {
  const notification = {
    type: 'task_created',
    title: 'Nova tarefa criada',
    message: `Tarefa "${task.title}" foi criada`,
    data: {
      taskId: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      createdBy: createdBy.name,
      priority: task.priority
    }
  };
  
  // Notify assigned user and admins
  const recipients = [task.assigned_to];
  
  // Add admins
  const admins = await pool.query(
    'SELECT id FROM users WHERE role = ? AND is_active = 1',
    ['administrador']
  );
  admins.rows.forEach(admin => recipients.push(admin.id));
  
  sendToUsers([...new Set(recipients)], notification);
  
  // Store in database
  await storeNotification(recipients, notification);
};

const notifyTaskUpdated = async (task, updatedBy, changes) => {
  const notification = {
    type: 'task_updated',
    title: 'Tarefa atualizada',
    message: `Tarefa "${task.title}" foi atualizada`,
    data: {
      taskId: task.id,
      title: task.title,
      updatedBy: updatedBy.name,
      changes
    }
  };
  
  // Notify assigned user, creator, and admins
  const recipients = [task.assigned_to, task.created_by];
  
  const admins = await pool.query(
    'SELECT id FROM users WHERE role = ? AND is_active = 1',
    ['administrador']
  );
  admins.rows.forEach(admin => recipients.push(admin.id));
  
  sendToUsers([...new Set(recipients)], notification);
  await storeNotification(recipients, notification);
};

const notifyTaskStatusChanged = async (task, updatedBy, oldStatus, newStatus) => {
  const notification = {
    type: 'task_status_changed',
    title: 'Status da tarefa alterado',
    message: `Tarefa "${task.title}" mudou de "${oldStatus}" para "${newStatus}"`,
    data: {
      taskId: task.id,
      title: task.title,
      updatedBy: updatedBy.name,
      oldStatus,
      newStatus
    }
  };
  
  const recipients = [task.assigned_to, task.created_by];
  
  const admins = await pool.query(
    'SELECT id FROM users WHERE role = ? AND is_active = 1',
    ['administrador']
  );
  admins.rows.forEach(admin => recipients.push(admin.id));
  
  sendToUsers([...new Set(recipients)], notification);
  await storeNotification(recipients, notification);
};

const notifyTaskCommentAdded = async (task, comment, commentedBy) => {
  const notification = {
    type: 'task_comment_added',
    title: 'Novo comentário',
    message: `Novo comentário na tarefa "${task.title}"`,
    data: {
      taskId: task.id,
      taskTitle: task.title,
      commentId: comment.id,
      commentedBy: commentedBy.name,
      comment: comment.comment.substring(0, 100) + (comment.comment.length > 100 ? '...' : ''),
      isInternal: comment.is_internal
    }
  };
  
  let recipients = [task.assigned_to, task.created_by];
  
  // If internal comment, only notify internal users
  if (comment.is_internal) {
    const internalUsers = await pool.query(
      'SELECT id FROM users WHERE role = ? AND is_active = 1',
      ['administrador']
    );
    recipients = internalUsers.rows.map(user => user.id);
    recipients.push(task.assigned_to); // Always notify assigned user
  }
  
  sendToUsers([...new Set(recipients)], notification);
  await storeNotification(recipients, notification);
};

const notifyTaskOverdue = async (task) => {
  const notification = {
    type: 'task_overdue',
    title: 'Tarefa vencida',
    message: `Tarefa "${task.title}" está vencida`,
    data: {
      taskId: task.id,
      title: task.title,
      dueDate: task.due_date,
      assignedTo: task.assigned_to_name
    },
    priority: 'high'
  };
  
  const recipients = [task.assigned_to];
  
  const admins = await pool.query(
    'SELECT id FROM users WHERE role = ? AND is_active = 1',
    ['administrador']
  );
  admins.rows.forEach(admin => recipients.push(admin.id));
  
  sendToUsers([...new Set(recipients)], notification);
  await storeNotification(recipients, notification);
};

/**
 * System notifications
 */
const notifySystemEvent = (eventType, message, data = {}) => {
  const notification = {
    type: 'system_event',
    title: 'Evento do sistema',
    message,
    data: {
      eventType,
      ...data
    }
  };
  
  // Notify all admins
  sendToRole('administrador', notification);
};

/**
 * Store notification in database
 */
const storeNotification = async (userIds, notification) => {
  try {
    for (const userId of [...new Set(userIds)]) {
      await pool.query(`
        INSERT INTO notifications (
          user_id, type, title, message, data, is_read
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data || {}),
        false
      ]);
    }
  } catch (error) {
    console.error('Error storing notification:', error);
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (userId, notificationId) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    // Send confirmation
    sendToUser(userId, {
      type: 'notification_marked_read',
      notificationId
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Send recent notifications to user
 */
const sendNotifications = async (userId, limit = 10) => {
  try {
    const result = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [userId, limit]);
    
    sendToUser(userId, {
      type: 'notifications_list',
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

/**
 * Send pending notifications count
 */
const sendPendingNotificationsCount = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    sendToUser(userId, {
      type: 'pending_notifications_count',
      count: result.rows[0].count
    });
  } catch (error) {
    console.error('Error sending pending notifications count:', error);
  }
};

/**
 * Subscribe to task updates
 */
const subscribeToTask = async (ws, user, taskId) => {
  // Implementation would store subscription info
  ws.send(JSON.stringify({
    type: 'subscribed_to_task',
    taskId,
    message: `Inscrito nas atualizações da tarefa ${taskId}`
  }));
};

/**
 * Unsubscribe from task updates
 */
const unsubscribeFromTask = async (ws, user, taskId) => {
  // Implementation would remove subscription info
  ws.send(JSON.stringify({
    type: 'unsubscribed_from_task',
    taskId,
    message: `Desinscrito das atualizações da tarefa ${taskId}`
  }));
};

/**
 * Get connection statistics
 */
const getConnectionStats = () => {
  const stats = {
    totalConnections: 0,
    userConnections: {},
    connectionsByRole: {}
  };
  
  userConnections.forEach((connections, userId) => {
    stats.totalConnections += connections.size;
    stats.userConnections[userId] = connections.size;
  });
  
  connectionMetadata.forEach((metadata) => {
    const role = metadata.userRole;
    stats.connectionsByRole[role] = (stats.connectionsByRole[role] || 0) + 1;
  });
  
  return stats;
};

module.exports = {
  initializeWebSocket,
  sendToUser,
  sendToUsers,
  broadcast,
  sendToRole,
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyTaskStatusChanged,
  notifyTaskCommentAdded,
  notifyTaskOverdue,
  notifySystemEvent,
  getConnectionStats
};