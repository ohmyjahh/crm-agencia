import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';

const MainLayout = ({ 
  children, 
  title, 
  breadcrumbs = [], 
  currentPage, 
  onNavigate,
  showBackButton = false,
  onBack,
  headerActions = null 
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { md: SIDEBAR_WIDTH }, 
          flexShrink: { md: 0 } 
        }}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          mobileOpen={mobileOpen}
          onMobileToggle={handleDrawerToggle}
        />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuToggle={handleDrawerToggle}
          onBack={onBack}
          showBackButton={showBackButton}
          actions={headerActions}
        />
        
        {/* Content Area */}
        <Box sx={{ 
          p: { xs: 2, md: 3 },
          maxWidth: '1400px',
          mx: 'auto',
          width: '100%',
          overflow: 'auto',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;