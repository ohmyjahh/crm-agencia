import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Upload as UploadIcon,
  SmartToy as AIIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { financeAPI, clientAPI } from '../../services/api';
import MainLayout from '../Layout/MainLayout';

const FinanceDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  
  // Estados para modais
  const [transactionModal, setTransactionModal] = useState(false);
  const [dreModal, setDREModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para formulários
  const [transactionForm, setTransactionForm] = useState({
    type: 'entrada',
    amount: '',
    description: '',
    category_id: '',
    client_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: ''
  });
  
  // Estados para formulários de criação
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'entrada',
    description: ''
  });
  
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    name: '',
    description: ''
  });
  
  const [dreFile, setDREFile] = useState(null);
  const [dreDescription, setDREDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, transactionsResponse, categoriesResponse, paymentMethodsResponse, clientsResponse] = await Promise.all([
        financeAPI.getFinanceStats(selectedPeriod),
        financeAPI.getTransactions({ 
          limit: 10, 
          ...selectedPeriod 
        }),
        financeAPI.getCategories(),
        financeAPI.getPaymentMethods(),
        clientAPI.getClients({ limit: 100 })
      ]);

      setStats(statsResponse.data);
      setRecentTransactions(transactionsResponse.data.transactions);
      setCategories(categoriesResponse.data.categories);
      setPaymentMethods(paymentMethodsResponse.data.payment_methods);
      setClients(clientsResponse.data.clients);
    } catch (error) {
      setError('Erro ao carregar dados financeiros');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async () => {
    try {
      setUploading(true);
      
      // Preparar dados
      const data = { ...transactionForm };
      if (!data.category_id) delete data.category_id;
      if (!data.client_id) delete data.client_id;
      if (!data.payment_method) delete data.payment_method;
      if (!data.notes) delete data.notes;

      await financeAPI.createTransaction(data);
      
      setTransactionModal(false);
      setTransactionForm({
        type: 'entrada',
        amount: '',
        description: '',
        category_id: '',
        client_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        notes: ''
      });
      
      await loadData();
    } catch (error) {
      setError('Erro ao criar transação');
      console.error('Erro ao criar transação:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDREUpload = async () => {
    try {
      if (!dreFile) {
        setError('Selecione um arquivo');
        return;
      }

      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', dreFile);
      formData.append('month', selectedPeriod.month);
      formData.append('year', selectedPeriod.year);
      formData.append('description', dreDescription);

      const uploadResponse = await financeAPI.uploadDREFile(formData);
      
      // Processar com IA automaticamente
      await financeAPI.processDREWithAI(uploadResponse.data.file.id);
      
      setDREModal(false);
      setDREFile(null);
      setDREDescription('');
      
      alert('DRE processada com sucesso! Verifique o resultado na aba de relatórios.');
      
    } catch (error) {
      setError('Erro ao processar DRE');
      console.error('Erro ao processar DRE:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (!categoryForm.name || !categoryForm.type) {
        setError('Nome e tipo são obrigatórios');
        return;
      }

      setUploading(true);
      
      await financeAPI.createCategory(categoryForm);
      
      setCategoryModal(false);
      setCategoryForm({ name: '', type: 'entrada', description: '' });
      
      // Recarregar categorias
      const categoriesResponse = await financeAPI.getCategories();
      setCategories(categoriesResponse.data.categories);
      
    } catch (error) {
      setError('Erro ao criar categoria');
      console.error('Erro ao criar categoria:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePaymentMethod = async () => {
    try {
      if (!paymentMethodForm.name) {
        setError('Nome é obrigatório');
        return;
      }

      setUploading(true);
      
      await financeAPI.createPaymentMethod(paymentMethodForm);
      
      setPaymentMethodModal(false);
      setPaymentMethodForm({ name: '', description: '' });
      
      // Recarregar métodos de pagamento
      const paymentMethodsResponse = await financeAPI.getPaymentMethods();
      setPaymentMethods(paymentMethodsResponse.data.payment_methods);
      
    } catch (error) {
      setError('Erro ao criar método de pagamento');
      console.error('Erro ao criar método de pagamento:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Métodos de pagamento predefinidos
  const defaultPaymentMethods = [
    { id: 'credito', name: 'Crédito', icon: '💳', color: '#4caf50' },
    { id: 'debito', name: 'Débito', icon: '💳', color: '#2196f3' },
    { id: 'pix', name: 'PIX', icon: '📱', color: '#ff9800' },
    { id: 'transferencia', name: 'Transferência', icon: '🏦', color: '#9c27b0' },
  ];

  const allPaymentMethods = [
    ...defaultPaymentMethods,
    ...paymentMethods.map(pm => ({ 
      id: pm.id, 
      name: pm.name, 
      icon: '💰', 
      color: '#607d8b',
      isCustom: true 
    }))
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const breadcrumbs = [
    { label: 'Financeiro', onClick: () => onNavigate('finance') }
  ];

  const headerActions = (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={() => setDREModal(true)}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        DRE com IA
      </Button>
      
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setTransactionModal(true)}
      >
        Nova Transação
      </Button>
    </Stack>
  );

  return (
    <MainLayout
      title="Dashboard Financeiro"
      breadcrumbs={breadcrumbs}
      currentPage="finance"
      onNavigate={onNavigate}
      headerActions={headerActions}
    >

      {/* Filtro de Período */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Período de Análise
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Mês</InputLabel>
                <Select
                  value={selectedPeriod.month}
                  label="Mês"
                  onChange={(e) => setSelectedPeriod(prev => ({ ...prev, month: e.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(2023, i).toLocaleDateString('pt-BR', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Ano</InputLabel>
                <Select
                  value={selectedPeriod.year}
                  label="Ano"
                  onChange={(e) => setSelectedPeriod(prev => ({ ...prev, year: e.target.value }))}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <MenuItem key={2023 + i} value={2023 + i}>
                      {2023 + i}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                fullWidth
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                  <TrendingUpIcon color="success" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatCurrency(stats?.summary?.receitas)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receitas do Período
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.light', width: 48, height: 48 }}>
                  <TrendingDownIcon color="error" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {formatCurrency(stats?.summary?.despesas)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Despesas do Período
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: stats?.summary?.saldo >= 0 ? 'success.light' : 'error.light', 
                  width: 48, 
                  height: 48 
                }}>
                  <AccountBalanceIcon color={stats?.summary?.saldo >= 0 ? 'success' : 'error'} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={stats?.summary?.saldo >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(stats?.summary?.saldo)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Saldo do Período
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>
                  <ReportIcon color="info" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {stats?.summary?.total_transactions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Transações
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conteúdo Principal */}
      <Grid container spacing={3}>
        {/* Transações Recentes */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Transações Recentes</Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => onNavigate('finance-transactions')}
                >
                  Ver Todas
                </Button>
              </Box>
            
            <List>
              {recentTransactions.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Nenhuma transação encontrada" />
                </ListItem>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <React.Fragment key={transaction.id}>
                    <ListItem>
                      <ListItemText
                        primary={transaction.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {transaction.category_name || 'Sem categoria'} • {formatDate(transaction.transaction_date)}
                            </Typography>
                            {transaction.client_name && (
                              <Typography variant="caption" color="text.secondary">
                                Cliente: {transaction.client_name}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography 
                            variant="body2" 
                            color={transaction.type === 'entrada' ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </Typography>
                          <Chip 
                            label={transaction.type === 'entrada' ? 'Entrada' : 'Saída'} 
                            color={transaction.type === 'entrada' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recentTransactions.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumo por Categoria */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Por Categoria
              </Typography>
            
            <List dense>
              {stats?.by_category?.slice(0, 8).map((category) => (
                <ListItem key={category.category_name} sx={{ px: 0 }}>
                  <ListItemText
                    primary={category.category_name || 'Sem categoria'}
                    secondary={`${category.count} transações`}
                  />
                  <ListItemSecondaryAction>
                    <Typography 
                      variant="body2" 
                      color={category.type === 'entrada' ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {formatCurrency(category.total)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal de Nova Transação */}
      <Dialog open={transactionModal} onClose={() => setTransactionModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Nova Transação</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Primeira linha - Tipo e Valor */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Tipo
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Selecione o tipo</InputLabel>
                <Select
                  value={transactionForm.type}
                  label="Selecione o tipo"
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saida">Saída</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Valor
              </Typography>
              <TextField
                fullWidth
                label="Digite o valor"
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            {/* Segunda linha - Descrição (linha completa) */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Descrição
              </Typography>
              <TextField
                fullWidth
                label="Descreva a transação"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            
            {/* Terceira linha - Categoria com botão + */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Categoria
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <FormControl fullWidth>
                  <InputLabel>Selecione uma categoria</InputLabel>
                  <Select
                    value={transactionForm.category_id}
                    label="Selecione uma categoria"
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <MenuItem value="">Sem categoria</MenuItem>
                    {categories
                      .filter(cat => cat.type === transactionForm.type)
                      .map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton 
                  color="primary" 
                  onClick={() => setCategoryModal(true)}
                  sx={{ mb: 0.5 }}
                  title="Adicionar nova categoria"
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Grid>
            
            {/* Quarta linha - Cliente e Data */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Cliente
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Selecione um cliente</InputLabel>
                <Select
                  value={transactionForm.client_id}
                  label="Selecione um cliente"
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, client_id: e.target.value }))}
                >
                  <MenuItem value="">Sem cliente</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Data
              </Typography>
              <TextField
                fullWidth
                label="Selecione a data"
                type="date"
                value={transactionForm.transaction_date}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                    Forma de Pagamento
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setPaymentMethodModal(true)}
                    variant="outlined"
                  >
                    Adicionar Nova
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {allPaymentMethods.map((method) => (
                    <Grid item xs={6} sm={4} md={3} key={method.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          border: transactionForm.payment_method === method.name ? 2 : 1,
                          borderColor: transactionForm.payment_method === method.name ? method.color : 'divider',
                          '&:hover': {
                            borderColor: method.color,
                            boxShadow: 2
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => setTransactionForm(prev => ({ ...prev, payment_method: method.name }))}
                      >
                        <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ mb: 1.5 }}>
                            {method.icon}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                            {method.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Observações
              </Typography>
              <TextField
                fullWidth
                label="Adicione observações (opcional)"
                multiline
                rows={3}
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionModal(false)}>Cancelar</Button>
          <Button 
            onClick={handleTransactionSubmit} 
            variant="contained"
            disabled={uploading || !transactionForm.amount || !transactionForm.description}
          >
            {uploading ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de DRE com IA */}
      <Dialog open={dreModal} onClose={() => setDREModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon />
            DRE com Inteligência Artificial
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Envie prints, PDFs ou fotos de documentos financeiros e nossa IA irá gerar uma DRE completa automaticamente.
          </Typography>
          
          <TextField
            fullWidth
            label="Descrição"
            value={dreDescription}
            onChange={(e) => setDREDescription(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Ex: Extrato bancário dezembro 2024"
          />
          
          <input
            type="file"
            accept="image/*,.pdf,.txt"
            onChange={(e) => setDREFile(e.target.files[0])}
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '2px dashed #ccc',
              borderRadius: '4px',
              textAlign: 'center'
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Formatos aceitos: JPG, PNG, PDF, TXT (até 10MB)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDREModal(false)}>Cancelar</Button>
          <Button 
            onClick={handleDREUpload} 
            variant="contained"
            disabled={uploading || !dreFile}
            startIcon={uploading ? <CircularProgress size={20} /> : <AIIcon />}
          >
            {uploading ? 'Processando...' : 'Processar com IA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Nova Categoria */}
      <Dialog open={categoryModal} onClose={() => setCategoryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Categoria</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Categoria"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Vendas, Marketing, Despesas Operacionais"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={categoryForm.type}
                  label="Tipo"
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saida">Saída</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição (Opcional)"
                multiline
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o uso desta categoria..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryModal(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateCategory} 
            variant="contained"
            disabled={uploading || !categoryForm.name}
          >
            {uploading ? <CircularProgress size={20} /> : 'Criar Categoria'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Novo Método de Pagamento */}
      <Dialog open={paymentMethodModal} onClose={() => setPaymentMethodModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Método de Pagamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Método"
                value={paymentMethodForm.name}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Cartão Corporativo, Cheque, Financiamento"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição (Opcional)"
                multiline
                rows={3}
                value={paymentMethodForm.description}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhes deste método de pagamento..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentMethodModal(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreatePaymentMethod} 
            variant="contained"
            disabled={uploading || !paymentMethodForm.name}
          >
            {uploading ? <CircularProgress size={20} /> : 'Criar Método'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default FinanceDashboard;