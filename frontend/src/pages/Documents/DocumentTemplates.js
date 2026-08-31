import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Description,
  Visibility,
  Warning,
} from '@mui/icons-material';
import { documentService } from '../../services';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const DocumentTemplates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await documentService.getAllTemplates();
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await documentService.deleteTemplate(templateToDelete.id);
      toast.success('Template deleted successfully');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const canCreate = ['admin', 'supervisor'].includes(user?.role);
  const canEdit = ['admin', 'supervisor', 'staff'].includes(user?.role);
  const canDelete = ['admin', 'supervisor'].includes(user?.role);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Document Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Halaman untuk mengelola template dokumen kontrak
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/templates/create')}
            size="large"
          >
            Create Template
          </Button>
        )}
      </Box>

      {templates.length === 0 ? (
        <Alert severity="info">
          No templates found. {canCreate && 'Click "Create Template" to get started!'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Description color="primary" sx={{ fontSize: 32, mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                      {template.templateName}
                    </Typography>
                  </Box>

                  {template.category && (
                    <Chip label={template.category} size="small" sx={{ mb: 2 }} />
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description || 'No description'}
                  </Typography>

                  <Box display="flex" gap={1} mb={1}>
                    <Chip
                      label={`${template.fields?.length || 0} fields`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={template.status || 'draft'}
                      size="small"
                      color={template.status === 'published' ? 'success' : 'default'}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Used {template.usageCount || 0} times
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/templates/${template.id}`)}
                  >
                    <Visibility />
                  </IconButton>
                  {canEdit && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                    >
                      <Edit />
                    </IconButton>
                  )}
                  {canDelete && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(template)}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the template{' '}
            <strong>"{templateToDelete?.templateName}"</strong>?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All contracts using this template will still be accessible,
            but you won't be able to create new contracts from this template.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentTemplates;
