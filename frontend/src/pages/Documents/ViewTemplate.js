import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Description,
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { documentService, userService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const FIELD_TYPE_LABELS = {
  text: 'Text (Single Line)',
  textarea: 'Text Area (Multiple Lines)',
  number: 'Number',
  date: 'Date',
  dropdown: 'Dropdown',
  radio: 'Radio Buttons',
  checkbox: 'Checkbox',
  email: 'Email',
  phone: 'Phone Number',
  currency: 'Currency',
};

const ViewTemplate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [reviewer, setReviewer] = useState(null);
  const [approver1, setApprover1] = useState(null);
  const [approver2, setApprover2] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const response = await documentService.getTemplateById(id);
      const templateData = response.data.data;
      setTemplate(templateData);

      // Load approver details
      if (templateData.approvalMatrix) {
        if (templateData.approvalMatrix.reviewerId) {
          const reviewerRes = await userService.getUserById(templateData.approvalMatrix.reviewerId);
          setReviewer(reviewerRes.data.data);
        }
        if (templateData.approvalMatrix.approver1Id) {
          const approver1Res = await userService.getUserById(templateData.approvalMatrix.approver1Id);
          setApprover1(approver1Res.data.data);
        }
        if (templateData.approvalMatrix.approver2Id) {
          const approver2Res = await userService.getUserById(templateData.approvalMatrix.approver2Id);
          setApprover2(approver2Res.data.data);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await documentService.deleteTemplate(id);
      toast.success('Template deleted successfully');
      setDeleteDialogOpen(false);
      navigate('/templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const canEdit = ['admin', 'supervisor', 'staff'].includes(user?.role);
  const canDelete = ['admin', 'supervisor'].includes(user?.role);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box>
        <Alert severity="error">Template not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/templates')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {template.templateName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Template Details & Preview
            </Typography>
          </Box>
        </Box>
        <Box>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/templates/${id}/edit`)}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Template Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Template Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Template Name:</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {template.templateName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {template.category || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip 
                    label={template.status || 'draft'} 
                    color={template.status === 'published' ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Usage Count:</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {template.usageCount || 0} times
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Description:</Typography>
                  <Typography variant="body1">
                    {template.description || 'No description'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Original File:</Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Description color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {template.originalFileName}
                    </Typography>
                    <Chip 
                      label={template.fileType?.toUpperCase()} 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Form Fields ({template.fields?.length || 0})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {template.fields && template.fields.length > 0 ? (
                template.fields.map((field, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight={600}>
                          {index + 1}. {typeof field.label === 'object' ? JSON.stringify(field.label) : field.label}
                        </Typography>
                        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                          <Chip 
                            label={FIELD_TYPE_LABELS[field.type] || (typeof field.type === 'object' ? JSON.stringify(field.type) : field.type)} 
                            size="small" 
                            variant="outlined"
                          />
                          {field.required && (
                            <Chip 
                              label="Required" 
                              size="small" 
                              color="error" 
                              icon={<CheckCircle />}
                            />
                          )}
                          {field.placeholder && (
                            <Chip 
                              label={`Placeholder: ${typeof field.placeholder === 'object' ? JSON.stringify(field.placeholder) : field.placeholder}`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {field.options && (
                          <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              Options: {Array.isArray(field.options) 
                                ? field.options.join(', ') 
                                : typeof field.options === 'object' 
                                  ? JSON.stringify(field.options) 
                                  : field.options}
                            </Typography>
                          </Box>
                        )}
                        {field.validation && (
                          <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              Validation: {typeof field.validation === 'object' 
                                ? JSON.stringify(field.validation) 
                                : field.validation}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Alert severity="info">No fields defined</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Approval Matrix */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Approval Flow
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  1. Reviewer (First Review)
                </Typography>
                {reviewer ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {typeof reviewer.name === 'object' ? JSON.stringify(reviewer.name) : reviewer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {typeof reviewer.role === 'object' ? JSON.stringify(reviewer.role) : reviewer.role} - {typeof reviewer.department === 'object' ? JSON.stringify(reviewer.department) : (reviewer.department || 'No dept')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Not set</Typography>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  2. Approver Layer 1
                </Typography>
                {approver1 ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {typeof approver1.name === 'object' ? JSON.stringify(approver1.name) : approver1.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {typeof approver1.role === 'object' ? JSON.stringify(approver1.role) : approver1.role} - {typeof approver1.department === 'object' ? JSON.stringify(approver1.department) : (approver1.department || 'No dept')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Not set</Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  3. Approver Layer 2 (Optional)
                </Typography>
                {approver2 ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {typeof approver2.name === 'object' ? JSON.stringify(approver2.name) : approver2.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {typeof approver2.role === 'object' ? JSON.stringify(approver2.role) : approver2.role} - {typeof approver2.department === 'object' ? JSON.stringify(approver2.department) : (approver2.department || 'No dept')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={1}>
                    <RadioButtonUnchecked fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">Not required</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Document Preview */}
          {template.extractedText && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Document Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    maxHeight: 400, 
                    overflow: 'auto', 
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.6
                    }}
                  >
                    {template.extractedText.substring(0, 2000)}
                    {template.extractedText.length > 2000 && '...'}
                  </Typography>
                </Paper>
                
                {template.extractedText.length > 2000 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Showing first 2000 characters
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

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
            <strong>"{template?.templateName}"</strong>?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All contracts using this template will still be accessible,
            but you won't be able to create new contracts from this template.
          </Alert>
          {template?.usageCount > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              This template has been used <strong>{template.usageCount} time(s)</strong> to create contracts.
            </Alert>
          )}
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

export default ViewTemplate;
