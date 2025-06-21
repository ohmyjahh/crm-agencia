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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileToggle={handleDrawerToggle}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          bgcolor: 'grey.50',
          minHeight: '100vh',
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
        <Toolbar /> {/* Spacer for fixed header */}
        
        <Box sx={{ 
          p: { xs: 2, md: 3 },
          maxWidth: '1400px',
          mx: 'auto',
          width: '100%'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;