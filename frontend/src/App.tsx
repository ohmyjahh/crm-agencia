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
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
