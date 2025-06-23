import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { getTheme } from './theme/theme';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClientList from './components/clients/ClientList';
import ClientForm from './components/clients/ClientForm';
import TaskList from './components/tasks/TaskList';
import TaskForm from './components/tasks/TaskForm';
import FinanceDashboard from './components/finance/FinanceDashboard';
import ProductList from './components/products/ProductList';
import FollowupDashboard from './components/followup/FollowupDashboard';
import { CircularProgress, Box } from '@mui/material';

function AppContent() {
  const { user, loading } = useAuth();
  const { mode } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageData, setPageData] = useState({});

  const handleNavigate = (page: string, data: any = {}) => {
    setCurrentPage(page);
    setPageData(data);
  };

  const theme = getTheme(mode);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Renderizar página baseada no estado atual
  const renderPage = () => {
    switch (currentPage) {
      case 'clients':
        return <ClientList onNavigate={handleNavigate} />;
      
      case 'client-form':
        return (
          <ClientForm
            clientId={(pageData as any).clientId}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('clients')}
          />
        );
      
      case 'client-details':
        return (
          <Box sx={{ p: 3 }}>
            <h2>Detalhes do Cliente (Em desenvolvimento)</h2>
            <button onClick={() => handleNavigate('clients')}>Voltar</button>
          </Box>
        );
      
      case 'tasks':
        return <TaskList onNavigate={handleNavigate} />;
      
      case 'task-form':
        return (
          <TaskForm
            taskId={(pageData as any).taskId}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('tasks')}
          />
        );
      
      case 'task-details':
        return (
          <Box sx={{ p: 3 }}>
            <h2>Detalhes da Tarefa (Em desenvolvimento)</h2>
            <button onClick={() => handleNavigate('tasks')}>Voltar</button>
          </Box>
        );
      
      case 'products':
        return <ProductList onNavigate={handleNavigate} />;
      
      case 'followup':
        return <FollowupDashboard onNavigate={handleNavigate} />;
      
      case 'finance':
        return <FinanceDashboard onNavigate={handleNavigate} />;
      
      case 'finance-transactions':
        return (
          <Box sx={{ p: 3 }}>
            <h2>Lista de Transações (Em desenvolvimento)</h2>
            <button onClick={() => handleNavigate('finance')}>Voltar</button>
          </Box>
        );
      
      case 'dashboard':
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderPage()}
    </ThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
