import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
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
} from '@mui/icons-material';
import { taskAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TaskList = ({ onNavigate }) => {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
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
    { value: 'pendente', label: 'Pendente', color: 'warning' },
    { value: 'em_progresso', label: 'Em Progresso', color: 'info' },
    { value: 'concluida', label: 'Concluída', color: 'success' },
    { value: 'cancelada', label: 'Cancelada', color: 'error' }
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

  const loadInitialData = async () => {
    try {
      // Carregar dados iniciais em paralelo
      const [clientsResponse, usersResponse] = await Promise.all([
        clientAPI.getClients({ limit: 100 }),
        taskAPI.getUsers()
      ]);

      setClients(clientsResponse.data.clients);
      setUsers(usersResponse.data.users);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadTasks();
  }, []);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadTasks(1, search, filters);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
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
      setError('Erro ao deletar tarefa');
      console.error('Erro ao deletar tarefa:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const getPriorityConfig = (priority) => {
    return priorityOptions.find(opt => opt.value === priority) || priorityOptions[1];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'concluida') return false;
    return new Date(task.due_date) < new Date();
  };

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Tarefas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie as tarefas da equipe
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onNavigate('task-form')}
          size="large"
        >
          Nova Tarefa
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Busca */}
          <Grid item xs={12} md={4}>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar tarefas..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Grid>

          {/* Filtro Status */}
          <Grid item xs={6} md={2}>
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

          {/* Filtro Prioridade */}
          <Grid item xs={6} md={2}>
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

          {/* Filtro Cliente */}
          <Grid item xs={6} md={2}>
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

          {/* Filtro Usuário (só para admin) */}
          {isAdmin && (
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Atribuído a</InputLabel>
                <Select
                  value={filters.assigned_to}
                  label="Atribuído a"
                  onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Toggle Minhas Tarefas */}
          {!isAdmin && (
            <Grid item xs={6} md={2}>
              <Button
                variant={filters.my_tasks ? 'contained' : 'outlined'}
                onClick={() => handleFilterChange('my_tasks', !filters.my_tasks)}
                size="small"
                fullWidth
              >
                Minhas Tarefas
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarefa</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Atribuído a</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {search || Object.values(filters).some(f => f) ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa cadastrada'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  hover
                  sx={{ 
                    bgcolor: isOverdue(task) ? 'error.light' : 'inherit',
                    '&:hover': {
                      bgcolor: isOverdue(task) ? 'error.main' : 'inherit'
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TaskIcon color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {task.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {task.client_name ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2">{task.client_name}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">{task.assigned_to_name}</Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getStatusConfig(task.status).label}
                      color={getStatusConfig(task.status).color}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getPriorityConfig(task.priority).label}
                      color={getPriorityConfig(task.priority).color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography 
                      variant="body2"
                      color={isOverdue(task) ? 'error' : 'inherit'}
                      fontWeight={isOverdue(task) ? 'bold' : 'normal'}
                    >
                      {formatDate(task.due_date)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, task)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {pagination.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.total_pages}
            page={pagination.current_page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Menu de ações */}
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
        {isAdmin && (
          <MenuItem onClick={handleDeleteOpen}>
            <DeleteIcon sx={{ mr: 1 }} />
            Deletar
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de confirmação */}
      <Dialog open={deleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>Deletar Tarefa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar a tarefa "{selectedTask?.title}"?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Deletar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {loading && tasks.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default TaskList;