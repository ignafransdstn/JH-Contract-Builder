import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete,
  Add,
  ArrowBack,
  ArrowForward,
  Save,
  Publish,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { documentService, userService } from '../../services';

const FIELD_TYPES = [
  { value: 'text', label: 'Text (Single Line)' },
  { value: 'textarea', label: 'Text Area (Multiple Lines)' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'currency', label: 'Currency' },
];

const STEPS = ['Edit Fields', 'Edit Approval', 'Preview & Save'];

const EditTemplate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Template data
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('draft');

  // Fields
  const [fields, setFields] = useState([]);

  // Approval Matrix
  const [reviewers, setReviewers] = useState([]);
  const [approvers1, setApprovers1] = useState([]);
  const [approvers2, setApprovers2] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedApprover1, setSelectedApprover1] = useState('');
  const [selectedApprover2, setSelectedApprover2] = useState('');

  useEffect(() => {
    loadTemplate();
    loadUsers();
  }, [id]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const response = await documentService.getTemplateById(id);
      const template = response.data.data;
      
      setTemplateName(template.templateName);
      setDescription(template.description || '');
      setCategory(template.category || '');
      setStatus(template.status || 'draft');
      setFields(template.fields || []);
      
      // Load approval matrix
      if (template.approvalMatrix) {
        setSelectedReviewer(template.approvalMatrix.reviewerId || '');
        setSelectedApprover1(template.approvalMatrix.approver1Id || '');
        setSelectedApprover2(template.approvalMatrix.approver2Id || '');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsersForApproval();
      const allUsers = response.data.data || [];

      const reviewerRoles = ['supervisor', 'staff', 'admin'];
      setReviewers(allUsers.filter(u => reviewerRoles.includes(u.role)));

      const approver1Roles = ['manager', 'c-level', 'admin'];
      setApprovers1(allUsers.filter(u => approver1Roles.includes(u.role)));

      const approver2Roles = ['c-level', 'admin'];
      setApprovers2(allUsers.filter(u => approver2Roles.includes(u.role)));
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        validation: '',
        order: fields.length + 1,
        options: '',
      },
    ]);
  };

  const handleRemoveField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Update order
    newFields.forEach((field, i) => {
      field.order = i + 1;
    });
    setFields(newFields);
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...fields];
    newFields[index][field] = value;
    setFields(newFields);
  };

  const validateFields = () => {
    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return false;
    }
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        toast.error(`Field ${i + 1}: Label is required`);
        return false;
      }
      if ((fields[i].type === 'dropdown' || fields[i].type === 'radio') && !fields[i].options.trim()) {
        toast.error(`Field ${i + 1}: Options are required for ${fields[i].type}`);
        return false;
      }
    }
    return true;
  };

  const validateApprovalMatrix = () => {
    if (!selectedReviewer) {
      toast.error('Please select a Reviewer');
      return false;
    }
    if (!selectedApprover1) {
      toast.error('Please select Approver Layer 1');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validateFields()) return;
    }
    if (activeStep === 1) {
      if (!validateApprovalMatrix()) return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async (newStatus = status) => {
    if (!validateFields() || !validateApprovalMatrix()) return;

    setSaving(true);
    try {
      const approvalMatrix = {
        reviewerId: selectedReviewer,
        approver1Id: selectedApprover1,
        approver2Id: selectedApprover2 || null,
      };

      await documentService.updateTemplate(id, {
        templateName,
        description,
        category,
        fields,
        approvalMatrix,
        status: newStatus,
      });

      toast.success(`Template ${newStatus === 'draft' ? 'saved' : 'published'} successfully!`);
      navigate('/templates');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Template Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Form Fields</Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddField}
              >
                Add Field
              </Button>
            </Box>

            {fields.map((field, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Field {index + 1}
                    </Typography>
                    <IconButton color="error" onClick={() => handleRemoveField(index)}>
                      <Delete />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Field Label"
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Field Type</InputLabel>
                        <Select
                          value={field.type}
                          label="Field Type"
                          onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        >
                          {FIELD_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Placeholder"
                        value={field.placeholder}
                        onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Validation (e.g., max:100)"
                        value={field.validation}
                        onChange={(e) => handleFieldChange(index, 'validation', e.target.value)}
                      />
                    </Grid>
                    {(field.type === 'dropdown' || field.type === 'radio') && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Options (comma separated)"
                          value={field.options}
                          onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                          placeholder="Option 1, Option 2, Option 3"
                          helperText="Enter options separated by commas"
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.required}
                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          />
                        }
                        label="Required Field"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Setup Approval Matrix
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Define who will review and approve contracts created from this template.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Reviewer *</InputLabel>
                  <Select
                    value={selectedReviewer}
                    label="Reviewer *"
                    onChange={(e) => setSelectedReviewer(e.target.value)}
                  >
                    {reviewers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.role} ({user.department || 'No dept'})
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    First review (Mandatory) - Supervisor, Staff, or Admin
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Approver Layer 1 *</InputLabel>
                  <Select
                    value={selectedApprover1}
                    label="Approver Layer 1 *"
                    onChange={(e) => setSelectedApprover1(e.target.value)}
                  >
                    {approvers1.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.role} ({user.department || 'No dept'})
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    First approval (Mandatory) - Manager, C-Level, or Admin
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Approver Layer 2 (Optional)</InputLabel>
                  <Select
                    value={selectedApprover2}
                    label="Approver Layer 2 (Optional)"
                    onChange={(e) => setSelectedApprover2(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {approvers2.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.role} ({user.department || 'No dept'})
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Second approval (Optional) - C-Level or Admin
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preview & Save
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your template configuration before saving.
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Template Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Name:</Typography>
                    <Typography variant="body1">{templateName}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Category:</Typography>
                    <Typography variant="body1">{category || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Description:</Typography>
                    <Typography variant="body1">{description || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Chip 
                      label={status} 
                      color={status === 'published' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Form Fields ({fields.length})
                </Typography>
                {fields.map((field, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {index + 1}. {field.label}
                      {field.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                      {field.placeholder && ` | Placeholder: ${field.placeholder}`}
                    </Typography>
                    {field.options && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Options: {field.options}
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Approval Flow
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>1. Reviewer:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reviewers.find(u => u.id === selectedReviewer)?.name || 'Not selected'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>2. Approver Layer 1:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {approvers1.find(u => u.id === selectedApprover1)?.name || 'Not selected'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>3. Approver Layer 2:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedApprover2 ? approvers2.find(u => u.id === selectedApprover2)?.name : 'Not Required'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/templates')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Edit Document Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modify template fields and approval matrix
          </Typography>
        </Box>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {renderStepContent()}

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || saving}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Box>
              {activeStep === STEPS.length - 1 ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    startIcon={<Save />}
                    sx={{ mr: 2 }}
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleSave('published')}
                    disabled={saving}
                    startIcon={<Publish />}
                  >
                    {saving ? 'Publishing...' : 'Publish'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditTemplate;
