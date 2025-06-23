import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as TaskIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Today as TodayIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from './Layout/MainLayout';
import { dashboardService } from '../services/dashboardService';

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [salesPeriod, setSalesPeriod] = useState('week');
  
  // Estados para dados reais
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    newClients: 0,
    revenue: 0,
    tasks: 0,
    growth: { clients: 0, revenue: 0, tasks: 0 }
  });
  const [pendingTasks, setPendingTasks] = useState({ total: 0, overdue: 0, today: 0 });
  const [newClients, setNewClients] = useState({ count: 0, averageTicket: 0, totalValue: 0 });
  const [revenue, setRevenue] = useState({ total: 0, transactions: 0, byCategory: {} });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, salesPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo
      const [
        metricsData,
        tasksData,
        clientsData,
        revenueData,
        salesChartData,
        productsData
      ] = await Promise.all([
        dashboardService.getMetrics(selectedPeriod),
        dashboardService.getPendingTasks(),
        dashboardService.getNewClients(salesPeriod),
        dashboardService.getRevenue(selectedPeriod),
        dashboardService.getSalesData(salesPeriod),
        dashboardService.getTopProducts()
      ]);

      setMetrics(metricsData);
      setPendingTasks(tasksData);
      setNewClients(clientsData);
      setRevenue(revenueData);
      setSalesData(salesChartData);
      setTopProducts(productsData);

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <IconButton 
        onClick={handleRefresh}
        disabled={loading}
        sx={{ 
          bgcolor: '#f8f9fa', 
          borderRadius: 2,
          '&:hover': {
            bgcolor: '#e9ecef'
          }
        }}
      >
        <RefreshIcon sx={{ fontSize: 18, color: '#666' }} />
      </IconButton>
    </Box>
  );

  if (error) {
    return (
      <MainLayout
        title="Dashboard"
        currentPage="dashboard"
        onNavigate={onNavigate}
        headerActions={headerActions}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Dashboard"
      currentPage="dashboard"
      onNavigate={onNavigate}
      headerActions={headerActions}
    >
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Header with subtitle */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.875rem',
            fontWeight: 400,
            mb: 1
          }}
        >
          Acompanhe suas vendas e performance em tempo real
        </Typography>
      </Box>

      {/* Main metrics cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Faturamento do Mês */}
        <Grid item xs={12} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              height: '160px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: '0.875rem',
                    color: '#666',
                    fontWeight: 400
                  }}
                >
                  Faturamento do Mês
                </Typography>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 2,
                  bgcolor: '#e8f5e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MoneyIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                </Box>
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#000',
                  mb: 1
                }}
              >
                {formatCurrency(revenue.total)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#4caf50',
                    fontWeight: 500
                  }}
                >
                  {revenue.transactions} transações
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Novos Clientes */}
        <Grid item xs={12} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              height: '160px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: '0.875rem',
                    color: '#666',
                    fontWeight: 400
                  }}
                >
                  Novos Clientes
                </Typography>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 2,
                  bgcolor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PeopleIcon sx={{ fontSize: 18, color: '#2196f3' }} />
                </Box>
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#000',
                  mb: 1
                }}
              >
                {formatNumber(newClients.count)}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: '#666'
                }}
              >
                Ticket médio: {formatCurrency(newClients.averageTicket)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tarefas Pendentes */}
        <Grid item xs={12} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              height: '160px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: '0.875rem',
                    color: '#666',
                    fontWeight: 400
                  }}
                >
                  Tarefas Pendentes
                </Typography>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 2,
                  bgcolor: '#fff3e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TaskIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                </Box>
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#000',
                  mb: 1
                }}
              >
                {formatNumber(pendingTasks.total)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#f44336' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#f44336',
                    fontWeight: 500
                  }}
                >
                  {pendingTasks.overdue} atrasadas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tarefas de Hoje */}
        <Grid item xs={12} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              height: '160px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: '0.875rem',
                    color: '#666',
                    fontWeight: 400
                  }}
                >
                  Tarefas de Hoje
                </Typography>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 2,
                  bgcolor: '#f3e5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TodayIcon sx={{ fontSize: 18, color: '#9c27b0' }} />
                </Box>
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#000',
                  mb: 1
                }}
              >
                {formatNumber(pendingTasks.today)}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: '#666'
                }}
              >
                Para hoje
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Second row - Charts and analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Vendas */}
        <Grid item xs={12} md={8}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              height: '350px'
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#000'
                  }}
                >
                  Vendas no Período
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={salesPeriod}
                    onChange={(e) => setSalesPeriod(e.target.value)}
                    sx={{
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #e0e0e0'
                      }
                    }}
                  >
                    <MenuItem value="week">Esta Semana</MenuItem>
                    <MenuItem value="month">Este Mês</MenuItem>
                    <MenuItem value="quarter">Este Trimestre</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ 
                  height: 250, 
                  display: 'flex', 
                  alignItems: 'end', 
                  gap: 1,
                  p: 2,
                  border: '1px solid #f0f0f0',
                  borderRadius: 2
                }}>
                  {salesData.map((item, index) => {
                    const maxValue = Math.max(...salesData.map(d => d.value));
                    const height = (item.value / maxValue) * 100;
                    return (
                      <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: '100%',
                            height: `${height}%`,
                            bgcolor: '#4caf50',
                            borderRadius: 1,
                            mb: 1,
                            minHeight: '20px'
                          }}
                        />
                        <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                          {item.date}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: '#666',
                  mt: 2,
                  textAlign: 'center'
                }}
              >
                Total no período: {formatCurrency(newClients.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              height: '350px'
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#000',
                  mb: 3
                }}
              >
                Estatísticas Rápidas
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 2,
                      bgcolor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PeopleIcon sx={{ fontSize: 16, color: '#2196f3' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                      Total Clientes
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#000' }}>
                    {loading ? '-' : formatNumber(metrics.totalClients)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 2,
                      bgcolor: '#fff3e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TaskIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                      Total Tarefas
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#000' }}>
                    {loading ? '-' : formatNumber(metrics.tasks)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 2,
                      bgcolor: '#e8f5e8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ShoppingCartIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                      Transações
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#000' }}>
                    {loading ? '-' : formatNumber(revenue.transactions)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', pt: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#999',
                    textAlign: 'center'
                  }}
                >
                  Dados atualizados em tempo real
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#000'
                  }}
                >
                  Produtos Mais Vendidos
                </Typography>
                <Typography
                  variant="text"
                  onClick={() => onNavigate('products')}
                  sx={{
                    fontSize: '0.875rem',
                    color: '#666',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#000'
                    }
                  }}
                >
                  Ver Todos →
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : topProducts.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#999', fontWeight: 400, borderBottom: '1px solid #f0f0f0' }}>
                          Produto
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#999', fontWeight: 400, borderBottom: '1px solid #f0f0f0' }}>
                          Vendas
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#999', fontWeight: 400, borderBottom: '1px solid #f0f0f0' }}>
                          Receita
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#999', fontWeight: 400, borderBottom: '1px solid #f0f0f0' }}>
                          Clientes
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ borderBottom: index === topProducts.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: index === topProducts.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                            <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                              {product.sales} vendas
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: index === topProducts.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                            <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                              {formatCurrency(product.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: index === topProducts.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                            <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                              {product.clients.length}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#999' }}>
                    Nenhum produto vendido ainda
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default Dashboard;