import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  DialogActions,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  MonetizationOn as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const ClientViewModal = ({ client, onEdit, onClose }) => {
  const formatDocument = (document, type) => {
    if (!document) return '-';
    
    if (type === 'CPF') {
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (type === 'CNPJ') {
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return document;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ouro': return '🥇';
      case 'prata': return '🥈';
      case 'bronze': return '🥉';
      default: return '🥉';
    }
  };

  const getServiceFormatIcon = (format) => {
    switch (format) {
      case 'recorrente': return '🔄';
      case 'personalizado': return '⚙️';
      case 'avulso': return '📝';
      default: return '📝';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header do Cliente */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64 }}>
          {client.document_type === 'CNPJ' ? (
            <BusinessIcon sx={{ fontSize: 32 }} />
          ) : (
            <PersonIcon sx={{ fontSize: 32 }} />
          )}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {client.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {client.document_type} • {client.city || 'Cidade não informada'}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={client.is_active ? 'Ativo' : 'Inativo'}
              color={client.is_active ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informações de Contato */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="primary" />
                Contato
              </Typography>
              <Box sx={{ space: 2 }}>
                {client.email ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">{client.email}</Typography>
                  </Box>
                ) : null}
                
                {client.phone ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">{client.phone}</Typography>
                  </Box>
                ) : null}
                
                {!client.email && !client.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma informação de contato
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Documentação */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Documentação
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tipo de Documento
              </Typography>
              <Typography variant="body1" gutterBottom>
                {client.document_type || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Número do Documento
              </Typography>
              <Typography variant="body1">
                {formatDocument(client.document, client.document_type)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Endereço */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                Endereço
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body2" color="text.secondary">
                    Endereço Completo
                  </Typography>
                  <Typography variant="body1">
                    {client.address || 'Não informado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    CEP
                  </Typography>
                  <Typography variant="body1">
                    {client.zip_code || 'Não informado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cidade
                  </Typography>
                  <Typography variant="body1">
                    {client.city || 'Não informado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Typography variant="body1">
                    {client.state || 'Não informado'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Categorização e Negócio */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="primary" />
                Categorização
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Categoria do Cliente
                </Typography>
                <Chip
                  label={`${getCategoryIcon(client.category)} ${
                    client.category === 'bronze' ? 'Bronze' :
                    client.category === 'prata' ? 'Prata' :
                    client.category === 'ouro' ? 'Ouro' : 'Bronze'
                  }`}
                  color={
                    client.category === 'ouro' ? 'warning' :
                    client.category === 'prata' ? 'info' : 'default'
                  }
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Formato do Serviço
                </Typography>
                <Chip
                  label={`${getServiceFormatIcon(client.service_format)} ${
                    client.service_format === 'recorrente' ? 'Recorrente' :
                    client.service_format === 'personalizado' ? 'Personalizado' :
                    'Avulso'
                  }`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Informações Financeiras */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="primary" />
                Informações Financeiras
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ticket Médio
              </Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                R$ {client.average_ticket ? parseFloat(client.average_ticket).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) : '0,00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Observações */}
        {client.notes && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon color="primary" />
                  Observações
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {client.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Informações do Sistema */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
            <Typography variant="caption">
              Cadastrado em: {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
            </Typography>
            <Typography variant="caption">
              Por: {client.created_by_name || 'Sistema'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <DialogActions sx={{ mt: 3, px: 0 }}>
        <Button onClick={onClose}>
          Fechar
        </Button>
        <Button 
          variant="contained"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Editar Cliente
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ClientViewModal;