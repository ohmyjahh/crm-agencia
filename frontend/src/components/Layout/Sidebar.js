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

const SIDEBAR_WIDTH = 280;

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BusinessIcon sx={{ fontSize: 32 }} />
          <Typography variant="h6" fontWeight="bold">
            CRM Agency
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="medium" noWrap>
              {user?.name || 'Usuário'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
              {user?.email || 'email@exemplo.com'}
            </Typography>
          </Box>
        </Box>
        
        {user?.role === 'administrador' && (
          <Chip 
            label="Admin" 
            size="small" 
            sx={{ 
              mt: 1, 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontSize: '0.7rem'
            }} 
          />
        )}
      </Box>

      {/* Menu Principal */}
      <Box sx={{ flex: 1, px: 1, py: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                selected={currentPage === item.id || currentPage === item.path}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: `${item.color}15`,
                    color: item.color,
                    '& .MuiListItemIcon-root': {
                      color: item.color,
                    },
                  },
                  '&:hover': {
                    bgcolor: `${item.color}08`,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: currentPage === item.id || currentPage === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Stats Card */}
        <Box sx={{ mx: 2, mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight="bold">
              Performance
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Este mês
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="success.main">
            +24%
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