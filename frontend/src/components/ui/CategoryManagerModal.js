import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useProductCategories } from '../../hooks/useProductCategories';

const CategoryManagerModal = ({ open, onClose }) => {
  const { 
    categories, 
    addCategory, 
    removeCategory, 
    updateCategory, 
    resetToDefault 
  } = useProductCategories();

  const [newCategory, setNewCategory] = useState({
    label: '',
    color: 'default'
  });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const colorOptions = [
    { value: 'default', label: 'Padrão' },
    { value: 'primary', label: 'Azul' },
    { value: 'secondary', label: 'Roxo' },
    { value: 'success', label: 'Verde' },
    { value: 'warning', label: 'Laranja' },
    { value: 'error', label: 'Vermelho' },
    { value: 'info', label: 'Azul Claro' }
  ];

  const handleAddCategory = async () => {
    if (!newCategory.label.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    try {
      await addCategory(newCategory);
      setNewCategory({ label: '', color: 'default' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveCategory = (categoryValue) => {
    if (window.confirm('Tem certeza que deseja remover esta categoria?')) {
      removeCategory(categoryValue);
    }
  };

  const handleUpdateCategory = (categoryValue, updates) => {
    updateCategory(categoryValue, updates);
    setEditingId(null);
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar para as categorias padrão? Suas categorias personalizadas serão perdidas.')) {
      resetToDefault();
    }
  };

  const handleClose = () => {
    setNewCategory({ label: '', color: 'default' });
    setError('');
    setEditingId(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Gerenciar Categorias de Produtos</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Adicionar Nova Categoria */}
        <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>
            Adicionar Nova Categoria
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
            <TextField
              label="Nome da Categoria"
              value={newCategory.label}
              onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Cor</InputLabel>
              <Select
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                label="Cor"
              >
                {colorOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        size="small" 
                        color={option.value === 'default' ? undefined : option.value}
                        label={option.label}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCategory}
              sx={{ minWidth: 120 }}
            >
              Adicionar
            </Button>
          </Box>
        </Box>

        {/* Lista de Categorias */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>
            Categorias Existentes ({categories.length})
          </Typography>

          <List>
            {categories.map((category) => (
              <ListItem 
                key={category.value}
                sx={{ 
                  border: '1px solid #f0f0f0',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: editingId === category.value ? '#f8f9fa' : 'white'
                }}
              >
                {editingId === category.value ? (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                    <TextField
                      size="small"
                      value={category.label}
                      onChange={(e) => handleUpdateCategory(category.value, { label: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={category.color}
                        onChange={(e) => handleUpdateCategory(category.value, { color: e.target.value })}
                      >
                        {colorOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button size="small" onClick={() => setEditingId(null)}>
                      Salvar
                    </Button>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={category.label}
                            color={category.color === 'default' ? undefined : category.color}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({category.value})
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => setEditingId(category.value)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveCategory(category.value)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>

          {categories.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nenhuma categoria encontrada
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="warning">
          Resetar Padrão
        </Button>
        <Button onClick={handleClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryManagerModal;