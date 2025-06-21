import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { clientAPI } from '../../services/api';

const ClientFormModal = ({ client, onSave, onCancel, loading, setLoading, setError }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    document_type: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    category: 'bronze',
    service_format: 'avulso',
    average_ticket: '',
    is_active: true
  });

  const isEditing = Boolean(client);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        document: client.document || '',
        document_type: client.document_type || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        notes: client.notes || '',
        category: client.category || 'bronze',
        service_format: client.service_format || 'avulso',
        average_ticket: client.average_ticket || '',
        is_active: client.is_active !== undefined ? client.is_active : true
      });
    } else {
      // Reset para novo cliente
      setFormData({
        name: '',
        email: '',
        phone: '',
        document: '',
        document_type: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        notes: '',
        category: 'bronze',
        service_format: 'avulso',
        average_ticket: '',
        is_active: true
      });
    }
  }, [client]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDocument = (value, type) => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'CPF') {
      const truncated = numbers.substring(0, 11);
      return truncated.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (type === 'CNPJ') {
      const truncated = numbers.substring(0, 14);
      return truncated.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return value;
  };

  const handleDocumentChange = (event) => {
    const { value } = event.target;
    const formatted = formatDocument(value, formData.document_type);
    
    setFormData(prev => ({
      ...prev,
      document: formatted
    }));
  };

  const handleDocumentTypeChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      document_type: value,
      document: ''
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (formData.email && !formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }

    if (formData.document && formData.document_type) {
      const numbers = formData.document.replace(/\D/g, '');
      
      if (formData.document_type === 'CPF' && numbers.length !== 11) {
        setError('CPF deve ter 11 dígitos');
        return false;
      }
      
      if (formData.document_type === 'CNPJ' && numbers.length !== 14) {
        setError('CNPJ deve ter 14 dígitos');
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
      setLoading(true);
      setError(null);

      // Limpar dados vazios
      const cleanData = {};
      Object.keys(formData).forEach(key => {
        if (key === 'average_ticket') {
          // Para campos numéricos
          cleanData[key] = parseFloat(formData[key]) || 0;
        } else if (['category', 'service_format', 'is_active'].includes(key)) {
          // Para campos obrigatórios
          cleanData[key] = formData[key];
        } else if (formData[key]?.trim()) {
          cleanData[key] = formData[key].trim();
        }
      });

      if (isEditing) {
        await clientAPI.updateClient(client.id, cleanData);
      } else {
        await clientAPI.createClient(cleanData);
      }

      onSave();

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar cliente');
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Linha 1: Nome, Email, Telefone */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Nome *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Telefone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        {/* Linha 2: Tipo Documento, Documento */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Tipo Documento"
            name="document_type"
            value={formData.document_type}
            onChange={handleDocumentTypeChange}
            size="small"
          >
            <MenuItem value="">Selecione</MenuItem>
            <MenuItem value="CPF">CPF</MenuItem>
            <MenuItem value="CNPJ">CNPJ</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            label="Documento"
            name="document"
            value={formData.document}
            onChange={handleDocumentChange}
            disabled={!formData.document_type}
            placeholder={
              formData.document_type === 'CPF' ? '000.000.000-00' :
              formData.document_type === 'CNPJ' ? '00.000.000/0000-00' : ''
            }
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="CEP"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        {/* Linha 3: Endereço */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Endereço"
            name="address"
            value={formData.address}
            onChange={handleChange}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cidade"
            name="city"
            value={formData.city}
            onChange={handleChange}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Estado"
            name="state"
            value={formData.state}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        {/* Linha 4: Informações Comerciais */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Categoria"
            name="category"
            value={formData.category}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="bronze">Bronze</MenuItem>
            <MenuItem value="prata">Prata</MenuItem>
            <MenuItem value="ouro">Ouro</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Formato"
            name="service_format"
            value={formData.service_format}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="recorrente">Recorrente</MenuItem>
            <MenuItem value="avulso">Avulso</MenuItem>
            <MenuItem value="personalizado">Personalizado</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Ticket Médio"
            name="average_ticket"
            type="number"
            value={formData.average_ticket}
            onChange={handleChange}
            inputProps={{ min: 0, step: 0.01 }}
            size="small"
          />
        </Grid>
        {/* Status - só aparece ao editar */}
        {isEditing && (
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              name="is_active"
              value={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
              size="small"
            >
              <MenuItem value={true}>Ativo</MenuItem>
              <MenuItem value={false}>Inativo</MenuItem>
            </TextField>
          </Grid>
        )}

        {/* Linha 5: Observações */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Observações"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
            size="small"
          />
        </Grid>
      </Grid>

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

export default ClientFormModal;