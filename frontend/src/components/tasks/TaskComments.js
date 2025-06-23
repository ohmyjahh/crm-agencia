import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { taskAPI } from '../../services/api';

const TaskComments = ({ taskId, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getComments(taskId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      await taskAPI.addComment(taskId, { comment: newComment.trim() });
      setNewComment('');
      await loadComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendComment();
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Input para novo comentário */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            variant="standard"
            disabled={sending}
          />
          <IconButton 
            onClick={handleSendComment}
            disabled={!newComment.trim() || sending}
            color="primary"
            size="small"
          >
            {sending ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          textAlign="center" 
          sx={{ py: 3 }}
        >
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </Typography>
      ) : (
        <List disablePadding>
          {comments.map((comment, index) => (
            <Box key={comment.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" component="span">
                        {comment.user_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(comment.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      component="div" 
                      sx={{ 
                        mt: 0.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {comment.comment}
                    </Typography>
                  }
                />
              </ListItem>
              {index < comments.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TaskComments;