import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as TagIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ProductViewModal = ({ open, onClose, product, onEdit }) => {
  const { user } = useAuth();

  if (!product) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'success';
      case 'inativo':
        return 'default';
      default:
        return 'default';
    }
  };

  const tags = product.tags ? product.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
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
          Detalhes do Produto
        </Typography>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informações Básicas
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {product.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    color={getStatusColor(product.status)}
                    size="small"
                  />
                </Box>
              </Box>

              {product.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body1">
                    {product.description}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Categoria e Valor */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Categoria
                </Typography>
              </Box>
              
              {product.category ? (
                <Chip 
                  label={product.category} 
                  variant="outlined"
                  size="medium"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma categoria definida
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Ticket Médio
                </Typography>
              </Box>
              
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {formatCurrency(product.average_ticket)}
              </Typography>
            </Paper>
          </Grid>

          {/* Tags */}
          {tags.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TagIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Tags
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      variant="outlined"
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Informações do Sistema */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Informações do Sistema
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Criado em:
                </Typography>
                <Typography variant="body2">
                  {formatDate(product.created_at)}
                </Typography>
              </Grid>
              
              {product.updated_at && product.updated_at !== product.created_at && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Última atualização:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(product.updated_at)}
                  </Typography>
                </Grid>
              )}
              
              {product.created_by_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Criado por:
                  </Typography>
                  <Typography variant="body2">
                    {product.created_by_name}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} size="large">
          Fechar
        </Button>
        
        {user?.role === 'administrador' && (
          <Button 
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => onEdit(product)}
            size="large"
          >
            Editar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProductViewModal;