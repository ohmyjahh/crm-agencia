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
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Home as HomeIcon,
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
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        {/* Menu/Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showBackButton ? (
            <IconButton
              color="inherit"
              aria-label="voltar"
              onClick={onBack}
              sx={{ 
                mr: 1,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton
              color="inherit"
              aria-label="abrir menu"
              onClick={onMenuToggle}
              edge="start"
              sx={{ mr: 1, display: { md: 'none' } }}
            >
              <MenuIcon />
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
                  mb: 0.5,
                  '& .MuiBreadcrumbs-separator': {
                    color: 'text.secondary',
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
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                  Início
                </Link>
                
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index === breadcrumbs.length - 1 ? (
                      <Typography color="text.primary" fontWeight="medium">
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
                          '&:hover': {
                            textDecoration: 'underline',
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </Breadcrumbs>
              
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                {title}
              </Typography>
            </Box>
          ) : (
            <Typography variant="h5" fontWeight="bold">
              {title}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actions}
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Search */}
          <IconButton color="inherit" sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <SearchIcon />
          </IconButton>

          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile */}
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            U
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;