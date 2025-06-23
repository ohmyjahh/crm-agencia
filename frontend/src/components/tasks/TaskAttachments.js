import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Tooltip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Badge,
  Menu,
  MenuItem,
  Fade,
  Backdrop,
  Modal,
  TextField,
  Divider,
  Stack,
} from '@mui/material';
import {
  Attachment as AttachmentIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Code as CodeIcon,
  Archive as ZipIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Fullscreen as FullscreenIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { taskAPI } from '../../services/api';

const TaskAttachments = ({ taskId, onAttachmentChange }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'gallery'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [contextFile, setContextFile] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (taskId) {
      loadAttachments();
    }
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getAttachments(taskId);
      setAttachments(response.data.attachments);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    // Validar arquivo
    if (file.size > 25 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 25MB');
      return;
    }

    const allowedTypes = [
      'image/', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel', 'text/', 'application/zip',
      'application/x-rar-compressed', 'video/', 'audio/'
    ];
    
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      alert('Tipo de arquivo não suportado');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('attachment', file);
      
      // Simular progresso (em implementação real usaria XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      await taskAPI.uploadAttachment(taskId, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(async () => {
        await loadAttachments();
        if (onAttachmentChange) {
          onAttachmentChange();
        }
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      alert('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await taskAPI.downloadAttachment(taskId, attachment.id);
      
      // Criar URL do blob e fazer download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const handleDeleteClick = (attachment) => {
    setAttachmentToDelete(attachment);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await taskAPI.deleteAttachment(taskId, attachmentToDelete.id);
      await loadAttachments();
      
      if (onAttachmentChange) {
        onAttachmentChange();
      }
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
    } finally {
      setDeleteDialog(false);
      setAttachmentToDelete(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    handleFileSelect(files);
  };

  const getFileIcon = (mimeType, fileName) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon />;
    if (mimeType?.includes('pdf')) return <PdfIcon />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <DocIcon />;
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return <ExcelIcon />;
    if (mimeType?.startsWith('video/')) return <VideoIcon />;
    if (mimeType?.startsWith('audio/')) return <AudioIcon />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <ZipIcon />;
    if (mimeType?.startsWith('text/') || fileName?.endsWith('.js') || fileName?.endsWith('.css')) return <CodeIcon />;
    return <FileIcon />;
  };

  const isPreviewable = (mimeType) => {
    return mimeType?.startsWith('image/') || mimeType?.includes('pdf');
  };

  const handlePreview = (attachment) => {
    if (isPreviewable(attachment.mime_type)) {
      setSelectedFile(attachment);
      setPreviewOpen(true);
      setImageZoom(1);
      setImageRotation(0);
    } else {
      handleDownload(attachment);
    }
  };

  const handleContextMenu = (event, attachment) => {
    event.preventDefault();
    setContextFile(attachment);
    setMenuAnchor(event.currentTarget);
  };

  const handleRename = () => {
    setEditName(contextFile.original_name);
    setEditDialog(true);
    setMenuAnchor(null);
  };

  const handleShare = () => {
    const shareData = {
      title: contextFile.original_name,
      text: `Compartilhando arquivo: ${contextFile.original_name}`,
      url: `${window.location.origin}/attachments/${contextFile.id}`
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Link copiado para a área de transferência!');
    }
    setMenuAnchor(null);
  };

  const getFileTypeChip = (mimeType) => {
    if (mimeType?.startsWith('image/')) {
      return <Chip label="Imagem" size="small" color="primary" />;
    }
    if (mimeType?.includes('pdf')) {
      return <Chip label="PDF" size="small" color="error" />;
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return <Chip label="Documento" size="small" color="info" />;
    }
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
      return <Chip label="Planilha" size="small" color="success" />;
    }
    return <Chip label="Arquivo" size="small" color="default" />;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatFileSize = (sizeInMB) => {
    const size = parseFloat(sizeInMB);
    if (size < 1) {
      return `${(size * 1024).toFixed(0)} KB`;
    }
    return `${size.toFixed(1)} MB`;
  };

  const renderGridView = () => (
    <Grid container spacing={2}>
      {attachments.map((attachment) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={attachment.id}>
          <Card 
            sx={{ 
              height: '100%',
              '&:hover': { boxShadow: 4 },
              cursor: 'pointer'
            }}
            onContextMenu={(e) => handleContextMenu(e, attachment)}
          >
            {attachment.mime_type?.startsWith('image/') ? (
              <CardMedia
                component="img"
                height="120"
                image={`/api/tasks/${taskId}/attachments/${attachment.id}/preview`}
                alt={attachment.original_name}
                onClick={() => handlePreview(attachment)}
                sx={{ objectFit: 'cover' }}
              />
            ) : (
              <Box 
                sx={{ 
                  height: 120, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'action.hover'
                }}
                onClick={() => handlePreview(attachment)}
              >
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                  {getFileIcon(attachment.mime_type, attachment.original_name)}
                </Avatar>
              </Box>
            )}
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body2" noWrap title={attachment.original_name}>
                {attachment.original_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(attachment.file_size_mb)}
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 1, pt: 0 }}>
              <Tooltip title="Visualizar">
                <IconButton size="small" onClick={() => handlePreview(attachment)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={() => handleDownload(attachment)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remover">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDeleteClick(attachment)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderGalleryView = () => {
    const imageAttachments = attachments.filter(att => att.mime_type?.startsWith('image/'));
    const otherAttachments = attachments.filter(att => !att.mime_type?.startsWith('image/'));
    
    return (
      <Box>
        {imageAttachments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Imagens ({imageAttachments.length})
            </Typography>
            <ImageList cols={4} gap={8}>
              {imageAttachments.map((attachment) => (
                <ImageListItem key={attachment.id}>
                  <img
                    src={`/api/tasks/${taskId}/attachments/${attachment.id}/preview`}
                    alt={attachment.original_name}
                    loading="lazy"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handlePreview(attachment)}
                  />
                  <ImageListItemBar
                    title={attachment.original_name}
                    actionIcon={
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        onClick={() => handlePreview(attachment)}
                      >
                        <ViewIcon />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}
        
        {otherAttachments.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Outros Arquivos ({otherAttachments.length})
            </Typography>
            <Grid container spacing={1}>
              {otherAttachments.map((attachment) => (
                <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getFileIcon(attachment.mime_type, attachment.original_name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {attachment.original_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.file_size_mb)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => handleDownload(attachment)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho com Controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Anexos ({attachments.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('list')}
          >
            Lista
          </Button>
          <Button
            size="small"
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
          >
            Grade
          </Button>
          <Button
            size="small"
            variant={viewMode === 'gallery' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('gallery')}
          >
            Galeria
          </Button>
        </Box>
      </Box>

      {/* Área de Upload */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          border: dragOver ? '2px dashed' : '1px solid',
          borderColor: dragOver ? 'primary.main' : 'divider',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'primary.main',
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar,.mp4,.mp3"
          multiple
        />
        
        {uploading ? (
          <Box>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enviando arquivo...
            </Typography>
            {uploadProgress > 0 && (
              <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1 }}>
                      <Box 
                        sx={{ 
                          width: `${uploadProgress}%`, 
                          height: 4, 
                          bgcolor: 'primary.main', 
                          borderRadius: 1,
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption">{uploadProgress}%</Typography>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Arraste arquivos aqui ou clique para selecionar
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Suporte para múltiplos arquivos
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
              <Chip label="Imagens" size="small" variant="outlined" />
              <Chip label="PDF" size="small" variant="outlined" />
              <Chip label="Office" size="small" variant="outlined" />
              <Chip label="Vídeo" size="small" variant="outlined" />
              <Chip label="Áudio" size="small" variant="outlined" />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Tamanho máximo: 25MB por arquivo
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Visualização dos Anexos */}
      {attachments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <AttachmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum anexo ainda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Adicione arquivos para compartilhar com a equipe
          </Typography>
        </Paper>
      ) : (
        <Box>
          {viewMode === 'list' && (
            <List disablePadding>
              {attachments.map((attachment) => (
                <ListItem 
                  key={attachment.id} 
                  divider
                  onContextMenu={(e) => handleContextMenu(e, attachment)}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Badge 
                      badgeContent={isPreviewable(attachment.mime_type) ? <ViewIcon fontSize="small" /> : null}
                      color="primary"
                    >
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        {getFileIcon(attachment.mime_type, attachment.original_name)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          noWrap 
                          sx={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => handlePreview(attachment)}
                        >
                          {attachment.original_name}
                        </Typography>
                        {getFileTypeChip(attachment.mime_type)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.file_size_mb)} • {attachment.user_name}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(attachment.created_at)}
                        </Typography>
                        {attachment.description && (
                          <>
                            <br />
                            <Typography variant="caption">
                              {attachment.description}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {isPreviewable(attachment.mime_type) && (
                        <Tooltip title="Visualizar">
                          <IconButton
                            edge="end"
                            onClick={() => handlePreview(attachment)}
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(attachment)}
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mais opções">
                        <IconButton
                          edge="end"
                          onClick={(e) => handleContextMenu(e, attachment)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'gallery' && renderGalleryView()}
        </Box>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      {/* Menu de Contexto */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handlePreview(contextFile); setMenuAnchor(null); }}>
          <ViewIcon sx={{ mr: 1 }} /> Visualizar
        </MenuItem>
        <MenuItem onClick={() => { handleDownload(contextFile); setMenuAnchor(null); }}>
          <DownloadIcon sx={{ mr: 1 }} /> Download
        </MenuItem>
        <MenuItem onClick={handleRename}>
          <EditIcon sx={{ mr: 1 }} /> Renomear
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <ShareIcon sx={{ mr: 1 }} /> Compartilhar
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleDeleteClick(contextFile); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Remover
        </MenuItem>
      </Menu>

      {/* Dialog de Preview */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={previewOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            height: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header do Preview */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" noWrap>
                {selectedFile?.original_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedFile?.mime_type?.startsWith('image/') && (
                  <>
                    <IconButton onClick={() => setImageZoom(prev => Math.max(0.1, prev - 0.1))}>
                      <ZoomOutIcon />
                    </IconButton>
                    <IconButton onClick={() => setImageZoom(prev => Math.min(3, prev + 0.1))}>
                      <ZoomInIcon />
                    </IconButton>
                    <IconButton onClick={() => setImageRotation(prev => prev - 90)}>
                      <RotateLeftIcon />
                    </IconButton>
                    <IconButton onClick={() => setImageRotation(prev => prev + 90)}>
                      <RotateRightIcon />
                    </IconButton>
                  </>
                )}
                <IconButton onClick={() => handleDownload(selectedFile)}>
                  <GetAppIcon />
                </IconButton>
                <IconButton onClick={() => setPreviewOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
            
            {/* Conteúdo do Preview */}
            <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              {selectedFile?.mime_type?.startsWith('image/') ? (
                <img
                  src={`/api/tasks/${taskId}/attachments/${selectedFile.id}/preview`}
                  alt={selectedFile.original_name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                />
              ) : selectedFile?.mime_type?.includes('pdf') ? (
                <iframe
                  src={`/api/tasks/${taskId}/attachments/${selectedFile.id}/preview`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={selectedFile.original_name}
                />
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    {getFileIcon(selectedFile?.mime_type, selectedFile?.original_name)}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Preview não disponível
                  </Typography>
                  <Button variant="contained" onClick={() => handleDownload(selectedFile)}>
                    Fazer Download
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Dialog de Exclusão */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Remover Anexo</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o arquivo "{attachmentToDelete?.original_name}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Renomear Arquivo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome do arquivo"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={() => { /* implementar rename */ setEditDialog(false); }} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskAttachments;