import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Assignment as TaskIcon,
  ExpandMore as ExpandMoreIcon,
  Attachment as AttachmentIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { taskAPI, clientAPI } from '../../services/api';

const TaskFormModal = ({ task, onSave, onCancel, loading, setLoading, setError }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    assigned_to: '',
    priority: 'media',
    status: 'novo',
    due_date: '',
    tags: [],
    estimated_hours: '',
    recurrence: 'none',
    reminder_date: ''
  });

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableTags, setAvailableTags] = useState(['urgent', 'follow-up', 'meeting', 'development', 'support', 'marketing']);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const isEditing = Boolean(task);

  useEffect(() => {
    loadClients();
    loadUsers();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        client_id: task.client_id || '',
        assigned_to: task.assigned_to || '',
        priority: task.priority || 'media',
        status: task.status || 'novo',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        tags: task.tags ? task.tags.split(',') : [],
        estimated_hours: task.estimated_hours || '',
        recurrence: task.recurrence || 'none',
        reminder_date: task.reminder_date ? task.reminder_date.split('T')[0] : ''
      });
      if (task.id) {
        loadAttachments(task.id);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        client_id: '',
        assigned_to: '',
        priority: 'media',
        status: 'novo',
        due_date: '',
        tags: [],
        estimated_hours: '',
        recurrence: 'none',
        reminder_date: ''
      });
      setAttachments([]);
    }
  }, [task]);

  const loadClients = async () => {
    try {
      const response = await clientAPI.getClients({ limit: 100, active: true });
      setClients(response.data.clients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await taskAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadAttachments = async (taskId) => {
    try {
      const response = await taskAPI.getAttachments(taskId);
      setAttachments(response.data.attachments || []);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
  };

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!task?.id) {
      setError('Salve a tarefa primeiro para adicionar anexos');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('attachment', file);
      
      await taskAPI.uploadAttachment(task.id, formData);
      await loadAttachments(task.id);
    } catch (error) {
      setError('Erro ao enviar arquivo');
      console.error('Erro ao enviar arquivo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await taskAPI.deleteAttachment(task.id, attachmentId);
      await loadAttachments(task.id);
    } catch (error) {
      setError('Erro ao remover anexo');
      console.error('Erro ao remover anexo:', error);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return false;
    }

    if (!formData.assigned_to) {
      setError('Responsável é obrigatório');
      return false;
    }

    if (formData.due_date) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.due_date < today && !isEditing) {
        setError('Data de vencimento não pode ser no passado');
        return false;
      }
    }

    if (formData.reminder_date && formData.due_date) {
      if (formData.reminder_date > formData.due_date) {
        setError('Data de lembrete não pode ser posterior à data de vencimento');
        return false;
      }
    }

    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours <= 0)) {
      setError('Horas estimadas deve ser um número positivo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Limpar dados vazios
      const cleanData = {};
      Object.keys(formData).forEach(key => {
        if (key === 'client_id' && !formData[key]) {
          // cliente é opcional
          return;
        }
        if (key === 'tags') {
          cleanData[key] = formData[key].join(',');
        } else if (key === 'estimated_hours') {
          cleanData[key] = parseFloat(formData[key]) || null;
        } else if (formData[key]?.toString().trim()) {
          cleanData[key] = formData[key];
        }
      });

      if (isEditing) {
        await taskAPI.updateTask(task.id, cleanData);
      } else {
        await taskAPI.createTask(cleanData);
      }

      onSave();

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar tarefa');
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Linha 1: Título, Cliente, Responsável */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Título *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Cliente"
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="">Nenhum cliente</MenuItem>
            {clients.map(client => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Responsável *"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            required
            size="small"
          >
            <MenuItem value="">Selecione</MenuItem>
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Linha 2: Descrição, Prioridade, Status */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Descrição"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Prioridade"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="baixa">Baixa</MenuItem>
            <MenuItem value="media">Média</MenuItem>
            <MenuItem value="alta">Alta</MenuItem>
            <MenuItem value="urgente">Urgente</MenuItem>
          </TextField>
        </Grid>
        {isEditing && (
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="novo">Novo</MenuItem>
              <MenuItem value="em_progresso">Em Progresso</MenuItem>
              <MenuItem value="aguardando_validacao">Aguardando Validação</MenuItem>
              <MenuItem value="concluido">Concluído</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </TextField>
          </Grid>
        )}

        {/* Linha 3: Data de Vencimento e Horas Estimadas */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Data de Vencimento"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Lembrete"
            name="reminder_date"
            type="date"
            value={formData.reminder_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            helperText="Data para receber lembrete"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Horas Estimadas"
            name="estimated_hours"
            type="number"
            value={formData.estimated_hours}
            onChange={handleChange}
            inputProps={{ min: 0, step: 0.5 }}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Recorrência"
            name="recurrence"
            value={formData.recurrence}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="none">Sem recorrência</MenuItem>
            <MenuItem value="daily">Diário</MenuItem>
            <MenuItem value="weekly">Semanal</MenuItem>
            <MenuItem value="monthly">Mensal</MenuItem>
            <MenuItem value="yearly">Anual</MenuItem>
          </TextField>
        </Grid>

        {/* Linha 4: Tags */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={formData.tags}
            onChange={(event, newValue) => {
              setFormData(prev => ({ ...prev, tags: newValue }));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={index}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Adicione tags para organizar..."
                size="small"
                helperText="Digite e pressione Enter para adicionar tags customizadas"
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Seção de Anexos - só aparece ao editar */}
      {isEditing && (
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                <AttachmentIcon sx={{ mr: 1, fontSize: 18 }} />
                Anexos ({attachments.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Área de Upload */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  textAlign: 'center',
                  backgroundColor: dragOver ? 'action.hover' : 'background.paper',
                  border: dragOver ? '2px dashed' : '1px solid',
                  borderColor: dragOver ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                />
                
                {uploading ? (
                  <Box>
                    <CircularProgress sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Enviando arquivo...
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <UploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" gutterBottom>
                      Arraste arquivos aqui ou clique para selecionar
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Lista de Anexos */}
              {attachments.length > 0 && (
                <List dense>
                  {attachments.map((attachment) => (
                    <ListItem key={attachment.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32 }}>
                          <AttachmentIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={attachment.original_name}
                        secondary={`${attachment.file_size_mb} MB • ${attachment.user_name}`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Remover anexo">
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Preview das informações */}
      <Box sx={{ mt: 3 }}>
        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Resumo da Tarefa
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {formData.priority && (
                <Chip
                  icon={<FlagIcon />}
                  label={formData.priority}
                  size="small"
                  color={formData.priority === 'urgente' ? 'error' : formData.priority === 'alta' ? 'warning' : 'default'}
                />
              )}
              {formData.status && isEditing && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label={formData.status.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                />
              )}
              {formData.due_date && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`Vence: ${new Date(formData.due_date).toLocaleDateString('pt-BR')}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              {formData.estimated_hours && (
                <Chip
                  label={`${formData.estimated_hours}h estimadas`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <DialogActions sx={{ mt: 3, px: 0 }}>
        <Button onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
        </Button>
      </DialogActions>
    </Box>
  );
};

// Função auxiliar para obter cor da prioridade
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgente': return 'error';
    case 'alta': return 'warning';
    case 'media': return 'info';
    case 'baixa': return 'default';
    default: return 'default';
  }
};

export default TaskFormModal;