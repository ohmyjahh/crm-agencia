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
      color: '#00bcd4',
      gradient: 'linear-gradient(135deg, #00bcd4 0%, #4dd0e1 100%)',
      description: 'Total de clientes',
      subtitle: '3 novos este mês'
    },
    {
      title: 'Tarefas Pendentes',
      value: '8',
      change: '-15%',
      changeType: 'positive',
      icon: <TaskIcon />,
      color: '#26a69a',
      gradient: 'linear-gradient(135deg, #26a69a 0%, #80cbc4 100%)',
      description: 'Aguardando execução',
      subtitle: '2 vencendo hoje'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.280',
      change: '+8.2%',
      changeType: 'positive',
      icon: <MoneyIcon />,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
      description: 'Faturamento atual',
      subtitle: 'Meta: R$ 50.000'
    },
    ...(isAdmin ? [{
      title: 'Taxa de Conversão',
      value: '68%',
      change: '+5%',
      changeType: 'positive',
      icon: <TrendingUpIcon />,
      color: '#ff7043',
      gradient: 'linear-gradient(135deg, #ff7043 0%, #ffab91 100%)',
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
              sx={{ 
                height: '100%',
                background: stat.gradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Chip
                    label={stat.change}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)'
                    }}
                    icon={<TrendingUpIcon sx={{ color: 'white !important' }} />}
                  />
                </Box>
                
                <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                  {stat.value}
                </Typography>
                
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                  {stat.description}
                </Typography>
                
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {stat.subtitle}
                </Typography>

                {/* Background decoration */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    zIndex: 0
                  }}
                />
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