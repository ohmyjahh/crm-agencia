import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Card,
  Avatar,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Assignment as TaskIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Cancel as CancelIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { taskAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../Layout/MainLayout';
import TaskFormModal from './TaskFormModal';
import TaskViewModal from './TaskViewModal';
import EditableStatus from '../ui/EditableStatus';

const TaskList = ({ onNavigate }) => {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    client_id: '',
    my_tasks: false
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    per_page: 10
  });
  
  // Menu e dialogs
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);

  // Task modal states
  const [taskFormDialog, setTaskFormDialog] = useState(false);
  const [taskViewDialog, setTaskViewDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskFormLoading, setTaskFormLoading] = useState(false);

  const { isAdmin, user } = useAuth();

  const statusOptions = [
    { value: 'novo', label: 'Novo', color: 'warning', icon: <ScheduleIcon /> },
    { value: 'em_progresso', label: 'Em Progresso', color: 'info', icon: <PlayArrowIcon /> },
    { value: 'aguardando_validacao', label: 'Aguardando Validação', color: 'secondary', icon: <ScheduleIcon /> },
    { value: 'concluido', label: 'Concluído', color: 'success', icon: <CheckCircleIcon /> },
    { value: 'cancelado', label: 'Cancelado', color: 'error', icon: <CancelIcon /> }
  ];

  const priorityOptions = [
    { value: 'baixa', label: 'Baixa', color: 'default' },
    { value: 'media', label: 'Média', color: 'info' },
    { value: 'alta', label: 'Alta', color: 'warning' },
    { value: 'urgente', label: 'Urgente', color: 'error' }
  ];

  const loadTasks = async (page = 1, searchTerm = search, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        search: searchTerm.trim() || undefined,
        ...currentFilters,
        my_tasks: currentFilters.my_tasks ? 'true' : 'false'
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await taskAPI.getTasks(params);
      setTasks(response.data.data);
      setPagination(response.data.meta.pagination);
    } catch (error) {
      setError('Erro ao carregar tarefas');
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientAPI.getClients({ limit: 100, active: true });
      setClients(response.data.clients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadClients();
  }, []);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadTasks(1, search, filters);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    loadTasks(1, search, newFilters);
  };

  const handlePageChange = (event, page) => {
    loadTasks(page, search, filters);
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleView = () => {
    setViewingTask(selectedTask);
    setTaskViewDialog(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditingTask(selectedTask);
    setTaskFormDialog(true);
    handleMenuClose();
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setTaskFormDialog(true);
  };

  const handleTaskFormClose = () => {
    setTaskFormDialog(false);
    setEditingTask(null);
  };

  const handleTaskViewClose = () => {
    setTaskViewDialog(false);
    setViewingTask(null);
  };

  const handleTaskSaved = () => {
    // Recarregar lista de tarefas
    loadTasks(pagination?.current_page || 1, search, filters);
    handleTaskFormClose();
  };

  const handleDeleteOpen = () => {
    handleMenuClose();
    setDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialog(false);
    setSelectedTask(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await taskAPI.deleteTask(selectedTask.id);
      await loadTasks(pagination?.current_page || 1, search, filters);
      handleDeleteClose();
    } catch (error) {
      setError('Erro ao excluir tarefa');
      console.error('Erro ao excluir tarefa:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Função para atualizar status da tarefa
  const handleStatusChange = async (task, field, newValue) => {
    try {
      setStatusUpdateLoading(task.id);
      
      // Preparar dados de atualização
      const updateData = { [field]: newValue };
      
      // Fazer update da tarefa
      await taskAPI.updateTask(task.id, updateData);
      
      // Recarregar a lista mantendo os filtros atuais
      await loadTasks(pagination?.current_page || 1, search, filters);
      
    } catch (error) {
      setError(`Erro ao atualizar ${field} da tarefa`);
      console.error(`Erro ao atualizar ${field} da tarefa:`, error);
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const getStatusConfig = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const getPriorityConfig = (priority) => {
    return priorityOptions.find(opt => opt.value === priority) || priorityOptions[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const breadcrumbs = [
    { label: 'Tarefas', onClick: () => onNavigate('tasks') }
  ];

  const headerActions = null; // Remove ações do header

  // Calculate stats
  const stats = {
    total: pagination?.total_records || 0,
    novo: tasks.filter(t => t.status === 'novo').length,
    em_progresso: tasks.filter(t => t.status === 'em_progresso').length,
    concluido: tasks.filter(t => t.status === 'concluido').length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'concluido').length
  };

  return (
    <MainLayout
      title="Gestão de Tarefas"
      breadcrumbs={breadcrumbs}
      currentPage="tasks"
      onNavigate={onNavigate}
      headerActions={headerActions}
    >
      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 3,
              p: 3,
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TaskIcon sx={{ color: '#666', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#000',
                    mb: 0.5
                  }}
                >
                  {stats.total}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#999'
                  }}
                >
                  Total de Tarefas
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 3,
              p: 3,
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ScheduleIcon sx={{ color: '#f57c00', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#000',
                    mb: 0.5
                  }}
                >
                  {stats.novo}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#999'
                  }}
                >
                  Novas
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 3,
              p: 3,
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PlayArrowIcon sx={{ color: '#2196f3', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#000',
                    mb: 0.5
                  }}
                >
                  {stats.em_progresso}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#999'
                  }}
                >
                  Em Progresso
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 3,
              p: 3,
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FlagIcon sx={{ color: '#f44336', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#000',
                    mb: 0.5
                  }}
                >
                  {stats.overdue}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#999'
                  }}
                >
                  Atrasadas
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 3,
          mb: 4 
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '0.875rem',
              color: '#666',
              fontWeight: 400,
              mb: 3
            }}
          >
            Ações Rápidas
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewTask}
              sx={{
                bgcolor: '#000',
                color: 'white',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': {
                  bgcolor: '#333'
                }
              }}
            >
              Nova Tarefa
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Search and Filters */}
      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 3,
          mb: 4 
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '0.875rem',
              color: '#666',
              fontWeight: 400,
              mb: 3
            }}
          >
            Buscar e Filtrar Tarefas
          </Typography>
          
          {/* Search */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por título ou descrição..."
              value={search}
              onChange={handleSearchChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#666'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="small"
                      sx={{
                        bgcolor: '#000',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: '#333'
                        }
                      }}
                    >
                      Buscar
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={filters.priority}
                  label="Prioridade"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={filters.client_id}
                  label="Cliente"
                  onChange={(e) => handleFilterChange('client_id', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.my_tasks}
                    onChange={(e) => handleFilterChange('my_tasks', e.target.checked)}
                  />
                }
                label="Apenas minhas tarefas"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tasks Table */}
      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 3
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontSize: '0.75rem', 
                  color: '#999', 
                  fontWeight: 400, 
                  borderBottom: '1px solid #f0f0f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tarefa
                </TableCell>
                <TableCell sx={{ 
                  fontSize: '0.75rem', 
                  color: '#999', 
                  fontWeight: 400, 
                  borderBottom: '1px solid #f0f0f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </TableCell>
                <TableCell sx={{ 
                  fontSize: '0.75rem', 
                  color: '#999', 
                  fontWeight: 400, 
                  borderBottom: '1px solid #f0f0f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Prioridade
                </TableCell>
                <TableCell sx={{ 
                  fontSize: '0.75rem', 
                  color: '#999', 
                  fontWeight: 400, 
                  borderBottom: '1px solid #f0f0f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Responsável
                </TableCell>
                <TableCell sx={{ 
                  fontSize: '0.75rem', 
                  color: '#999', 
                  fontWeight: 400, 
                  borderBottom: '1px solid #f0f0f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Prazo
                </TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: '0.75rem', 
                  color: '#999', 
                  fontWeight: 400, 
                  borderBottom: '1px solid #f0f0f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma tarefa encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => {
                  const statusConfig = getStatusConfig(task.status);
                  const priorityConfig = getPriorityConfig(task.priority);
                  const overdue = isOverdue(task.due_date);

                  return (
                    <TableRow key={task.id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: `${statusConfig.color}.light`, width: 32, height: 32 }}>
                            {statusConfig.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.client_name ? `Cliente: ${task.client_name}` : 'Sem cliente'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <EditableStatus
                          value={task.status}
                          onChange={(newValue) => handleStatusChange(task, 'status', newValue)}
                          options={statusOptions}
                          loading={statusUpdateLoading === task.id}
                          statusType="task_status"
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <EditableStatus
                          value={task.priority}
                          onChange={(newValue) => handleStatusChange(task, 'priority', newValue)}
                          options={priorityOptions}
                          loading={statusUpdateLoading === task.id}
                          statusType="task_priority"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">
                            {task.assigned_to_name || 'Não atribuída'}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography 
                            variant="body2" 
                            color={overdue ? 'error.main' : 'text.primary'}
                          >
                            {formatDate(task.due_date)}
                          </Typography>
                          {overdue && (
                            <Chip 
                              label="Atrasada" 
                              color="error" 
                              size="small" 
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, task)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {(pagination?.total_pages || 0) > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination?.total_pages || 1}
              page={pagination?.current_page || 1}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>Excluir Tarefa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir a tarefa "{selectedTask?.title}"?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancelar</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Form Modal */}
      <Dialog 
        open={taskFormDialog} 
        onClose={handleTaskFormClose} 
        maxWidth="lg" 
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TaskFormModal
            task={editingTask}
            onSave={handleTaskSaved}
            onCancel={handleTaskFormClose}
            loading={taskFormLoading}
            setLoading={setTaskFormLoading}
            setError={setError}
          />
        </DialogContent>
      </Dialog>

      {/* Task View Modal */}
      <Dialog 
        open={taskViewDialog} 
        onClose={handleTaskViewClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Detalhes da Tarefa
        </DialogTitle>
        <DialogContent>
          {viewingTask && (
            <TaskViewModal
              task={viewingTask}
              onEdit={() => {
                handleTaskViewClose();
                setEditingTask(viewingTask);
                setTaskFormDialog(true);
              }}
              onClose={handleTaskViewClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TaskList;