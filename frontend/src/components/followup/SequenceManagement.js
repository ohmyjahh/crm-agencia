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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  List as StepsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import SequenceFormModal from './SequenceFormModal';
import SequenceViewModal from './SequenceViewModal';

const SequenceManagement = () => {
  const { user } = useAuth();
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados dos modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const params = {
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await api.get('/followups/sequences', { params });
      setSequences(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar cadências:', error);
      setError('Erro ao carregar cadências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, [searchTerm]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCreateSequence = () => {
    setSelectedSequence(null);
    setFormModalOpen(true);
  };

  const handleEditSequence = (sequence) => {
    setSelectedSequence(sequence);
    setFormModalOpen(true);
  };

  const handleViewSequence = (sequence) => {
    setSelectedSequence(sequence);
    setViewModalOpen(true);
  };

  const handleDeleteSequence = async (sequenceId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta cadência?')) {
      return;
    }

    try {
      await api.delete(`/followups/sequences/${sequenceId}`);
      setSuccess('Cadência deletada com sucesso');
      fetchSequences();
    } catch (error) {
      console.error('Erro ao deletar cadência:', error);
      setError(error.response?.data?.message || 'Erro ao deletar cadência');
    }
  };

  const handleModalClose = () => {
    setFormModalOpen(false);
    setViewModalOpen(false);
    setSelectedSequence(null);
  };

  const handleSequenceSaved = () => {
    fetchSequences();
    handleModalClose();
    setSuccess('Cadência salva com sucesso');
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Cadastros de Cadências
        </Typography>
        {user?.role === 'administrador' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSequence}
          >
            Nova Cadência
          </Button>
        )}
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

      {/* Busca */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Buscar cadências"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="center">Passos</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado por</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sequences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma cadência encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sequences.map((sequence) => (
                <TableRow key={sequence.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {sequence.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {sequence.description || 'Sem descrição'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StepsIcon sx={{ mr: 0.5, fontSize: 16 }} />
                      <Typography variant="body2" fontWeight="medium">
                        {sequence.steps_count || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sequence.is_active ? 'Ativa' : 'Inativa'}
                      color={getStatusColor(sequence.is_active)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {sequence.created_by_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Visualizar">
                        <IconButton
                          size="small"
                          onClick={() => handleViewSequence(sequence)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {user?.role === 'administrador' && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditSequence(sequence)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Deletar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteSequence(sequence.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modais */}
      <SequenceFormModal
        open={formModalOpen}
        onClose={handleModalClose}
        onSave={handleSequenceSaved}
        sequence={selectedSequence}
      />
      
      <SequenceViewModal
        open={viewModalOpen}
        onClose={handleModalClose}
        sequence={selectedSequence}
        onEdit={handleEditSequence}
      />
    </Box>
  );
};

export default SequenceManagement;