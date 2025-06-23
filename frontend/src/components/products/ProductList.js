import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import MainLayout from '../Layout/MainLayout';
import ProductFormModal from './ProductFormModal';
import ProductViewModal from './ProductViewModal';
import EditableStatus from '../ui/EditableStatus';
import { useProductCategories } from '../../hooks/useProductCategories';

const ProductList = ({ onNavigate }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados dos modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Estados de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Hook para categorias dinâmicas
  const { categories: dynamicCategories, getCategoryColor } = useProductCategories();

  // Estado para loading de status updates
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);

  // Configurações de status padrão para produtos
  const productStatusOptions = [
    { value: 'ativo', label: 'Ativo', color: 'success', icon: <ActiveIcon fontSize="small" /> },
    { value: 'inativo', label: 'Inativo', color: 'default', icon: <InactiveIcon fontSize="small" /> }
  ];

  // Converter categorias dinâmicas para o formato esperado pelo EditableStatus
  const productCategoryOptions = dynamicCategories.map(category => ({
    value: category.value,
    label: category.label,
    color: category.color,
    icon: <CategoryIcon fontSize="small" />
  }));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter })
      };
      
      const response = await api.get('/products', { params });
      setProducts(response.data.data);
      setTotalCount(response.data.meta.total);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, searchTerm, statusFilter, categoryFilter]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleCategoryFilter = (event) => {
    setCategoryFilter(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setFormModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormModalOpen(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      setSuccess('Produto deletado com sucesso');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      setError(error.response?.data?.message || 'Erro ao deletar produto');
    }
  };

  const handleModalClose = () => {
    setFormModalOpen(false);
    setViewModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductSaved = () => {
    fetchProducts();
    handleModalClose();
    setSuccess('Produto salvo com sucesso');
  };

  // Função para atualizar status do produto
  const handleStatusChange = async (product, field, newValue) => {
    try {
      setStatusUpdateLoading(product.id);
      
      // Preparar dados de atualização
      const updateData = { [field]: newValue };
      
      // Fazer update do produto
      await api.put(`/products/${product.id}`, updateData);
      
      // Recarregar a lista
      await fetchProducts();
      
      setSuccess(`${field === 'status' ? 'Status' : 'Categoria'} atualizado com sucesso`);
      
    } catch (error) {
      console.error(`Erro ao atualizar ${field} do produto:`, error);
      setError(`Erro ao atualizar ${field} do produto`);
    } finally {
      setStatusUpdateLoading(null);
    }
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <MainLayout currentPage="products" onNavigate={onNavigate}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Produtos & Serviços
          </Typography>
          {user?.role === 'administrador' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateProduct}
              size="large"
            >
              Novo Produto
            </Button>
          )}
        </Box>

        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Buscar produtos"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilter}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryFilter}
                label="Categoria"
                onChange={handleCategoryFilter}
              >
                <MenuItem value="">Todas</MenuItem>
                {dynamicCategories.map((category) => (
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
          </Box>
        </Paper>

        {/* Tabela */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Ticket Médio</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nenhum produto encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {product.description.length > 50 
                              ? `${product.description.substring(0, 50)}...` 
                              : product.description
                            }
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <EditableStatus
                        value={product.category || 'servico'}
                        onChange={(newValue) => handleStatusChange(product, 'category', newValue)}
                        options={productCategoryOptions}
                        loading={statusUpdateLoading === product.id}
                        statusType="product_category"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(product.average_ticket)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <EditableStatus
                        value={product.status || 'ativo'}
                        onChange={(newValue) => handleStatusChange(product, 'status', newValue)}
                        options={productStatusOptions}
                        loading={statusUpdateLoading === product.id}
                        statusType="product_status"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(product.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Visualizar">
                          <IconButton
                            size="small"
                            onClick={() => handleViewProduct(product)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {user?.role === 'administrador' && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleEditProduct(product)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Deletar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </TableContainer>

        {/* Modais */}
        <ProductFormModal
          open={formModalOpen}
          onClose={handleModalClose}
          onSave={handleProductSaved}
          product={selectedProduct}
        />
        
        <ProductViewModal
          open={viewModalOpen}
          onClose={handleModalClose}
          product={selectedProduct}
          onEdit={handleEditProduct}
        />
      </Box>
    </MainLayout>
  );
};

export default ProductList;