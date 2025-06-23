import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Breadcrumbs,
  Link,
  Button,
  Avatar,
  Badge,
  InputBase,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { SIDEBAR_WIDTH } from './Sidebar';
import { ThemeToggle } from '../ui/ThemeToggle';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuToggle?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  breadcrumbs = [], 
  onMenuToggle, 
  onBack, 
  showBackButton = false,
  actions = null 
}) => {
  
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        width: '100%',
        bgcolor: 'white',
        color: '#000',
        boxShadow: 'none',
        borderBottom: '1px solid #f0f0f0',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 2, minHeight: '72px !important' }}>
        {/* Menu/Back Button - Hidden on desktop when sidebar is permanent */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showBackButton ? (
            <IconButton
              color="inherit"
              aria-label="voltar"
              onClick={onBack}
              sx={{ 
                mr: 1,
                bgcolor: '#4caf50',
                color: 'white',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: '#45a049',
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          ) : (
            <IconButton
              color="inherit"
              aria-label="abrir menu"
              onClick={onMenuToggle}
              edge="start"
              sx={{ 
                mr: 1, 
                display: { md: 'none' },
                width: 36,
                height: 36
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>

        {/* Title and Breadcrumbs */}
        <Box sx={{ flex: 1 }}>
          {breadcrumbs.length > 0 ? (
            <Box>
              <Breadcrumbs 
                aria-label="breadcrumb" 
                sx={{ 
                  mb: 1,
                  '& .MuiBreadcrumbs-separator': {
                    color: '#999',
                  }
                }}
              >
                <Link
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick({ label: 'Início', onClick: () => window.location.reload() });
                  }}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    color: '#666',
                    '&:hover': {
                      color: '#000',
                    }
                  }}
                >
                  <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                  Início
                </Link>
                
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index === breadcrumbs.length - 1 ? (
                      <Typography 
                        sx={{ 
                          color: '#000', 
                          fontWeight: 500,
                          fontSize: '0.875rem'
                        }}
                      >
                        {item.label}
                      </Typography>
                    ) : (
                      <Link
                        color="inherit"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleBreadcrumbClick(item);
                        }}
                        sx={{ 
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          color: '#666',
                          '&:hover': {
                            color: '#000',
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </Breadcrumbs>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.5rem',
                  color: '#000'
                }}
              >
                {title}
              </Typography>
            </Box>
          ) : (
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                fontSize: '1.5rem',
                color: '#000'
              }}
            >
              {title}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Search Bar - Following SplitEdge style */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center', 
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            px: 2,
            py: 1,
            minWidth: 300,
            gap: 1
          }}>
            <SearchIcon sx={{ fontSize: 18, color: '#999' }} />
            <InputBase
              placeholder="Search..."
              sx={{ 
                fontSize: '0.875rem', 
                color: '#666',
                flex: 1,
                '& .MuiInputBase-input': {
                  padding: 0,
                }
              }}
            />
          </Box>

          {/* Search Icon for mobile */}
          <IconButton 
            color="inherit" 
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              width: 36,
              height: 36,
              bgcolor: '#f8f9fa',
              '&:hover': {
                bgcolor: '#e9ecef',
              }
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: '#666' }} />
          </IconButton>

          {/* Settings */}
          <IconButton 
            color="inherit"
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#f8f9fa',
              '&:hover': {
                bgcolor: '#e9ecef',
              }
            }}
          >
            <SettingsIcon sx={{ fontSize: 18, color: '#666' }} />
          </IconButton>

          {/* Notifications */}
          <IconButton 
            color="inherit"
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#f8f9fa',
              position: 'relative',
              '&:hover': {
                bgcolor: '#e9ecef',
              }
            }}
          >
            <NotificationsIcon sx={{ fontSize: 18, color: '#666' }} />
            <Box sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              bgcolor: '#f44336',
              borderRadius: '50%',
              border: '1px solid white'
            }} />
          </IconButton>

          {/* Actions from props */}
          {actions}

          {/* Profile */}
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: '#4caf50',
              fontSize: '0.875rem',
              fontWeight: 600,
              ml: 1
            }}
          >
            U
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;