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
  FormControl,
  InputLabel,
  Select,
  Drawer,
  Divider,
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
  Close as CloseIcon,
  Clear as ClearIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../Layout/MainLayout';
import ClientFormModal from './ClientFormModal';
import ClientViewModal from './ClientViewModal';

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

  // Filtros
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    service_format: 'all',
    document_type: 'all'
  });
  
  // Status toggle loading
  const [toggleLoading, setToggleLoading] = useState(null);
  
  // Import/Export states
  const [importDialog, setImportDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    status: 'all',
    category: 'all',
    service_format: 'all',
    document_type: 'all',
    min_ticket: '',
    max_ticket: '',
    start_date: '',
    end_date: '',
    city: '',
    state: '',
    format: 'xlsx'
  });

  // Client modal states
  const [clientFormDialog, setClientFormDialog] = useState(false);
  const [clientViewDialog, setClientViewDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [clientFormLoading, setClientFormLoading] = useState(false);

  const { isAdmin } = useAuth();

  const loadClients = async (page = 1, searchTerm = search, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        search: searchTerm.trim() || undefined,
        active: currentFilters.status === 'all' ? 'all' : currentFilters.status,
        category: currentFilters.category === 'all' ? undefined : currentFilters.category,
        service_format: currentFilters.service_format === 'all' ? undefined : currentFilters.service_format,
        document_type: currentFilters.document_type === 'all' ? undefined : currentFilters.document_type
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
    loadClients(1, search, filters);
  };

  const handlePageChange = (event, page) => {
    loadClients(page, search, filters);
  };

  // Funções dos filtros
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    loadClients(1, search, filters);
    setFilterDrawer(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: 'all',
      category: 'all',
      service_format: 'all',
      document_type: 'all'
    };
    setFilters(clearedFilters);
    loadClients(1, search, clearedFilters);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== 'all');
  };

  // Import/Export functions
  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/json' // .json
      ];
      
      if (allowedTypes.includes(file.type)) {
        setImportFile(file);
      } else {
        setError('Formato de arquivo não suportado. Use Excel (.xlsx, .xls), CSV (.csv) ou JSON (.json)');
      }
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      setError('Selecione um arquivo para importar');
      return;
    }

    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await clientAPI.importClients(formData);
      
      setImportDialog(false);
      setImportFile(null);
      await loadClients(1, search, filters);
      
      // Show success message
      setError(null);
      alert(`Importação concluída! ${response.data.imported} clientes importados com sucesso.`);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao importar clientes');
      console.error('Erro ao importar clientes:', error);
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportFilterChange = (field, value) => {
    setExportFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExportSubmit = async () => {
    try {
      setExportLoading(true);
      setError(null);
      
      console.log('🚀 Iniciando exportação com filtros:', exportFilters);
      
      // Preparar parâmetros removendo valores vazios e 'all'
      const cleanParams = {};
      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value !== '' && value !== 'all') {
          cleanParams[key] = value;
        }
      });

      console.log('📋 Parâmetros limpos para exportação:', cleanParams);

      const response = await clientAPI.exportClients(cleanParams);
      
      console.log('✅ Resposta recebida:', response);
      
      // Verificar se é realmente um blob ou se é um erro
      if (response.data instanceof Blob) {
        // Se o blob é muito pequeno, pode ser um JSON de erro
        if (response.data.size < 100) {
          const text = await response.data.text();
          try {
            const jsonError = JSON.parse(text);
            throw new Error(jsonError.error || 'Erro na exportação');
          } catch (parseError) {
            // Se não conseguir fazer parse, continua com o download
          }
        }
        
        // Create download link
        const blob = new Blob([response.data], {
          type: exportFilters.format === 'xlsx' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : exportFilters.format === 'csv'
            ? 'text/csv'
            : 'application/json'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_export_${new Date().toISOString().split('T')[0]}.${exportFilters.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('📥 Download iniciado com sucesso');
        setExportDialog(false);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error) {
      console.error('❌ Erro completo ao exportar clientes:', error);
      
      // Tratar diferentes tipos de erro
      if (error.response) {
        // Erro HTTP
        if (error.response.status === 404) {
          setError('Nenhum cliente encontrado com os filtros aplicados');
        } else if (error.response.data) {
          // Se response.data é um blob, converter para texto
          if (error.response.data instanceof Blob) {
            try {
              const text = await error.response.data.text();
              const jsonError = JSON.parse(text);
              setError(jsonError.error || `Erro ${error.response.status}`);
            } catch {
              setError(`Erro do servidor: ${error.response.status} - ${error.response.statusText}`);
            }
          } else if (typeof error.response.data === 'object' && error.response.data.error) {
            setError(error.response.data.error);
          } else {
            setError(`Erro do servidor: ${error.response.status} - ${error.response.statusText}`);
          }
        } else {
          setError(`Erro do servidor: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        // Erro de rede
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        // Outro erro
        setError(error.message || 'Erro desconhecido ao exportar clientes');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleQuickStatusToggle = async (client) => {
    try {
      setToggleLoading(client.id);
      
      if (client.is_active) {
        await clientAPI.deleteClient(client.id);
      } else {
        await clientAPI.activateClient(client.id);
      }
      
      // Recarregar a lista mantendo os filtros atuais
      await loadClients(pagination.current_page, search, filters);
      
    } catch (error) {
      setError('Erro ao alterar status do cliente');
      console.error('Erro ao alterar status do cliente:', error);
    } finally {
      setToggleLoading(null);
    }
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
    setViewingClient(selectedClient);
    setClientViewDialog(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditingClient(selectedClient);
    setClientFormDialog(true);
    handleMenuClose();
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setClientFormDialog(true);
  };

  const handleClientFormClose = () => {
    setClientFormDialog(false);
    setEditingClient(null);
  };

  const handleClientViewClose = () => {
    setClientViewDialog(false);
    setViewingClient(null);
  };

  const handleClientSaved = () => {
    // Recarregar lista de clientes
    loadClients(pagination.current_page, search, filters);
    handleClientFormClose();
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

  const headerActions = null; // Remove ações do header

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

      {/* Action Buttons */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ações Rápidas
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewClient}
              color="primary"
            >
              Novo Cliente
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setImportDialog(true)}
            >
              Importar Clientes
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialog(true)}
            >
              Exportar Clientes
            </Button>
            <Button
              variant={hasActiveFilters() ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawer(true)}
              color={hasActiveFilters() ? "primary" : "inherit"}
            >
              Filtros {hasActiveFilters() && `(${Object.values(filters).filter(v => v !== 'all').length})`}
            </Button>
          </Stack>
        </Box>
      </Card>

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
                <TableCell>Categoria</TableCell>
                <TableCell>Formato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                        label={
                          client.category === 'bronze' ? '🥉 Bronze' :
                          client.category === 'prata' ? '🥈 Prata' :
                          client.category === 'ouro' ? '🥇 Ouro' : 'Bronze'
                        }
                        color={
                          client.category === 'ouro' ? 'warning' :
                          client.category === 'prata' ? 'info' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={
                          client.service_format === 'recorrente' ? '🔄 Recorrente' :
                          client.service_format === 'personalizado' ? '⚙️ Personalizado' :
                          '📝 Avulso'
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Chip
                          label={client.is_active ? 'Ativo' : 'Inativo'}
                          color={client.is_active ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleQuickStatusToggle(client)}
                          disabled={toggleLoading === client.id}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                        {toggleLoading === client.id && (
                          <CircularProgress 
                            size={16} 
                            sx={{ 
                              position: 'absolute', 
                              top: '50%', 
                              left: '50%', 
                              transform: 'translate(-50%, -50%)',
                              zIndex: 1
                            }} 
                          />
                        )}
                      </Box>
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

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawer}
        onClose={() => setFilterDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: 320, p: 0 } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setFilterDrawer(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            {/* Status Filter */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="true">Ativos</MenuItem>
                <MenuItem value="false">Inativos</MenuItem>
              </Select>
            </FormControl>

            {/* Category Filter */}
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={filters.category}
                label="Categoria"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="bronze">🥉 Bronze</MenuItem>
                <MenuItem value="prata">🥈 Prata</MenuItem>
                <MenuItem value="ouro">🥇 Ouro</MenuItem>
              </Select>
            </FormControl>

            {/* Service Format Filter */}
            <FormControl fullWidth>
              <InputLabel>Formato do Serviço</InputLabel>
              <Select
                value={filters.service_format}
                label="Formato do Serviço"
                onChange={(e) => handleFilterChange('service_format', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="recorrente">🔄 Recorrente</MenuItem>
                <MenuItem value="avulso">📝 Avulso</MenuItem>
                <MenuItem value="personalizado">⚙️ Personalizado</MenuItem>
              </Select>
            </FormControl>

            {/* Document Type Filter */}
            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={filters.document_type}
                label="Tipo de Documento"
                onChange={(e) => handleFilterChange('document_type', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="CPF">CPF</MenuItem>
                <MenuItem value="CNPJ">CNPJ</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleApplyFilters}
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              disabled={!hasActiveFilters()}
            >
              Limpar Filtros
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Import Dialog */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar Clientes</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Selecione um arquivo para importar clientes. Formatos suportados: Excel (.xlsx, .xls), CSV (.csv) ou JSON (.json).
          </DialogContentText>
          
          <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', mb: 2 }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
              id="import-file-input"
            />
            <label htmlFor="import-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                sx={{ mb: 2 }}
              >
                Selecionar Arquivo
              </Button>
            </label>
            
            {importFile && (
              <Box>
                <Typography variant="body2" color="success.main">
                  ✅ {importFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(importFile.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}
            
            {!importFile && (
              <Typography variant="body2" color="text.secondary">
                Arraste e solte um arquivo aqui ou clique para selecionar
              </Typography>
            )}
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Formato esperado:</strong> O arquivo deve conter as colunas: Nome, Email, Telefone, Documento, Tipo de Documento, Endereço, Cidade, Estado, CEP, Categoria, Formato do Serviço, Ticket Médio.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleImportSubmit}
            variant="contained"
            disabled={!importFile || importLoading}
            startIcon={importLoading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {importLoading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Exportar Clientes</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Configure os filtros para personalizar quais clientes serão exportados.
          </DialogContentText>
          
          <Grid container spacing={3}>
            {/* Status Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={exportFilters.status}
                  label="Status"
                  onChange={(e) => handleExportFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="true">Ativos</MenuItem>
                  <MenuItem value="false">Inativos</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={exportFilters.category}
                  label="Categoria"
                  onChange={(e) => handleExportFilterChange('category', e.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="bronze">🥉 Bronze</MenuItem>
                  <MenuItem value="prata">🥈 Prata</MenuItem>
                  <MenuItem value="ouro">🥇 Ouro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Service Format Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Formato do Serviço</InputLabel>
                <Select
                  value={exportFilters.service_format}
                  label="Formato do Serviço"
                  onChange={(e) => handleExportFilterChange('service_format', e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="recorrente">🔄 Recorrente</MenuItem>
                  <MenuItem value="avulso">📝 Avulso</MenuItem>
                  <MenuItem value="personalizado">⚙️ Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Document Type Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={exportFilters.document_type}
                  label="Tipo de Documento"
                  onChange={(e) => handleExportFilterChange('document_type', e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="CPF">CPF</MenuItem>
                  <MenuItem value="CNPJ">CNPJ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Ticket Range */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ticket Mínimo (R$)"
                type="number"
                value={exportFilters.min_ticket}
                onChange={(e) => handleExportFilterChange('min_ticket', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ticket Máximo (R$)"
                type="number"
                value={exportFilters.max_ticket}
                onChange={(e) => handleExportFilterChange('max_ticket', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Inicial"
                type="date"
                value={exportFilters.start_date}
                onChange={(e) => handleExportFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Final"
                type="date"
                value={exportFilters.end_date}
                onChange={(e) => handleExportFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Location Filters */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={exportFilters.city}
                onChange={(e) => handleExportFilterChange('city', e.target.value)}
                placeholder="Digite o nome da cidade"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estado"
                value={exportFilters.state}
                onChange={(e) => handleExportFilterChange('state', e.target.value)}
                placeholder="Ex: SP, RJ, MG"
              />
            </Grid>

            {/* Export Format */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Formato de Exportação</InputLabel>
                <Select
                  value={exportFilters.format}
                  label="Formato de Exportação"
                  onChange={(e) => handleExportFilterChange('format', e.target.value)}
                >
                  <MenuItem value="xlsx">📊 Excel (.xlsx)</MenuItem>
                  <MenuItem value="csv">📄 CSV (.csv)</MenuItem>
                  <MenuItem value="json">🔧 JSON (.json)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleExportSubmit}
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
          >
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Client Form Modal */}
      <Dialog 
        open={clientFormDialog} 
        onClose={handleClientFormClose} 
        maxWidth="lg" 
        fullWidth
        fullScreen={false}
      >
        <DialogTitle>
          {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ClientFormModal
            client={editingClient}
            onSave={handleClientSaved}
            onCancel={handleClientFormClose}
            loading={clientFormLoading}
            setLoading={setClientFormLoading}
            setError={setError}
          />
        </DialogContent>
      </Dialog>

      {/* Client View Modal */}
      <Dialog 
        open={clientViewDialog} 
        onClose={handleClientViewClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Detalhes do Cliente
        </DialogTitle>
        <DialogContent>
          {viewingClient && (
            <ClientViewModal
              client={viewingClient}
              onEdit={() => {
                handleClientViewClose();
                setEditingClient(viewingClient);
                setClientFormDialog(true);
              }}
              onClose={handleClientViewClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ClientList;