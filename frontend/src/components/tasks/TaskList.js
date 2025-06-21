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

  const { isAdmin, user } = useAuth();

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'warning', icon: <ScheduleIcon /> },
    { value: 'em_progresso', label: 'Em Progresso', color: 'info', icon: <PlayArrowIcon /> },
    { value: 'concluida', label: 'Concluída', color: 'success', icon: <CheckCircleIcon /> },
    { value: 'cancelada', label: 'Cancelada', color: 'error', icon: <CancelIcon /> }
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
      setTasks(response.data.tasks);
      setPagination(response.data.pagination);
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
    handleMenuClose();
    onNavigate('task-details', { taskId: selectedTask.id });
  };

  const handleEdit = () => {
    handleMenuClose();
    onNavigate('task-form', { taskId: selectedTask.id });
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
      await loadTasks(pagination.current_page, search, filters);
      handleDeleteClose();
    } catch (error) {
      setError('Erro ao excluir tarefa');
      console.error('Erro ao excluir tarefa:', error);
    } finally {
      setActionLoading(false);
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

  const headerActions = (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={() => alert('Filtros expandidos em breve')}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        Filtros
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => onNavigate('task-form')}
      >
        Nova Tarefa
      </Button>
    </Stack>
  );

  // Calculate stats
  const stats = {
    total: pagination.total_records,
    pendente: tasks.filter(t => t.status === 'pendente').length,
    em_progresso: tasks.filter(t => t.status === 'em_progresso').length,
    concluida: tasks.filter(t => t.status === 'concluida').length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'concluida').length
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <TaskIcon color="primary" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Tarefas
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <ScheduleIcon color="warning" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.pendente}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendentes
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <PlayArrowIcon color="info" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.em_progresso}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Em Progresso
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <FlagIcon color="error" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.overdue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Atrasadas
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Buscar e Filtrar Tarefas
          </Typography>
          
          {/* Search */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por título ou descrição..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button type="submit" variant="contained" size="small">
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
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarefa</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell align="center">Ações</TableCell>
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
                    <TableRow key={task.id} hover>
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
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          icon={statusConfig.icon}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={priorityConfig.label}
                          color={priorityConfig.color}
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
        {pagination.total_pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination.total_pages}
              page={pagination.current_page}
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
    </MainLayout>
  );
};

export default TaskList;