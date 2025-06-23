import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Stop as StopIcon,
  Schedule as RescheduleIcon
} from '@mui/icons-material';
import api from '../../services/api';
import AssignmentFormModal from './AssignmentFormModal';

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Estados do modal
  const [formModalOpen, setFormModalOpen] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = {
        ...(statusFilter && { status: statusFilter })
      };
      
      const response = await api.get('/followups/assignments', { params });
      setAssignments(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar atribuições:', error);
      setError('Erro ao carregar atribuições');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleCreateAssignment = () => {
    setFormModalOpen(true);
  };

  const handleStopAssignment = async (assignmentId) => {
    if (!window.confirm('Tem certeza que deseja parar esta cadência?')) {
      return;
    }

    try {
      await api.put(`/followups/assignments/${assignmentId}/stop`);
      setSuccess('Cadência interrompida com sucesso');
      fetchAssignments();
    } catch (error) {
      console.error('Erro ao parar cadência:', error);
      setError(error.response?.data?.message || 'Erro ao parar cadência');
    }
  };

  const handleModalClose = () => {
    setFormModalOpen(false);
  };

  const handleAssignmentSaved = () => {
    fetchAssignments();
    handleModalClose();
    setSuccess('Cadência atribuída com sucesso');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Atribuir Cadências
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAssignment}
        >
          Nova Atribuição
        </Button>
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
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilter}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="active">Ativa</MenuItem>
            <MenuItem value="paused">Pausada</MenuItem>
            <MenuItem value="completed">Concluída</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
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
              <TableCell>Responsável</TableCell>
              <TableCell>Data Início</TableCell>
              <TableCell>Próximo Follow-up</TableCell>
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
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma atribuição encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.client_name}
                      </Typography>
                      {assignment.client_email && (
                        <Typography variant="caption" color="text.secondary">
                          {assignment.client_email}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {assignment.sequence_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {assignment.responsible_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(assignment.start_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {assignment.pending_followups > 0 ? (
                      <Chip
                        label={`${assignment.pending_followups} pendente${assignment.pending_followups > 1 ? 's' : ''}`}
                        color="warning"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nenhum pendente
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(assignment.status)}
                      color={getStatusColor(assignment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {assignment.status === 'active' && (
                        <Button
                          size="small"
                          startIcon={<StopIcon />}
                          onClick={() => handleStopAssignment(assignment.id)}
                          color="error"
                        >
                          Parar
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal */}
      <AssignmentFormModal
        open={formModalOpen}
        onClose={handleModalClose}
        onSave={handleAssignmentSaved}
      />
    </Box>
  );
};

export default AssignmentManagement;