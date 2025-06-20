import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { taskAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TaskForm = ({ taskId, onNavigate, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    project_id: '',
    assigned_to: '',
    priority: 'media',
    status: 'pendente',
    due_date: ''
  });
  
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { user, isAdmin } = useAuth();
  const isEditing = Boolean(taskId);

  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_progresso', label: 'Em Progresso' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const priorityOptions = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
    if (isEditing) {
      loadTask();
    } else {
      // Se não for admin, atribuir automaticamente ao usuário atual
      if (!isAdmin) {
        setFormData(prev => ({
          ...prev,
          assigned_to: user.id
        }));
      }
    }
  }, [taskId, isAdmin, user.id]);

  const loadInitialData = async () => {
    try {
      const [clientsResponse, usersResponse] = await Promise.all([
        clientAPI.getClients({ limit: 100 }),
        taskAPI.getUsers()
      ]);

      setClients(clientsResponse.data.clients);
      setUsers(usersResponse.data.users);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError('Erro ao carregar dados necessários');
    }
  };

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await taskAPI.getTaskById(taskId);
      const task = response.data.task;
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        client_id: task.client_id || '',
        project_id: task.project_id || '',
        assigned_to: task.assigned_to || '',
        priority: task.priority || 'media',
        status: task.status || 'pendente',
        due_date: task.due_date ? task.due_date.split('T')[0] : '' // Format for date input
      });
    } catch (error) {
      setError('Erro ao carregar dados da tarefa');
      console.error('Erro ao carregar tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar mensagens quando usuário digitar
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return false;
    }

    if (!formData.assigned_to) {
      setError('Usuário atribuído é obrigatório');
      return false;
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        setError('Data de vencimento não pode ser no passado');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Preparar dados (remover campos vazios)
      const dataToSend = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== '' && value !== null && value !== undefined) {
          dataToSend[key] = value;
        }
      });

      let response;
      if (isEditing) {
        response = await taskAPI.updateTask(taskId, dataToSend);
      } else {
        response = await taskAPI.createTask(dataToSend);
      }

      setSuccess(true);
      
      // Redirect após 2 segundos
      setTimeout(() => {
        onNavigate('tasks');
      }, 2000);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao salvar tarefa';
      setError(errorMessage);
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link
            component="button"
            variant="body2"
            onClick={() => onNavigate('tasks')}
            sx={{ textDecoration: 'none' }}
          >
            Tarefas
          </Link>
          <Typography variant="body2" color="text.primary">
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => onNavigate('tasks')}
          variant="outlined"
        >
          Voltar
        </Button>
        
        <Box>
          <Typography variant="h4" component="h1">
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? 'Atualize as informações da tarefa' : 'Crie uma nova tarefa para a equipe'}
          </Typography>
        </Box>
      </Box>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Tarefa {isEditing ? 'atualizada' : 'criada'} com sucesso! Redirecionando...
        </Alert>
      )}

      {/* Formulário */}
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Título */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder="Ex: Entrar em contato com cliente ABC"
              />
            </Grid>

            {/* Descrição */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={3}
                placeholder="Descreva os detalhes da tarefa..."
              />
            </Grid>

            {/* Cliente e Usuário Atribuído */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  label="Cliente"
                  disabled={saving}
                >
                  <MenuItem value="">
                    <em>Nenhum cliente</em>
                  </MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Atribuído a *</InputLabel>
                <Select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  label="Atribuído a *"
                  disabled={saving || (!isAdmin && !isEditing)}
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} {user.role === 'administrador' ? '(Admin)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Prioridade e Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Prioridade"
                  disabled={saving}
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                  disabled={saving}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Data de Vencimento */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Vencimento"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0] // Não permitir datas passadas
                }}
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => onNavigate('tasks')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Tarefa')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default TaskForm;