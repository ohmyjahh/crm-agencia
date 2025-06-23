import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  SkipNext as SkipIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as WhatsAppIcon,
  Event as MeetingIcon,
  More as OtherIcon
} from '@mui/icons-material';
import api from '../../services/api';

const MyFollowups = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Estados do modal de conclusão
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const params = {
        filter: filter
      };
      
      const response = await api.get('/followups/my-followups', { params });
      setFollowups(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar follow-ups:', error);
      setError('Erro ao carregar follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [filter]);

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleCompleteFollowup = (followup) => {
    setSelectedFollowup(followup);
    setCompletionNotes('');
    setCompleteModalOpen(true);
  };

  const handleSkipFollowup = (followup) => {
    setSelectedFollowup(followup);
    setSkipReason('');
    setSkipModalOpen(true);
  };

  const confirmComplete = async () => {
    if (!selectedFollowup) return;

    setActionLoading(true);
    try {
      await api.put(`/followups/my-followups/${selectedFollowup.id}/complete`, {
        completion_notes: completionNotes
      });
      
      setSuccess('Follow-up marcado como concluído');
      setCompleteModalOpen(false);
      fetchFollowups();
    } catch (error) {
      console.error('Erro ao concluir follow-up:', error);
      setError(error.response?.data?.message || 'Erro ao concluir follow-up');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmSkip = async () => {
    if (!selectedFollowup) return;

    setActionLoading(true);
    try {
      await api.put(`/followups/my-followups/${selectedFollowup.id}/skip`, {
        skip_reason: skipReason
      });
      
      setSuccess('Follow-up pulado com sucesso');
      setSkipModalOpen(false);
      fetchFollowups();
    } catch (error) {
      console.error('Erro ao pular follow-up:', error);
      setError(error.response?.data?.message || 'Erro ao pular follow-up');
    } finally {
      setActionLoading(false);
    }
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

  const getStatusColor = (status, scheduledDate) => {
    if (status !== 'pending') return 'default';
    
    const today = new Date().toISOString().split('T')[0];
    const scheduled = new Date(scheduledDate).toISOString().split('T')[0];
    
    if (scheduled < today) return 'error'; // Atrasado
    if (scheduled === today) return 'warning'; // Hoje
    return 'info'; // Futuro
  };

  const getStatusLabel = (status, scheduledDate) => {
    if (status !== 'pending') return status;
    
    const today = new Date().toISOString().split('T')[0];
    const scheduled = new Date(scheduledDate).toISOString().split('T')[0];
    
    if (scheduled < today) return 'Atrasado';
    if (scheduled === today) return 'Hoje';
    return 'Agendado';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isPending = (status) => status === 'pending' || status === 'overdue';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Meus Follow-ups
        </Typography>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Filtro</InputLabel>
          <Select
            value={filter}
            label="Filtro"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="today">Do Dia</MenuItem>
            <MenuItem value="upcoming">Próximos</MenuItem>
            <MenuItem value="overdue">Atrasados</MenuItem>
            <MenuItem value="pending">Pendentes</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Cadência</TableCell>
              <TableCell>Passo</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Data Agendada</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : followups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhum follow-up encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              followups.map((followup) => (
                <TableRow key={followup.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {followup.client_name}
                      </Typography>
                      {followup.client_email && (
                        <Typography variant="caption" color="text.secondary">
                          {followup.client_email}
                        </Typography>
                      )}
                      {followup.client_phone && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {followup.client_phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {followup.sequence_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {followup.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Passo {followup.step_order}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getInteractionIcon(followup.interaction_type)}
                      <Chip
                        label={getInteractionLabel(followup.interaction_type)}
                        color={getInteractionColor(followup.interaction_type)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(followup.scheduled_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(followup.status, followup.scheduled_date)}
                      color={getStatusColor(followup.status, followup.scheduled_date)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {isPending(followup.status) && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          startIcon={<CompleteIcon />}
                          onClick={() => handleCompleteFollowup(followup)}
                          color="success"
                          variant="outlined"
                        >
                          Concluir
                        </Button>
                        <Button
                          size="small"
                          startIcon={<SkipIcon />}
                          onClick={() => handleSkipFollowup(followup)}
                          color="warning"
                          variant="outlined"
                        >
                          Pular
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Conclusão */}
      <Dialog open={completeModalOpen} onClose={() => setCompleteModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Marcar como Concluído</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adicione observações sobre o follow-up realizado:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Descreva como foi o contato, próximos passos, etc."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteModalOpen(false)}>Cancelar</Button>
          <Button 
            onClick={confirmComplete} 
            variant="contained" 
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Pular */}
      <Dialog open={skipModalOpen} onClose={() => setSkipModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pular Follow-up</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Motivo para pular este follow-up:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Ex: Cliente não atendeu, reagendado para outra data, etc."
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkipModalOpen(false)}>Cancelar</Button>
          <Button 
            onClick={confirmSkip} 
            variant="contained" 
            color="warning"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Pular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyFollowups;