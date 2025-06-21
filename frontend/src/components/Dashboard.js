import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from './Layout/MainLayout';

const Dashboard = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const statsCards = [
    {
      title: 'Clientes Ativos',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: <BusinessIcon />,
      color: '#1976d2',
      description: 'Total de clientes',
      subtitle: '3 novos este mês'
    },
    {
      title: 'Tarefas Pendentes',
      value: '8',
      change: '-15%',
      changeType: 'positive',
      icon: <TaskIcon />,
      color: '#ed6c02',
      description: 'Aguardando execução',
      subtitle: '2 vencendo hoje'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.280',
      change: '+8.2%',
      changeType: 'positive',
      icon: <MoneyIcon />,
      color: '#2e7d32',
      description: 'Faturamento atual',
      subtitle: 'Meta: R$ 50.000'
    },
    ...(isAdmin ? [{
      title: 'Taxa de Conversão',
      value: '68%',
      change: '+5%',
      changeType: 'positive',
      icon: <TrendingUpIcon />,
      color: '#9c27b0',
      description: 'Leads convertidos',
      subtitle: 'Acima da média'
    }] : []),
  ];

  const quickActions = [
    { 
      title: 'Novo Cliente', 
      description: 'Cadastrar cliente', 
      icon: <BusinessIcon />,
      color: 'primary',
      action: () => onNavigate('client-form')
    },
    { 
      title: 'Nova Tarefa', 
      description: 'Criar tarefa', 
      icon: <TaskIcon />,
      color: 'warning',
      action: () => onNavigate('task-form')
    },
    { 
      title: 'Lançamento Financeiro', 
      description: 'Registrar transação', 
      icon: <AccountBalanceIcon />,
      color: 'success',
      action: () => onNavigate('finance')
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'Cliente "TechCorp" cadastrado',
      time: 'Há 2 horas',
      type: 'client',
      icon: <BusinessIcon color="primary" />
    },
    {
      id: 2,
      action: 'Tarefa "Follow-up vendas" concluída',
      time: 'Há 3 horas',
      type: 'task',
      icon: <CheckCircleIcon color="success" />
    },
    {
      id: 3,
      action: 'Receita de R$ 8.500 registrada',
      time: 'Há 5 horas',
      type: 'finance',
      icon: <MoneyIcon color="success" />
    },
    {
      id: 4,
      action: 'Reunião agendada com ClienteXYZ',
      time: 'Ontem',
      type: 'meeting',
      icon: <ScheduleIcon color="info" />
    },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton onClick={handleRefresh} disabled={loading}>
        <RefreshIcon />
      </IconButton>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => onNavigate('client-form')}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        Novo Cliente
      </Button>
    </Box>
  );

  return (
    <MainLayout
      title="Dashboard"
      currentPage="dashboard"
      onNavigate={onNavigate}
      headerActions={headerActions}
    >
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Bem-vindo de volta, {user?.name?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aqui está um resumo das suas atividades e métricas importantes.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Chip
                    label={stat.change}
                    size="small"
                    color={stat.changeType === 'positive' ? 'success' : 'error'}
                    icon={stat.changeType === 'positive' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  />
                </Box>
                
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {stat.value}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.description}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Ações Rápidas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Acesso rápido às funcionalidades mais utilizadas
              </Typography>
              
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          boxShadow: 3,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                      onClick={action.action}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: `${action.color}.light`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: `${action.color}.main`,
                            mx: 'auto',
                            mb: 2
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: 'fit-content' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Atividades Recentes
                </Typography>
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <List sx={{ py: 0 }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {activity.action}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              <Button 
                variant="text" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => alert('Ver todas as atividades')}
              >
                Ver todas as atividades
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default Dashboard;