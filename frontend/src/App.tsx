import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClientList from './components/clients/ClientList';
import ClientForm from './components/clients/ClientForm';
import TaskList from './components/tasks/TaskList';
import TaskForm from './components/tasks/TaskForm';
import FinanceDashboard from './components/finance/FinanceDashboard';
import { CircularProgress, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00bcd4', // Teal principal
      light: '#4dd0e1',
      dark: '#0097a7',
    },
    secondary: {
      main: '#26a69a', // Verde-azulado
      light: '#80cbc4',
      dark: '#00695c',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
    },
    background: {
      default: '#f8fafb',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafb',
      100: '#f1f5f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
    }
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageData, setPageData] = useState({});

  const handleNavigate = (page: string, data: any = {}) => {
    setCurrentPage(page);
    setPageData(data);
  };

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

  return renderPage();
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
