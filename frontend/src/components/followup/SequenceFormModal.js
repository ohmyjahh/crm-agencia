import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import api from '../../services/api';

const SequenceFormModal = ({ open, onClose, onSave, sequence }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const interactionTypes = [
    { value: 'ligacao', label: 'Ligação' },
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'reuniao', label: 'Reunião' },
    { value: 'outro', label: 'Outro' }
  ];

  useEffect(() => {
    if (sequence) {
      setFormData({
        name: sequence.name || '',
        description: sequence.description || ''
      });
      
      if (sequence.steps) {
        setSteps(sequence.steps.sort((a, b) => a.step_order - b.step_order));
      }
    } else {
      setFormData({
        name: '',
        description: ''
      });
      setSteps([]);
    }
    setError('');
  }, [sequence, open]);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleAddStep = () => {
    const newStep = {
      id: Date.now(), // ID temporário
      step_order: steps.length + 1,
      day_offset: 0,
      interaction_type: 'ligacao',
      title: '',
      notes: ''
    };
    setSteps([...steps, newStep]);
  };

  const handleStepChange = (stepIndex, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      [field]: value
    };
    setSteps(updatedSteps);
  };

  const handleRemoveStep = (stepIndex) => {
    const updatedSteps = steps.filter((_, index) => index !== stepIndex);
    // Reordenar
    updatedSteps.forEach((step, index) => {
      step.step_order = index + 1;
    });
    setSteps(updatedSteps);
  };

  const validateSteps = () => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.title.trim()) {
        setError(`Passo ${i + 1}: Título é obrigatório`);
        return false;
      }
      if (step.day_offset < 0) {
        setError(`Passo ${i + 1}: Dia deve ser um número positivo`);
        return false;
      }
      
      // Verificar se dias são crescentes
      if (i > 0 && step.day_offset <= steps[i - 1].day_offset) {
        setError(`Passo ${i + 1}: Dia deve ser maior que o passo anterior`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (steps.length === 0) {
      setError('Adicione pelo menos um passo à cadência');
      return;
    }

    if (!validateSteps()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        steps: steps.map(step => ({
          step_order: step.step_order,
          day_offset: parseInt(step.day_offset),
          interaction_type: step.interaction_type,
          title: step.title,
          notes: step.notes
        }))
      };

      if (sequence) {
        await api.put(`/followups/sequences/${sequence.id}`, submitData);
      } else {
        await api.post('/followups/sequences', submitData);
      }

      onSave();
    } catch (error) {
      console.error('Erro ao salvar cadência:', error);
      setError(error.response?.data?.message || 'Erro ao salvar cadência');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getInteractionTypeLabel = (type) => {
    const found = interactionTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getInteractionTypeColor = (type) => {
    switch (type) {
      case 'ligacao': return 'primary';
      case 'email': return 'info';
      case 'whatsapp': return 'success';
      case 'reuniao': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px', maxHeight: '90vh' }
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
          {sequence ? 'Editar Cadência' : 'Nova Cadência'}
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Informações Básicas */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informações Básicas
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nome da Cadência"
                  variant="outlined"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  disabled={loading}
                  helperText="Nome único para identificar esta cadência"
                />

                <TextField
                  label="Descrição"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  disabled={loading}
                  helperText="Descrição opcional da cadência"
                />
              </Box>
            </Paper>

            {/* Passos da Cadência */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Passos da Cadência
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddStep}
                  disabled={loading}
                >
                  Adicionar Passo
                </Button>
              </Box>

              {steps.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum passo adicionado. Clique em "Adicionar Passo" para começar.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Dia</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Observações</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {steps.map((step, index) => (
                      <TableRow key={step.id || index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {index + 1}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={step.day_offset}
                            onChange={(e) => handleStepChange(index, 'day_offset', e.target.value)}
                            inputProps={{ min: 0 }}
                            sx={{ width: 80 }}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={step.interaction_type}
                              onChange={(e) => handleStepChange(index, 'interaction_type', e.target.value)}
                              disabled={loading}
                            >
                              {interactionTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={step.title}
                            onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                            placeholder="Título do passo"
                            sx={{ minWidth: 150 }}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={step.notes}
                            onChange={(e) => handleStepChange(index, 'notes', e.target.value)}
                            placeholder="Roteiro/observações"
                            multiline
                            maxRows={2}
                            sx={{ minWidth: 200 }}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveStep(index)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Box>
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
            disabled={loading}
            size="large"
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              sequence ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SequenceFormModal;