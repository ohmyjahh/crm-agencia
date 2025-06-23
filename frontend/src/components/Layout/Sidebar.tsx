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
  Inventory as ProductIcon,
  CallMade as FollowupIcon,
  MailOutline as EmailIcon,
  AnalyticsOutlined as AnalyticsIcon,
  IntegrationInstructionsOutlined as IntegrationIcon,
  SpeedOutlined as PerformanceIcon,
  PersonOutline as AccountIcon,
  GroupOutlined as MembersIcon,
  FeedbackOutlined as FeedbackIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

const SIDEBAR_WIDTH = 260;

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, mobileOpen, onMobileToggle }) => {
  const { user, logout } = useAuth();

  const mainMenuItems = [
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
      id: 'followup',
      label: 'Follow-up',
      icon: <FollowupIcon />,
      path: 'followup',
      color: '#7b1fa2'
    },
    {
      id: 'tasks',
      label: 'Tarefas',
      icon: <TaskIcon />,
      path: 'tasks',
      color: '#ed6c02'
    },
    {
      id: 'products',
      label: 'Produtos',
      icon: <ProductIcon />,
      path: 'products',
      color: '#1565c0'
    },
    {
      id: 'finance',
      label: 'Financeiro',
      icon: <FinanceIcon />,
      path: 'finance',
      color: '#9c27b0'
    },
  ];

  const otherMenuItems = [
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header - Following exact style from image */}
      <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ 
            width: 28, 
            height: 28, 
            borderRadius: 1.5, 
            bgcolor: '#4caf50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              bgcolor: 'white',
              borderRadius: '50%'
            }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#000',
              fontSize: '1.1rem'
            }}
          >
            SplitEdge
          </Typography>
        </Box>
        
        {/* Search bar - Following exact style from image */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: '#f8f9fa',
          borderRadius: 2,
          px: 2,
          py: 1,
          gap: 1
        }}>
          <SearchIcon sx={{ fontSize: 18, color: '#999' }} />
          <Typography sx={{ 
            fontSize: '0.875rem', 
            color: '#999',
            flex: 1
          }}>
            Buscar
          </Typography>
        </Box>
      </Box>

      {/* Menu Principal */}
      <Box sx={{ flex: 1, py: 2 }}>
        {/* Main Menu Section */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#999', 
              fontWeight: 500, 
              fontSize: '0.75rem',
              textTransform: 'uppercase', 
              letterSpacing: 1,
              pl: 2
            }}
          >
            MENU PRINCIPAL
          </Typography>
        </Box>
        
        <List sx={{ px: 2 }}>
          {mainMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                selected={currentPage === item.id || currentPage === item.path}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  minHeight: 44,
                  '&.Mui-selected': {
                    bgcolor: '#4caf50',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '&:hover': {
                      bgcolor: '#45a049',
                    },
                  },
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  '& .MuiSvgIcon-root': {
                    fontSize: 20
                  }
                }}>
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

        {/* Other Section */}
        <Box sx={{ px: 2, mb: 2, mt: 3 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#999', 
              fontWeight: 500, 
              fontSize: '0.75rem',
              textTransform: 'uppercase', 
              letterSpacing: 1,
              pl: 2
            }}
          >
            OUTROS
          </Typography>
        </Box>
        
        <List sx={{ px: 2 }}>
          {otherMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                selected={currentPage === item.id || currentPage === item.path}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  minHeight: 44,
                  '&.Mui-selected': {
                    bgcolor: '#4caf50',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '&:hover': {
                      bgcolor: '#45a049',
                    },
                  },
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  '& .MuiSvgIcon-root': {
                    fontSize: 20
                  }
                }}>
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

      </Box>

      {/* Bottom User Section - Following exact style from image */}
      <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: '#4caf50',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            {user?.name?.charAt(0) || 'J'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                fontSize: '0.875rem',
                color: '#000'
              }}
              noWrap
            >
              Jevine klef
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#999',
                fontSize: '0.75rem'
              }}
              noWrap
            >
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
          <Box sx={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%',
            bgcolor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Box sx={{ 
              width: 4, 
              height: 4, 
              bgcolor: '#999', 
              borderRadius: '50%',
              position: 'relative',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                width: 4,
                height: 4,
                bgcolor: '#999',
                borderRadius: '50%',
              },
              '&::before': {
                top: -6
              },
              '&::after': {
                top: 6
              }
            }} />
          </Box>
        </Box>
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
            borderRight: '1px solid #f0f0f0',
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