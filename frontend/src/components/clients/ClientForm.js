import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { clientAPI } from '../../services/api';
import MainLayout from '../Layout/MainLayout';

const ClientForm = ({ clientId, onNavigate, onBack }) => {
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
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isEditing = Boolean(clientId);

  useEffect(() => {
    if (isEditing) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientAPI.getClientById(clientId);
      const client = response.data.client;
      
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
    } catch (error) {
      setError('Erro ao carregar dados do cliente');
      console.error('Erro ao carregar cliente:', error);
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
    
    if (error) setError(null);
    if (success) setSuccess(false);
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
      setSaving(true);
      setError(null);

      // Limpar dados vazios
      const cleanData = {};
      Object.keys(formData).forEach(key => {
        if (key === 'average_ticket') {
          // Para campos numéricos
          cleanData[key] = parseFloat(formData[key]) || 0;
        } else if (['category', 'service_format'].includes(key)) {
          // Para campos obrigatórios
          cleanData[key] = formData[key];
        } else if (formData[key]?.trim()) {
          cleanData[key] = formData[key].trim();
        }
      });

      if (isEditing) {
        await clientAPI.updateClient(clientId, cleanData);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        await clientAPI.createClient(cleanData);
        setSuccess('Cliente criado com sucesso!');
      }

      setTimeout(() => {
        onNavigate('clients');
      }, 1500);

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar cliente');
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Clientes', onClick: () => onNavigate('clients') },
    { label: isEditing ? 'Editar Cliente' : 'Novo Cliente' }
  ];

  const headerActions = (
    <Button
      variant="contained"
      startIcon={<SaveIcon />}
      onClick={handleSubmit}
      disabled={saving}
      form="client-form"
      type="submit"
    >
      {saving ? <CircularProgress size={20} /> : (isEditing ? 'Atualizar' : 'Salvar')}
    </Button>
  );

  if (loading) {
    return (
      <MainLayout
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        breadcrumbs={breadcrumbs}
        currentPage="client-form"
        onNavigate={onNavigate}
        showBackButton={true}
        onBack={onBack}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
      breadcrumbs={breadcrumbs}
      currentPage="client-form"
      onNavigate={onNavigate}
      showBackButton={true}
      onBack={onBack}
      headerActions={headerActions}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" id="client-form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Informações Básicas */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Informações Básicas
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>

              {/* Documentos */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <BusinessIcon />
                  Documentação
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Documento"
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleDocumentTypeChange}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="CPF">CPF</MenuItem>
                  <MenuItem value="CNPJ">CNPJ</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label={
                    formData.document_type === 'CPF' ? 'CPF' :
                    formData.document_type === 'CNPJ' ? 'CNPJ' : 'Documento'
                  }
                  name="document"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  disabled={!formData.document_type}
                  placeholder={
                    formData.document_type === 'CPF' ? '000.000.000-00' :
                    formData.document_type === 'CNPJ' ? '00.000.000/0000-00' : ''
                  }
                />
              </Grid>

              {/* Endereço */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Endereço
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Estado"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CEP"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                />
              </Grid>

              {/* Categorização e Serviços */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Categorização e Serviços
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Categoria do Cliente"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <MenuItem value="bronze">🥉 Bronze</MenuItem>
                  <MenuItem value="prata">🥈 Prata</MenuItem>
                  <MenuItem value="ouro">🥇 Ouro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Formato do Serviço"
                  name="service_format"
                  value={formData.service_format}
                  onChange={handleChange}
                >
                  <MenuItem value="recorrente">🔄 Recorrente</MenuItem>
                  <MenuItem value="avulso">📝 Avulso</MenuItem>
                  <MenuItem value="personalizado">⚙️ Personalizado</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ticket Médio (R$)"
                  name="average_ticket"
                  type="number"
                  value={formData.average_ticket}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0,00"
                />
              </Grid>

              {/* Status - só aparece ao editar */}
              {isEditing && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Status do Cliente"
                    name="is_active"
                    value={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  >
                    <MenuItem value={true}>✅ Ativo</MenuItem>
                    <MenuItem value={false}>❌ Inativo</MenuItem>
                  </TextField>
                </Grid>
              )}

              {/* Observações */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ClientForm;