import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  AttachMoney as MoneyIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = ({ onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const statsCards = [
    {
      title: 'Clientes',
      value: '12',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      description: 'Clientes ativos',
    },
    {
      title: 'Tarefas',
      value: '8',
      icon: <TaskIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      description: 'Tarefas pendentes',
    },
    {
      title: 'Receitas',
      value: 'R$ 25.000',
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      description: 'Este mês',
    },
    ...(isAdmin ? [{
      title: 'Usuários',
      value: '5',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      description: 'Funcionários ativos',
    }] : []),
  ];

  const quickActions = [
    { 
      title: 'Novo Cliente', 
      description: 'Cadastrar novo cliente', 
      color: 'primary',
      action: () => onNavigate('client-form')
    },
    { 
      title: 'Ver Clientes', 
      description: 'Gerenciar clientes', 
      color: 'primary',
      action: () => onNavigate('clients')
    },
    { 
      title: 'Nova Tarefa', 
      description: 'Criar nova tarefa', 
      color: 'secondary',
      action: () => onNavigate('task-form')
    },
    { 
      title: 'Ver Tarefas', 
      description: 'Gerenciar tarefas', 
      color: 'secondary',
      action: () => onNavigate('tasks')
    },
    { 
      title: 'Gestão Financeira', 
      description: 'Dashboard financeiro', 
      color: 'success',
      action: () => onNavigate('finance')
    },
    ...(isAdmin ? [{ 
      title: 'Novo Usuário', 
      description: 'Cadastrar funcionário', 
      color: 'info',
      action: () => alert('Funcionalidade em desenvolvimento')
    }] : []),
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" component="h1" fontWeight="bold">
              CRM Agência
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AccountIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {user?.name}
                </Typography>
                <Chip 
                  label={user?.role === 'administrador' ? 'Admin' : 'Funcionário'} 
                  size="small" 
                  color={user?.role === 'administrador' ? 'primary' : 'default'}
                />
              </Box>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="error"
            >
              Sair
            </Button>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="lg">
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Bem-vindo, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aqui está um resumo das suas atividades e do sistema.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: stat.color }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ações Rápidas
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                      onClick={action.action}
                    >
                      <CardContent>
                        <Typography variant="h6" color={`${action.color}.main`}>
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
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Atividades Recentes
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Cliente "ABC Corp" criado
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Há 2 horas
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Tarefa "Follow-up vendas" concluída
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Há 4 horas
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Receita de R$ 5.000 registrada
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ontem
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;