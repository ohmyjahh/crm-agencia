import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as WhatsAppIcon,
  Event as MeetingIcon,
  More as OtherIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SequenceViewModal = ({ open, onClose, sequence, onEdit }) => {
  const { user } = useAuth();

  if (!sequence) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'ligacao': return <PhoneIcon />;
      case 'email': return <EmailIcon />;
      case 'whatsapp': return <WhatsAppIcon />;
      case 'reuniao': return <MeetingIcon />;
      default: return <OtherIcon />;
    }
  };

  const getInteractionColor = (type) => {
    switch (type) {
      case 'ligacao': return 'primary';
      case 'email': return 'info';
      case 'whatsapp': return 'success';
      case 'reuniao': return 'warning';
      default: return 'default';
    }
  };

  const getInteractionLabel = (type) => {
    switch (type) {
      case 'ligacao': return 'Ligação';
      case 'email': return 'E-mail';
      case 'whatsapp': return 'WhatsApp';
      case 'reuniao': return 'Reunião';
      default: return 'Outro';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="bold">
          Detalhes da Cadência
        </Typography>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {sequence.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={sequence.is_active ? 'Ativa' : 'Inativa'}
                  color={sequence.is_active ? 'success' : 'default'}
                  size="small"
                />
                <Chip
                  label={`${sequence.steps?.length || 0} passos`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {sequence.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body1">
                    {sequence.description}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Passos da Cadência */}
          {sequence.steps && sequence.steps.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Passos da Cadência
                </Typography>
                
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Dia</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Observações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sequence.steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step, index) => (
                      <TableRow key={step.id || index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {step.step_order}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            Dia {step.day_offset}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getInteractionIcon(step.interaction_type)}
                            <Chip
                              label={getInteractionLabel(step.interaction_type)}
                              color={getInteractionColor(step.interaction_type)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {step.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {step.notes || 'Sem observações'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          )}

          {/* Informações do Sistema */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Informações do Sistema
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Criado em:
                </Typography>
                <Typography variant="body2">
                  {formatDate(sequence.created_at)}
                </Typography>
              </Grid>
              
              {sequence.updated_at && sequence.updated_at !== sequence.created_at && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Última atualização:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(sequence.updated_at)}
                  </Typography>
                </Grid>
              )}
              
              {sequence.created_by_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Criado por:
                  </Typography>
                  <Typography variant="body2">
                    {sequence.created_by_name}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} size="large">
          Fechar
        </Button>
        
        {user?.role === 'administrador' && (
          <Button 
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => onEdit(sequence)}
            size="large"
          >
            Editar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SequenceViewModal;