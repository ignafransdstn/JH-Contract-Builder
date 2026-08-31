import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import {
  CloudUpload,
  Add,
  Delete,
  ArrowBack,
  ArrowForward,
  Save,
  Visibility,
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

const STEPS = ['Upload Document', 'Define Fields', 'Setup Approval', 'Preview & Publish'];

const CreateTemplate = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Upload
  const [file, setFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [templateId, setTemplateId] = useState(null);
  const [extractedText, setExtractedText] = useState('');

  // Step 2: Fields
  const [fields, setFields] = useState([
    {
      label: '',
      type: 'text',
      required: true,
      placeholder: '',
      validation: '',
      order: 1,
      options: '',
    },
  ]);

  // Step 3: Approval Matrix
  const [reviewers, setReviewers] = useState([]);
  const [approvers1, setApprovers1] = useState([]);
  const [approvers2, setApprovers2] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedApprover1, setSelectedApprover1] = useState('');
  const [selectedApprover2, setSelectedApprover2] = useState('');

  // NEW: Targeted Users feature
  const [isTargeted, setIsTargeted] = useState(false); // Toggle for targeted mode
  const [allUsers, setAllUsers] = useState([]); // All users for targeting
  const [targetedUserIds, setTargetedUserIds] = useState([]); // Selected user IDs

  // Load users for approval matrix
  useEffect(() => {
    if (activeStep === 2) {
      loadUsers();
    }
  }, [activeStep]);

  const loadUsers = async () => {
    try {
      // Get all active users for approval matrix
      const response = await userService.getAllUsersForApproval();
      const allUsersData = response.data.data || [];

      // Store all users for targeted feature
      setAllUsers(allUsersData);

      // Filter reviewers (supervisor, staff, admin)
      const reviewerRoles = ['supervisor', 'staff', 'admin'];
      setReviewers(allUsersData.filter(u => reviewerRoles.includes(u.role)));

      // Filter approvers layer 1 (manager, c-level, admin)
      const approver1Roles = ['manager', 'c-level', 'admin'];
      setApprovers1(allUsersData.filter(u => approver1Roles.includes(u.role)));

      // Filter approvers layer 2 (c-level, admin)
      const approver2Roles = ['c-level', 'admin'];
      setApprovers2(allUsersData.filter(u => approver2Roles.includes(u.role)));
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only PDF, Word, and Excel files are allowed');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!templateName.trim()) {
      toast.error('Please enter template name');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('templateName', templateName);
      formData.append('description', description);
      formData.append('category', category);

      const response = await documentService.uploadSimple(formData);
      
      // Extract ID from response data
      const uploadedId = response.data.data.id;
      console.log('Template uploaded with ID:', uploadedId);
      
      setTemplateId(uploadedId);
      setExtractedText(response.data.data.extractedText || '');
      
      // Auto-extract placeholders from Word document
      if (file.name.endsWith('.docx')) {
        toast.info('Extracting placeholders from document...', { duration: 2000 });
        try {
          const placeholdersResponse = await documentService.extractPlaceholders(uploadedId);
          const autoFields = placeholdersResponse.data.data.autoFields || [];
          
          if (autoFields.length > 0) {
            setFields(autoFields);
            toast.success(`Found ${autoFields.length} placeholders! Fields auto-generated.`, {
              duration: 5000
            });
          } else {
            toast.info('No placeholders found. You can manually add fields.');
          }
        } catch (extractError) {
          console.warn('Placeholder extraction failed:', extractError);
          toast.warning('Could not extract placeholders. You can manually add fields.');
        }
      }
      
      toast.success('Document uploaded successfully!');
      setActiveStep(1);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
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
    if (fields.length === 1) {
      toast.warning('At least one field is required');
      return;
    }
    const newFields = fields.filter((_, i) => i !== index);
    // Update order
    newFields.forEach((field, idx) => {
      field.order = idx + 1;
    });
    setFields(newFields);
  };

  const handleFieldChange = (index, property, value) => {
    const newFields = [...fields];
    newFields[index][property] = value;
    setFields(newFields);
  };

  const validateFields = () => {
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        toast.error(`Field ${i + 1}: Label is required`);
        return false;
      }
      if (['dropdown', 'radio'].includes(fields[i].type) && !fields[i].options.trim()) {
        toast.error(`Field ${i + 1}: Options are required for ${fields[i].type} type`);
        return false;
      }
    }
    return true;
  };

  const validateApprovalMatrix = () => {
    if (!selectedReviewer) {
      toast.error('Please select a reviewer');
      return false;
    }
    if (!selectedApprover1) {
      toast.error('Please select Approver Layer 1');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (!validateFields()) return;
    }
    if (activeStep === 2) {
      if (!validateApprovalMatrix()) return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePublish = async (status = 'published') => {
    // Validate targeted users if enabled
    if (isTargeted && targetedUserIds.length === 0) {
      toast.error('Please select at least one target user');
      return;
    }

    setLoading(true);
    try {
      const approvalMatrix = {
        reviewerId: selectedReviewer,
        approver1Id: selectedApprover1,
        approver2Id: selectedApprover2 || null,
      };

      const payload = {
        fields,
        approvalMatrix,
        status,
        targetedUsers: isTargeted ? targetedUserIds : [] // Empty array = public template
      };

      await documentService.completeTemplate(templateId, payload);

      const targetMsg = isTargeted ? ` (ditujukan ke ${targetedUserIds.length} pengguna)` : ' (public untuk semua)';
      toast.success(`Template ${status === 'draft' ? 'saved as draft' : 'published'} successfully${targetMsg}!`);
      navigate('/templates');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish template');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Document & Basic Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a PDF, Word, or Excel document that will serve as the template reference.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                  helperText="Give your template a descriptive name"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  helperText="Describe what this template is used for"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  helperText="e.g., Perjanjian Kerja Sama, Kontrak Vendor, etc."
                />
              </Grid>

              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    border: '2px dashed',
                    borderColor: file ? 'primary.main' : 'grey.300',
                    bgcolor: file ? 'primary.50' : 'grey.50',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {file ? file.name : 'Click to upload document'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
                  </Typography>
                  {file && (
                    <Chip
                      label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      color="primary"
                      sx={{ mt: 2 }}
                    />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleUpload}
                  disabled={loading || !file || !templateName}
                  startIcon={<CloudUpload />}
                >
                  {loading ? 'Uploading...' : 'Upload & Continue'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Define Form Fields
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create the form fields that users will fill when creating a contract from this template.
            </Typography>

            {extractedText && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Document Text Preview (Reference):
                </Typography>
                <Box
                  sx={{
                    maxHeight: 150,
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                    p: 1,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {extractedText}
                </Box>
              </Alert>
            )}
            
            {fields.length > 0 && fields[0].placeholder && (
              <Alert severity="success" sx={{ mb: 3 }} icon={<Visibility />}>
                <Typography variant="subtitle2" gutterBottom>
                  ✅ Placeholders Auto-Detected!
                </Typography>
                <Typography variant="body2">
                  Found {fields.length} placeholder(s) in your document. You can edit the labels and field types below.
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {fields.map((f, i) => (
                    <Chip 
                      key={i}
                      label={`{{${f.placeholder}}}`}
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Alert>
            )}

            {fields.map((field, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Field #{index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveField(index)}
                      disabled={fields.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    {field.placeholder && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ py: 0.5 }}>
                          <Typography variant="caption">
                            <strong>Document Placeholder:</strong> {`{{${field.placeholder}}}`}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Field Label"
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                        required
                        placeholder="e.g., Contract Number"
                        helperText="This will be shown as the form field label"
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
                        <FormHelperText>Select the input type for this field</FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Placeholder Text"
                        value={field.placeholder && !field.placeholder.includes('_') ? field.placeholder : ''}
                        onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                        placeholder="e.g., Enter contract number"
                        helperText="Helper text shown in the input field"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Validation Rules"
                        value={field.validation}
                        onChange={(e) => handleFieldChange(index, 'validation', e.target.value)}
                        placeholder="e.g., min:3|max:100"
                        helperText="Optional: min:X, max:X, regex:pattern"
                      />
                    </Grid>

                    {['dropdown', 'radio'].includes(field.type) && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Options (comma-separated)"
                          value={field.options}
                          onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                          placeholder="e.g., Option 1, Option 2, Option 3"
                          required
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

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddField}
              sx={{ mb: 2 }}
            >
              Add Another Field
            </Button>
          </Box>
        );

      case 2:
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
                  <InputLabel>Reviewer</InputLabel>
                  <Select
                    value={selectedReviewer}
                    label="Reviewer"
                    onChange={(e) => setSelectedReviewer(e.target.value)}
                  >
                    {reviewers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.email} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    First review (Mandatory) - Supervisor, Staff, or Admin
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Approver Layer 1</InputLabel>
                  <Select
                    value={selectedApprover1}
                    label="Approver Layer 1"
                    onChange={(e) => setSelectedApprover1(e.target.value)}
                  >
                    {approvers1.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.email} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    First approval (Mandatory) - Manager, C-Level, or Admin
                  </FormHelperText>
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
                    <MenuItem value="">
                      <em>None (Skip Layer 2)</em>
                    </MenuItem>
                    {approvers2.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.email} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Second approval (Optional) - C-Level or Admin
                  </FormHelperText>
                </FormControl>
              </Grid>

              {/* NEW: Targeted Users Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Target Pengguna (Opsional)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Pilih apakah template ini untuk semua user atau hanya untuk user tertentu saja
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isTargeted}
                      onChange={(e) => {
                        setIsTargeted(e.target.checked);
                        if (!e.target.checked) {
                          setTargetedUserIds([]); // Clear selection when unchecked
                        }
                      }}
                    />
                  }
                  label="Kirim template ke pengguna tertentu saja (bukan public)"
                />
              </Grid>

              {isTargeted && (
                <Grid item xs={12}>
                  <FormControl fullWidth required={isTargeted}>
                    <InputLabel>Pilih Pengguna Target</InputLabel>
                    <Select
                      multiple
                      value={targetedUserIds}
                      label="Pilih Pengguna Target"
                      onChange={(e) => setTargetedUserIds(e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((userId) => {
                            const user = allUsers.find(u => u.id === userId);
                            return user ? (
                              <Chip key={userId} label={`${user.name} (${user.role})`} size="small" />
                            ) : null;
                          })}
                        </Box>
                      )}
                    >
                      {allUsers
                        .filter(u => ['user', 'staff'].includes(u.role)) // Only show user/staff as targets
                        .map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            <Checkbox checked={targetedUserIds.indexOf(user.id) > -1} />
                            {user.name} - {user.email} ({user.role})
                          </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>
                      {targetedUserIds.length > 0
                        ? `${targetedUserIds.length} pengguna dipilih. Hanya mereka yang bisa menggunakan template ini.`
                        : 'Pilih minimal 1 pengguna. Jika tidak ada yang dipilih, template akan public untuk semua.'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preview & Publish
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your template configuration before publishing.
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Template Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Name:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" fontWeight={600}>
                      {templateName}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Category:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{category || '-'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Description:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{description || '-'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Form Fields ({fields.length})
                </Typography>
                <Divider sx={{ my: 2 }} />
                {fields.map((field, index) => (
                  <Box key={index} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {index + 1}. {field.label}
                      {field.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                      {field.placeholder && ` | Placeholder: ${field.placeholder}`}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Approval Flow
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    1. <strong>Reviewer:</strong>{' '}
                    {reviewers.find((u) => u.id === selectedReviewer)?.name || '-'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    2. <strong>Approver Layer 1:</strong>{' '}
                    {approvers1.find((u) => u.id === selectedApprover1)?.name || '-'}
                  </Typography>
                  <Typography variant="body2">
                    3. <strong>Approver Layer 2:</strong>{' '}
                    {selectedApprover2
                      ? approvers2.find((u) => u.id === selectedApprover2)?.name
                      : 'Not Required'}
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

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/templates')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight={700}>
          Create Document Template
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        {activeStep > 0 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button startIcon={<ArrowBack />} onClick={handleBack} disabled={loading}>
              Back
            </Button>

            <Box display="flex" gap={2}>
              {activeStep === 3 && (
                <Button
                  variant="outlined"
                  onClick={() => handlePublish('draft')}
                  disabled={loading}
                  startIcon={<Save />}
                >
                  Save as Draft
                </Button>
              )}
              {activeStep < 3 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => handlePublish('published')}
                  disabled={loading}
                  startIcon={<Visibility />}
                >
                  {loading ? 'Publishing...' : 'Publish Template'}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CreateTemplate;
