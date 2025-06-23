import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  DialogActions,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  Alert,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Fab,
  Zoom,
} from '@mui/material';
import {
  Edit as EditIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Attachment as AttachmentIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Notifications as NotificationIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { taskAPI } from '../../services/api';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';

const TaskViewModal = ({ task, onEdit, onClose, onDelete, onStatusChange }) => {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [timeTracking, setTimeTracking] = useState({ isRunning: false, elapsed: 0, startTime: null });
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [taskProgress, setTaskProgress] = useState(0);

  useEffect(() => {
    if (task) {
      loadComments();
      loadHistory();
      loadAttachments();
      calculateProgress();
      loadTimeTracking();
    }
  }, [task]);

  useEffect(() => {
    let interval;
    if (timeTracking.isRunning) {
      interval = setInterval(() => {
        setTimeTracking(prev => ({
          ...prev,
          elapsed: prev.elapsed + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeTracking.isRunning]);

  const loadComments = async () => {
    try {
      const response = await taskAPI.getComments(task.id);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await taskAPI.getHistory(task.id);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAttachments = async () => {
    try {
      const response = await taskAPI.getAttachments(task.id);
      setAttachments(response.data.attachments);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
  };

  const calculateProgress = () => {
    let progress = 0;
    switch (task.status) {
      case 'novo': progress = 0; break;
      case 'em_progresso': progress = 50; break;
      case 'aguardando_validacao': progress = 80; break;
      case 'concluido': progress = 100; break;
      case 'cancelado': progress = 0; break;
      default: progress = 0;
    }
    setTaskProgress(progress);
  };

  const loadTimeTracking = async () => {
    try {
      // Simular carregamento do time tracking
      const savedTime = localStorage.getItem(`task_time_${task.id}`);
      if (savedTime) {
        const timeData = JSON.parse(savedTime);
        setTimeTracking(timeData);
      }
    } catch (error) {
      console.error('Erro ao carregar time tracking:', error);
    }
  };

  const handleTimeToggle = () => {
    const newState = !timeTracking.isRunning;
    const newTimeTracking = {
      ...timeTracking,
      isRunning: newState,
      startTime: newState ? Date.now() : null
    };
    setTimeTracking(newTimeTracking);
    localStorage.setItem(`task_time_${task.id}`, JSON.stringify(newTimeTracking));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadComments(),
        loadHistory(),
        loadAttachments()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      await taskAPI.updateStatus(task.id, newStatus);
      if (onStatusChange) {
        onStatusChange(task.id, newStatus);
      }
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCopyTaskLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
    // Aqui você pode adicionar um toast notification
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'error';
      case 'alta': return 'warning';
      case 'media': return 'info';
      case 'baixa': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'novo': return 'warning';
      case 'em_progresso': return 'info';
      case 'aguardando_validacao': return 'secondary';
      case 'concluido': return 'success';
      case 'cancelado': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'novo': 'Novo',
      'em_progresso': 'Em Progresso',
      'aguardando_validacao': 'Aguardando Validação',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  return (
    <Box sx={{ p: 2, maxHeight: '90vh', overflow: 'auto' }}>
      {/* Header da Tarefa */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: getPriorityColor(task.priority) + '.light', width: 52, height: 52 }}>
          <TaskIcon fontSize="large" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>
              {task.title}
            </Typography>
            <Tooltip title="Atualizar">
              <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Mais opções">
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <BusinessIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            Cliente: {task.client_name || 'Nenhum cliente'}
          </Typography>
          
          {/* Barra de Progresso */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progresso da Tarefa
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={taskProgress} 
                sx={{ height: 8, borderRadius: 4 }}
                color={taskProgress === 100 ? 'success' : 'primary'}
              />
            </Box>
            <Typography variant="caption" fontWeight="bold">
              {taskProgress}%
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={getStatusLabel(task.status)}
              color={getStatusColor(task.status)}
              size="small"
              onClick={() => { setNewStatus(task.status); setShowStatusDialog(true); }}
              clickable
            />
            <Chip
              icon={<FlagIcon />}
              label={getPriorityLabel(task.priority)}
              color={getPriorityColor(task.priority)}
              size="small"
              variant="outlined"
            />
          </Box>
          
          {/* Timer de Trabalho */}
          <Card variant="outlined" sx={{ p: 1, minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon fontSize="small" color={timeTracking.isRunning ? 'primary' : 'disabled'} />
              <Typography variant="caption" fontWeight="bold">
                {formatTime(timeTracking.elapsed)}
              </Typography>
              <IconButton 
                size="small" 
                color={timeTracking.isRunning ? 'error' : 'primary'}
                onClick={handleTimeToggle}
              >
                {timeTracking.isRunning ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Alertas e Notificações */}
      {isOverdue(task.due_date) && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
          Esta tarefa está atrasada desde {formatDate(task.due_date)}
        </Alert>
      )}
      
      {task.reminder_date && new Date(task.reminder_date) <= new Date() && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<NotificationIcon />}>
          Lembrete: Esta tarefa precisa da sua atenção
        </Alert>
      )}

      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs de Navegação */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Detalhes" icon={<InfoIcon />} />
          <Tab 
            label={`Comentários (${comments.length})`} 
            icon={<Badge badgeContent={comments.length} color="primary"><CommentIcon /></Badge>} 
          />
          <Tab 
            label={`Anexos (${attachments.length})`} 
            icon={<Badge badgeContent={attachments.length} color="primary"><AttachmentIcon /></Badge>} 
          />
          <Tab label="Histórico" icon={<HistoryIcon />} />
        </Tabs>
      </Paper>

      {/* Conteúdo das Tabs */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  Detalhes da Tarefa
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PersonIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Responsável
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {task.assigned_to_name || 'Não atribuída'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ScheduleIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Data de Vencimento
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="medium"
                          color={isOverdue(task.due_date) ? 'error.main' : 'text.primary'}
                        >
                          {formatDate(task.due_date)}
                          {isOverdue(task.due_date) && ' ⚠️'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  {task.estimated_hours && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TimerIcon color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Horas Estimadas
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {task.estimated_hours}h
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {task.tags && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {task.tags.split(',').map((tag, index) => (
                          <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  
                  {task.description && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Descrição
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {task.description}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Sidebar com Ações */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {/* Quick Actions */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Ações Rápidas
                  </Typography>
                  <Stack spacing={1}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      startIcon={<EditIcon />}
                      onClick={onEdit}
                    >
                      Editar Tarefa
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      startIcon={<ShareIcon />}
                      onClick={handleCopyTaskLink}
                    >
                      Compartilhar
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      startIcon={<PrintIcon />}
                      onClick={() => window.print()}
                    >
                      Imprimir
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
              
              {/* Métricas */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Estatísticas
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Comentários:</Typography>
                    <Typography variant="body2" fontWeight="bold">{comments.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Anexos:</Typography>
                    <Typography variant="body2" fontWeight="bold">{attachments.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tempo Gasto:</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatTime(timeTracking.elapsed)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* Tab de Comentários */}
      {activeTab === 1 && (
        <TaskComments 
          taskId={task.id} 
          onCommentAdded={loadComments}
        />
      )}

      {/* Tab de Anexos */}
      {activeTab === 2 && (
        <TaskAttachments 
          taskId={task.id} 
          onAttachmentChange={loadAttachments}
        />
      )}

      {/* Tab de Histórico */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {history.map((item) => (
                  <ListItem key={item.id} alignItems="flex-start" divider>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                        <HistoryIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.user_name}
                          </Typography>
                          <Chip 
                            label={formatDateTime(item.created_at)} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {item.description || `${item.action} - ${item.field_name}: ${item.old_value} → ${item.new_value}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {history.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Nenhuma atividade registrada ainda
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações do Sistema */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', mb: 2 }}>
        <Typography variant="caption">
          Criada em: {formatDateTime(task.created_at)}
        </Typography>
        <Typography variant="caption">
          Por: {task.created_by_name || 'Sistema'}
        </Typography>
      </Box>

      {/* Menu de Ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handleCopyTaskLink(); setMenuAnchor(null); }}>
          <CopyIcon sx={{ mr: 1 }} /> Copiar Link
        </MenuItem>
        <MenuItem onClick={() => { window.print(); setMenuAnchor(null); }}>
          <PrintIcon sx={{ mr: 1 }} /> Imprimir
        </MenuItem>
        <Divider />
        {onDelete && (
          <MenuItem 
            onClick={() => { onDelete(task.id); setMenuAnchor(null); }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} /> Excluir
          </MenuItem>
        )}
      </Menu>

      {/* Dialog para Mudança de Status */}
      <Dialog open={showStatusDialog} onClose={() => setShowStatusDialog(false)}>
        <DialogTitle>Alterar Status da Tarefa</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Novo Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            <MenuItem value="novo">Novo</MenuItem>
            <MenuItem value="em_progresso">Em Progresso</MenuItem>
            <MenuItem value="aguardando_validacao">Aguardando Validação</MenuItem>
            <MenuItem value="concluido">Concluído</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>Cancelar</Button>
          <Button onClick={handleStatusChange} variant="contained">Atualizar</Button>
        </DialogActions>
      </Dialog>

      {/* FAB para Ações Rápidas */}
      <Zoom in={activeTab === 0}>
        <Fab
          color="primary"
          onClick={onEdit}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <EditIcon />
        </Fab>
      </Zoom>

      <DialogActions sx={{ mt: 3, px: 0, position: 'sticky', bottom: 0, bgcolor: 'background.paper', zIndex: 1 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Fechar
        </Button>
        <Button 
          variant="contained"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Editar Tarefa
        </Button>
      </DialogActions>
    </Box>
  );
};

export default TaskViewModal;