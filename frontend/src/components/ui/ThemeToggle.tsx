import React from 'react';
import { IconButton, Box, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'iconButton' | 'switch';
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'iconButton',
  size = 'medium',
  showTooltip = true 
}) => {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  if (variant === 'switch') {
    return (
      <Box
        onClick={toggleMode}
        sx={{
          display: 'flex',
          width: 64,
          height: 32,
          p: 0.5,
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          bgcolor: isDark ? 'grey.800' : 'grey.200',
          border: 1,
          borderColor: isDark ? 'grey.700' : 'grey.300',
          '&:hover': {
            boxShadow: 2,
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMode();
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 3,
            transition: 'all 0.3s ease-in-out',
            transform: isDark ? 'translateX(0)' : 'translateX(32px)',
            bgcolor: isDark ? 'primary.main' : 'warning.main',
            color: 'white',
            boxShadow: 2,
          }}
        >
          {isDark ? (
            <Brightness4 sx={{ fontSize: 16 }} />
          ) : (
            <Brightness7 sx={{ fontSize: 16 }} />
          )}
        </Box>
      </Box>
    );
  }

  const toggleButton = (
    <IconButton
      onClick={toggleMode}
      size={size}
      sx={{
        color: isDark ? 'warning.main' : 'primary.main',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          bgcolor: isDark ? 'rgba(255, 193, 7, 0.08)' : 'rgba(0, 188, 212, 0.08)',
          transform: 'scale(1.1)',
        }
      }}
    >
      {isDark ? (
        <Brightness7 />
      ) : (
        <Brightness4 />
      )}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={`Mudar para modo ${isDark ? 'claro' : 'escuro'}`}>
        {toggleButton}
      </Tooltip>
    );
  }

  return toggleButton;
};