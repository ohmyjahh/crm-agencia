import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Settings as SequencesIcon,
  Assignment as AssignIcon,
  Schedule as FollowupIcon
} from '@mui/icons-material';
import MainLayout from '../Layout/MainLayout';
import SequenceManagement from './SequenceManagement';
import AssignmentManagement from './AssignmentManagement';
import MyFollowups from './MyFollowups';

const FollowupDashboard = ({ onNavigate }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const tabs = [
    {
      label: 'Cadastros de Cadências',
      icon: <SequencesIcon />,
      component: <SequenceManagement />
    },
    {
      label: 'Atribuir Cadências',
      icon: <AssignIcon />,
      component: <AssignmentManagement />
    },
    {
      label: 'Meus Follow-ups',
      icon: <FollowupIcon />,
      component: <MyFollowups />
    }
  ];

  return (
    <MainLayout currentPage="followup" onNavigate={onNavigate}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Sistema de Follow-up
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie cadências de contato, atribuições e acompanhe seus follow-ups
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  minHeight: 64,
                  fontWeight: 500
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{
                    '& .MuiTab-iconWrapper': {
                      mr: 1
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {tabs[currentTab].component}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default FollowupDashboard;