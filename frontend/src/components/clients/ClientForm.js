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
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { clientAPI } from '../../services/api';

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
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isEditing = Boolean(clientId);

  // Carregar dados do cliente se for edição
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
        notes: client.notes || ''
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
    
    // Limpar mensagens quando usuário digitar
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const formatDocument = (value, type) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'CPF') {
      // Máximo 11 dígitos
      const truncated = numbers.substring(0, 11);
      // Aplica máscara CPF: 000.000.000-00
      return truncated.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (type === 'CNPJ') {
      // Máximo 14 dígitos
      const truncated = numbers.substring(0, 14);
      // Aplica máscara CNPJ: 00.000.000/0000-00
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
      document: '' // Limpa documento ao trocar tipo
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

      // Preparar dados (remover campos vazios)
      const dataToSend = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key]?.trim();
        if (value) {
          dataToSend[key] = value;
        }
      });

      let response;
      if (isEditing) {
        response = await clientAPI.updateClient(clientId, dataToSend);
      } else {
        response = await clientAPI.createClient(dataToSend);
      }

      setSuccess(true);
      
      // Redirect após 2 segundos
      setTimeout(() => {
        onNavigate('clients');
      }, 2000);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao salvar cliente';
      setError(errorMessage);
      console.error('Erro ao salvar cliente:', error);
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
            onClick={() => onNavigate('clients')}
            sx={{ textDecoration: 'none' }}
          >
            Clientes
          </Link>
          <Typography variant="body2" color="text.primary">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => onNavigate('clients')}
          variant="outlined"
        >
          Voltar
        </Button>
        
        <Box>
          <Typography variant="h4" component="h1">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente'}
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
          Cliente {isEditing ? 'atualizado' : 'cadastrado'} com sucesso! Redirecionando...
        </Alert>
      )}

      {/* Formulário */}
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Nome */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </Grid>

            {/* Email e Telefone */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={saving}
                placeholder="(11) 99999-9999"
              />
            </Grid>

            {/* Tipo de Documento */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Tipo de Documento"
                name="document_type"
                value={formData.document_type}
                onChange={handleDocumentTypeChange}
                disabled={saving}
              >
                <MenuItem value="">
                  <em>Selecione</em>
                </MenuItem>
                <MenuItem value="CPF">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    CPF
                  </Box>
                </MenuItem>
                <MenuItem value="CNPJ">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" />
                    CNPJ
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Documento */}
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
                disabled={saving || !formData.document_type}
                placeholder={
                  formData.document_type === 'CPF' ? '000.000.000-00' :
                  formData.document_type === 'CNPJ' ? '00.000.000/0000-00' : ''
                }
              />
            </Grid>

            {/* Endereço */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={2}
              />
            </Grid>

            {/* Cidade, Estado e CEP */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Cidade"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estado"
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="CEP"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                disabled={saving}
                placeholder="00000-000"
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={4}
                placeholder="Informações adicionais sobre o cliente..."
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => onNavigate('clients')}
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
                  {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Cadastrar')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ClientForm;