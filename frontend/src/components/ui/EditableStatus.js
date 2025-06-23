import React, { useState, Suspense } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import useCustomStatuses from '../../hooks/useCustomStatuses';

// Importação dinâmica do modal
const CustomStatusModal = React.lazy(() => import('./CustomStatusModal'));

const EditableStatus = ({
  value,
  onChange,
  options = [],
  loading = false,
  disabled = false,
  size = 'small',
  color = 'default',
  variant = 'filled',
  statusType = 'general', // general, priority, category, etc.
  renderLabel,
  renderIcon,
  className,
  sx = {},
  onStatusUpdate // Callback para quando um status é atualizado
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [customStatusModal, setCustomStatusModal] = useState(false);
  const open = Boolean(anchorEl);

  const { 
    customStatuses, 
    addCustomStatus, 
    getCustomStatusesByType,
    loading: customStatusLoading 
  } = useCustomStatuses();

  // Obter status personalizados para este tipo
  const typeCustomStatuses = getCustomStatusesByType(statusType);

  // Combinar status padrão com personalizados
  const allOptions = [
    ...options,
    ...typeCustomStatuses
  ];

  // Encontrar a configuração do status atual
  const currentStatus = allOptions.find(opt => opt.value === value) || options[0];

  const handleChipClick = (event) => {
    if (disabled || loading) return;
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
    handleMenuClose();
  };

  const handleCustomStatusClick = () => {
    setCustomStatusModal(true);
    handleMenuClose();
  };

  const handleCustomStatusCreate = async (newStatus) => {
    const createdStatus = addCustomStatus(newStatus);
    if (createdStatus && onStatusUpdate) {
      onStatusUpdate(createdStatus);
    }
    setCustomStatusModal(false);
  };

  // Renderizar label do chip
  const chipLabel = renderLabel ? renderLabel(currentStatus) : currentStatus?.label || value;
  
  // Renderizar ícone do chip
  const chipIcon = renderIcon ? renderIcon(currentStatus) : currentStatus?.icon;

  // Determinar cor do chip
  const chipColor = currentStatus?.color || color;

  return (
    <>
      <Box sx={{ position: 'relative', display: 'inline-block', ...sx }} className={className}>
        <Chip
          label={chipLabel}
          color={chipColor}
          size={size}
          variant={variant}
          icon={chipIcon}
          onClick={handleChipClick}
          disabled={disabled || loading}
          sx={{ 
            cursor: disabled || loading ? 'default' : 'pointer',
            '&:hover': {
              opacity: disabled || loading ? 1 : 0.8,
              transform: disabled || loading ? 'none' : 'scale(1.05)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        />
        {loading && (
          <CircularProgress 
            size={16} 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }} 
          />
        )}
      </Box>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            maxHeight: 300
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* Status padrão */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ px: 2, py: 1, fontWeight: 'bold', textTransform: 'uppercase' }}
        >
          Status Padrão
        </Typography>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            selected={value === option.value}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {option.icon}
            </ListItemIcon>
            <ListItemText>
              <Chip
                label={option.label}
                color={option.color}
                size="small"
                variant="outlined"
              />
            </ListItemText>
          </MenuItem>
        ))}

        {/* Status personalizados */}
        {customStatuses.filter(cs => cs.type === statusType).length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ px: 2, py: 1, fontWeight: 'bold', textTransform: 'uppercase' }}
            >
              Status Personalizados
            </Typography>
            {customStatuses
              .filter(cs => cs.type === statusType)
              .map((option) => (
                <MenuItem
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  selected={value === option.value}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    <Chip
                      label={option.label}
                      color={option.color}
                      size="small"
                      variant="outlined"
                    />
                  </ListItemText>
                </MenuItem>
              ))
            }
          </>
        )}

        {/* Opção de personalizar */}
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleCustomStatusClick}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AddIcon />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" color="primary">
              Personalizar Status
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Modal de Status Personalizado */}
      {customStatusModal && (
        <Suspense fallback={<CircularProgress />}>
          <CustomStatusModal
            open={customStatusModal}
            onClose={() => setCustomStatusModal(false)}
            onSave={handleCustomStatusCreate}
            statusType={statusType}
            existingStatuses={allOptions}
            loading={customStatusLoading}
          />
        </Suspense>
      )}
    </>
  );
};

export default EditableStatus;