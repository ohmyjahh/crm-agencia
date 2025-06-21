import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  CircularProgress,
  Alert,
  Card,
  Avatar,
  Stack,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../Layout/MainLayout';

const ClientList = ({ onNavigate }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    per_page: 10
  });
  
  // Menu e dialogs
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { isAdmin } = useAuth();

  const loadClients = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        search: searchTerm.trim() || undefined,
        active: 'all'
      };

      const response = await clientAPI.getClients(params);
      setClients(response.data.clients);
      setPagination(response.data.pagination);
    } catch (error) {
      setError('Erro ao carregar clientes');
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadClients(1, search);
  };

  const handlePageChange = (event, page) => {
    loadClients(page);
  };

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleView = () => {
    handleMenuClose();
    onNavigate('client-details', { clientId: selectedClient.id });
  };

  const handleEdit = () => {
    handleMenuClose();
    onNavigate('client-form', { clientId: selectedClient.id });
  };

  const handleDeleteOpen = () => {
    handleMenuClose();
    setDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialog(false);
    setSelectedClient(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      
      if (selectedClient.is_active) {
        await clientAPI.deleteClient(selectedClient.id);
      } else {
        await clientAPI.activateClient(selectedClient.id);
      }
      
      await loadClients(pagination.current_page);
      handleDeleteClose();
    } catch (error) {
      setError('Erro ao alterar status do cliente');
      console.error('Erro ao alterar status do cliente:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDocument = (document, type) => {
    if (!document) return '-';
    
    if (type === 'CPF') {
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (type === 'CNPJ') {
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return document;
  };

  const breadcrumbs = [
    { label: 'Clientes', onClick: () => onNavigate('clients') }
  ];

  const headerActions = (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={() => alert('Filtros em breve')}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        Filtros
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => onNavigate('client-form')}
      >
        Novo Cliente
      </Button>
    </Stack>
  );

  return (
    <MainLayout
      title="Gestão de Clientes"
      breadcrumbs={breadcrumbs}
      currentPage="clients"
      onNavigate={onNavigate}
      headerActions={headerActions}
    >
      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <BusinessIcon color="primary" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {pagination.total_records}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Clientes
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <PersonIcon color="success" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {clients.filter(c => c.is_active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clientes Ativos
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Buscar Clientes
          </Typography>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <TextField
              fullWidth
              placeholder="Buscar por nome, email, telefone ou documento..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button type="submit" variant="contained" size="small">
                      Buscar
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Clients Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum cliente encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {client.document_type === 'CNPJ' ? (
                            <BusinessIcon color="primary" />
                          ) : (
                            <PersonIcon color="primary" />
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {client.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {client.document_type} • {client.city || 'Cidade não informada'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        {client.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{client.email}</Typography>
                          </Box>
                        )}
                        {client.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{client.phone}</Typography>
                          </Box>
                        )}
                        {!client.email && !client.phone && (
                          <Typography variant="body2" color="text.secondary">
                            Sem contato
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDocument(client.document, client.document_type)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={client.is_active ? 'Ativo' : 'Inativo'}
                        color={client.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, client)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination.total_pages}
              page={pagination.current_page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
            {selectedClient?.is_active ? (
              <>
                <DeleteIcon sx={{ mr: 1 }} />
                Desativar
              </>
            ) : (
              <>
                <RestoreIcon sx={{ mr: 1 }} />
                Ativar
              </>
            )}
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>
          {selectedClient?.is_active ? 'Desativar Cliente' : 'Ativar Cliente'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedClient?.is_active 
              ? `Tem certeza que deseja desativar o cliente "${selectedClient?.name}"?`
              : `Tem certeza que deseja ativar o cliente "${selectedClient?.name}"?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancelar</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color={selectedClient?.is_active ? 'error' : 'success'}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default ClientList;