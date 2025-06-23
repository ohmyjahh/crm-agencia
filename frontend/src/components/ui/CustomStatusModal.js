import React, { useState } from 'react';
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
  Typography,
  Grid,
  Alert,
  Chip,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const CustomStatusModal = ({
  open,
  onClose,
  onSave,
  statusType = 'general',
  existingStatuses = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    color: 'default',
    description: ''
  });
  const [errors, setErrors] = useState({});

  // Opções de cores disponíveis
  const colorOptions = [
    { value: 'default', label: 'Padrão', preview: '#757575' },
    { value: 'primary', label: 'Primário', preview: '#1976d2' },
    { value: 'secondary', label: 'Secundário', preview: '#dc004e' },
    { value: 'success', label: 'Sucesso', preview: '#2e7d32' },
    { value: 'error', label: 'Erro', preview: '#d32f2f' },
    { value: 'warning', label: 'Aviso', preview: '#ed6c02' },
    { value: 'info', label: 'Informação', preview: '#0288d1' }
  ];

  // Mapear tipo de status para título
  const getTypeLabel = (type) => {
    const typeLabels = {
      general: 'Status Geral',
      priority: 'Prioridade',
      category: 'Categoria',
      format: 'Formato',
      client_status: 'Status do Cliente',
      task_status: 'Status da Tarefa',
      product_status: 'Status do Produto'
    };
    return typeLabels[type] || 'Status';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Gerar valor automaticamente baseado no label
    if (field === 'label') {
      const generatedValue = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '_') // Substitui espaços por underscore
        .trim();
      
      setFormData(prev => ({ ...prev, value: generatedValue }));
    }

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Nome é obrigatório';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Valor é obrigatório';
    } else {
      // Verificar se o valor já existe
      const valueExists = existingStatuses.some(
        status => status.value.toLowerCase() === formData.value.toLowerCase()
      );
      if (valueExists) {
        newErrors.value = 'Este valor já existe';
      }

      // Validar formato do valor
      if (!/^[a-z0-9_]+$/.test(formData.value)) {
        newErrors.value = 'Valor deve conter apenas letras minúsculas, números e underscore';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newStatus = {
      ...formData,
      type: statusType,
      custom: true,
      created_at: new Date().toISOString()
    };

    onSave(newStatus);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      label: '',
      value: '',
      color: 'default',
      description: ''
    });
    setErrors({});
    onClose();
  };

  // const selectedColor = colorOptions.find(opt => opt.value === formData.color);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
            <PaletteIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6">
              Criar Status Personalizado
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getTypeLabel(statusType)}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Crie um status personalizado que ficará disponível para todos os itens desta categoria.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Nome do Status */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome do Status"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              error={!!errors.label}
              helperText={errors.label || 'Ex: Em Revisão, Aguardando Aprovação'}
              placeholder="Digite o nome do status"
            />
          </Grid>

          {/* Valor (gerado automaticamente) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Valor (ID interno)"
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              error={!!errors.value}
              helperText={errors.value || 'Gerado automaticamente, pode ser editado'}
              placeholder="ex: em_revisao"
            />
          </Grid>

          {/* Cor */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Cor</InputLabel>
              <Select
                value={formData.color}
                label="Cor"
                onChange={(e) => handleInputChange('color', e.target.value)}
              >
                {colorOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: option.preview,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Descrição (opcional) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição (opcional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
              placeholder="Descreva quando este status deve ser usado"
            />
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" gutterBottom color="text.secondary">
                Pré-visualização:
              </Typography>
              <Chip
                label={formData.label || 'Novo Status'}
                color={formData.color}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.label.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? 'Salvando...' : 'Criar Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomStatusModal;