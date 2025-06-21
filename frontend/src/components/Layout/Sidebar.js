import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as TaskIcon,
  AccountBalance as FinanceIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_WIDTH = 240;

const Sidebar = ({ currentPage, onNavigate, mobileOpen, onMobileToggle }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: 'dashboard',
      color: '#1976d2'
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: <PeopleIcon />,
      path: 'clients',
      color: '#2e7d32'
    },
    {
      id: 'tasks',
      label: 'Tarefas',
      icon: <TaskIcon />,
      path: 'tasks',
      color: '#ed6c02'
    },
    {
      id: 'finance',
      label: 'Financeiro',
      icon: <FinanceIcon />,
      path: 'finance',
      color: '#9c27b0'
    },
  ];

  const bottomMenuItems = [
    {
      id: 'settings',
      label: 'Configurações',
      icon: <SettingsIcon />,
      path: 'settings',
      color: '#757575'
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ 
            width: 36, 
            height: 36, 
            borderRadius: 2, 
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BusinessIcon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            CRM Agency
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', width: 32, height: 32 }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {user?.name || 'Usuário'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role === 'administrador' ? 'Administrador' : 'Funcionário'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Menu Principal */}
      <Box sx={{ flex: 1, py: 2 }}>
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Workspace
          </Typography>
        </Box>
        
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                selected={currentPage === item.id || currentPage === item.path}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Performance Card */}
        <Box sx={{ mx: 3, mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUpIcon sx={{ color: 'success.dark', fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle2" fontWeight="600">
              Performance
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Este mês
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="success.dark">
            +24%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs. mês anterior
          </Typography>
        </Box>
      </Box>

      {/* Bottom Menu */}
      <Box sx={{ px: 1, pb: 2 }}>
        <Divider sx={{ mb: 1 }} />
        <List>
          {bottomMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                selected={currentPage === item.id}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: `${item.color}15`,
                    color: item.color,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                mx: 1,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Sair" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEBAR_WIDTH,
            border: 'none',
            boxShadow: 3,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEBAR_WIDTH,
            border: 'none',
            boxShadow: 1,
            position: 'relative',
            height: '100vh',
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
export { SIDEBAR_WIDTH };