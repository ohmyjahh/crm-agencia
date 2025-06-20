import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Fab,
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
} from '@mui/icons-material';
import { clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
        active: 'all' // Mostrar todos para admin
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

  if (loading && clients.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os clientes da sua agência
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onNavigate('client-form')}
          size="large"
        >
          Novo Cliente
        </Button>
      </Box>

      {/* Busca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            placeholder="Buscar por nome, email ou documento..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {client.document_type === 'CNPJ' ? (
                        <BusinessIcon color="primary" />
                      ) : (
                        <PersonIcon color="primary" />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {client.name}
                        </Typography>
                        {client.email && (
                          <Typography variant="caption" color="text.secondary">
                            {client.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {client.document ? (
                      <Box>
                        <Typography variant="body2">
                          {formatDocument(client.document, client.document_type)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.document_type}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {client.phone ? (
                      <Typography variant="body2">{client.phone}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={client.is_active ? 'Ativo' : 'Inativo'}
                      color={client.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, client)}
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

      {/* Paginação */}
      {pagination.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.total_pages}
            page={pagination.current_page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Menu de ações */}
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
          <MenuItem onClick={handleDeleteOpen}>
            {selectedClient?.is_active ? (
              <>
                <DeleteIcon sx={{ mr: 1 }} />
                Desativar
              </>
            ) : (
              <>
                <RestoreIcon sx={{ mr: 1 }} />
                Reativar
              </>
            )}
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de confirmação */}
      <Dialog open={deleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>
          {selectedClient?.is_active ? 'Desativar Cliente' : 'Reativar Cliente'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedClient?.is_active
              ? `Tem certeza que deseja desativar o cliente "${selectedClient?.name}"?`
              : `Tem certeza que deseja reativar o cliente "${selectedClient?.name}"?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color={selectedClient?.is_active ? 'error' : 'primary'}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {loading && clients.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default ClientList;