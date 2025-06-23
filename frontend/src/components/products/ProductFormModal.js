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
  Chip,
  Typography,
  InputAdornment
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useProductCategories } from '../../hooks/useProductCategories';
import CategoryManagerModal from '../ui/CategoryManagerModal';

const ProductFormModal = ({ open, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    average_ticket: '',
    status: 'ativo'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const { categories } = useProductCategories();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        tags: product.tags || '',
        average_ticket: product.average_ticket || '',
        status: product.status || 'ativo'
      });
      
      // Processar tags
      if (product.tags) {
        setTags(product.tags.split(',').map(tag => tag.trim()).filter(Boolean));
      }
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        tags: '',
        average_ticket: '',
        status: 'ativo'
      });
      setTags([]);
    }
    setError('');
  }, [product, open]);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleTagsChange = (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      tags: value
    });
    
    // Processar tags em tempo real
    if (value) {
      const tagList = value.split(',').map(tag => tag.trim()).filter(Boolean);
      setTags(tagList);
    } else {
      setTags([]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (formData.average_ticket && parseFloat(formData.average_ticket) < 0) {
      setError('Ticket médio deve ser um valor positivo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        average_ticket: formData.average_ticket ? parseFloat(formData.average_ticket) : 0,
        tags: tags.join(',')
      };

      if (product) {
        await api.put(`/products/${product.id}`, submitData);
      } else {
        await api.post('/products', submitData);
      }

      onSave();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setError(error.response?.data?.message || 'Erro ao salvar produto');
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
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
          {product ? 'Editar Produto' : 'Novo Produto'}
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
            {/* Nome */}
            <TextField
              label="Nome do Produto/Serviço"
              variant="outlined"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={loading}
              helperText="Nome que identifica o produto ou serviço"
            />

            {/* Descrição */}
            <TextField
              label="Descrição"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange('description')}
              disabled={loading}
              helperText="Descrição detalhada do produto ou serviço"
            />

            {/* Categoria e Ticket Médio */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.category}
                    label="Categoria"
                    onChange={handleInputChange('category')}
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Selecione uma categoria</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            size="small" 
                            label={category.label}
                            color={category.color === 'default' ? undefined : category.color}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setCategoryModalOpen(true)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Gerenciar Categorias
                </Button>
              </Box>

              <TextField
                label="Ticket Médio Estimado"
                variant="outlined"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.average_ticket}
                onChange={handleInputChange('average_ticket')}
                disabled={loading}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                helperText="Valor médio esperado deste produto/serviço"
              />
            </Box>

            {/* Tags */}
            <Box>
              <TextField
                label="Tags"
                variant="outlined"
                fullWidth
                value={formData.tags}
                onChange={handleTagsChange}
                disabled={loading}
                helperText="Separe as tags por vírgula (ex: seo, marketing, digital)"
                placeholder="marketing, digital, seo"
              />
              
              {tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Status */}
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleInputChange('status')}
                disabled={loading}
              >
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </Select>
            </FormControl>
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
              product ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </DialogActions>
      </form>

      {/* Modal de Gerenciamento de Categorias */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />
    </Dialog>
  );
};

export default ProductFormModal;