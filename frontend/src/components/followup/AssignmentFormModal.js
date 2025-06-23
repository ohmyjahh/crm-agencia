import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import api from '../../services/api';

const AssignmentFormModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    client_id: '',
    sequence_id: '',
    responsible_user: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dados para dropdowns
  const [clients, setClients] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      loadFormData();
      setFormData({
        client_id: '',
        sequence_id: '',
        responsible_user: '',
        start_date: new Date().toISOString().split('T')[0]
      });
      setError('');
    }
  }, [open]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      
      // Carregar dados com tratamento de erro individualizado
      const clientsRes = await api.get('/clients').catch(err => {
        console.error('Erro ao carregar clientes:', err);
        return { data: { data: [] } };
      });
      
      const sequencesRes = await api.get('/followups/sequences').catch(err => {
        console.error('Erro ao carregar cadências:', err);
        return { data: { data: [] } };
      });
      
      // Para usuários, vamos usar um usuário padrão se não houver endpoint
      const usersRes = await api.get('/auth/users').catch(err => {
        console.error('Endpoint de usuários não encontrado, usando usuário padrão:', err);
        return { data: { data: [{ id: 1, name: 'Usuário Padrão' }] } };
      });
      
      setClients(clientsRes.data.data || []);
      setSequences(sequencesRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do formulário');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.client_id || !formData.sequence_id || !formData.responsible_user) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/followups/assignments', formData);
      console.log('Atribuição criada com sucesso:', response.data);
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao criar atribuição:', error);
      if (error.response?.status === 404) {
        setError('Endpoint não encontrado. Verifique se o backend está configurado.');
      } else if (error.response?.status === 401) {
        setError('Não autorizado. Faça login novamente.');
      } else {
        setError(error.response?.data?.message || error.response?.data?.error || 'Erro ao criar atribuição');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="bold">
          Nova Atribuição de Cadência
        </Typography>
        <Button
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 1 }}
          disabled={loading}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Cliente */}
              <FormControl fullWidth required>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.client_id}
                  label="Cliente"
                  onChange={handleInputChange('client_id')}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Selecione um cliente</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} {client.email && `(${client.email})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Cadência */}
              <FormControl fullWidth required>
                <InputLabel>Cadência</InputLabel>
                <Select
                  value={formData.sequence_id}
                  label="Cadência"
                  onChange={handleInputChange('sequence_id')}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Selecione uma cadência</em>
                  </MenuItem>
                  {sequences.map((sequence) => (
                    <MenuItem key={sequence.id} value={sequence.id}>
                      {sequence.name}
                      {sequence.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          - {sequence.description}
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Responsável */}
              <FormControl fullWidth required>
                <InputLabel>Responsável</InputLabel>
                <Select
                  value={formData.responsible_user}
                  label="Responsável"
                  onChange={handleInputChange('responsible_user')}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Selecione um responsável</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Data de Início */}
              <TextField
                label="Data de Início"
                type="date"
                variant="outlined"
                fullWidth
                required
                value={formData.start_date}
                onChange={handleInputChange('start_date')}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Data em que a cadência deve começar"
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            size="large"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading || loadingData}
            size="large"
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              'Atribuir'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssignmentFormModal;