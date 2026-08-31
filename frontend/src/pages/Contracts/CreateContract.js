import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { documentService, contractService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const CreateContract = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [activeStep, setActiveStep] = useState(0);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form data
  const [contractTitle, setContractTitle] = useState('');
  const [contractDescription, setContractDescription] = useState('');
  const [contractNotes, setContractNotes] = useState('');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [draftContractId, setDraftContractId] = useState(() => {
    // Load draft ID from localStorage on mount
    if (templateId && user?.id) {
      const storageKey = `draftContract_${templateId}_${user.id}`;
      const savedDraftId = localStorage.getItem(storageKey);
      return savedDraftId || null;
    }
    return null;
  });

  const steps = ['Informasi Kontrak', 'Isi Data Kontrak', 'Review & Submit'];

  // Save draft ID to localStorage whenever it changes
  useEffect(() => {
    if (draftContractId && templateId && user?.id) {
      const storageKey = `draftContract_${templateId}_${user.id}`;
      localStorage.setItem(storageKey, draftContractId);
    }
  }, [draftContractId, templateId, user?.id]);

  // Load template
  useEffect(() => {
    if (!templateId) {
      toast.error('Template ID tidak ditemukan');
      navigate('/contracts');
      return;
    }

    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await documentService.getTemplateById(templateId);
      setTemplate(response.data.data);
      
      // Initialize form data with empty values
      const initialData = {};
      (response.data.data.fields || []).forEach(field => {
        initialData[field.label] = field.type === 'checkbox' ? [] : '';
      });
      setFormData(initialData);
      
      // Set default title from template
      setContractTitle(response.data.data.templateName);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Gagal memuat template');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  // Handle field change
  const handleFieldChange = (fieldLabel, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
    
    // Clear error for this field
    if (errors[fieldLabel]) {
      setErrors(prev => ({
        ...prev,
        [fieldLabel]: null
      }));
    }
  };

  // Validate step
  const validateStep = () => {
    const newErrors = {};

    if (activeStep === 0) {
      // Validate contract info
      if (!contractTitle.trim()) {
        newErrors.contractTitle = 'Judul kontrak wajib diisi';
      }
    } else if (activeStep === 1) {
      // Validate form fields
      (template.fields || []).forEach(field => {
        if (field.required && !formData[field.label]) {
          newErrors[field.label] = `${field.label} wajib diisi`;
        }
        
        // Email validation
        if (field.type === 'email' && formData[field.label]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[field.label])) {
            newErrors[field.label] = 'Format email tidak valid';
          }
        }
        
        // Phone validation
        if (field.type === 'phone' && formData[field.label]) {
          const phoneRegex = /^[0-9+\-() ]+$/;
          if (!phoneRegex.test(formData[field.label])) {
            newErrors[field.label] = 'Format nomor telepon tidak valid';
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle back
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateStep()) {
      toast.error('Mohon periksa kembali data yang Anda isi');
      return;
    }

    try {
      setLoading(true);

      // Prepare contract data
      const contractData = (template.fields || []).map(field => ({
        fieldLabel: field.label,
        fieldType: field.type,
        value: formData[field.label] || '',
        order: field.order || 0
      }));

      let submittedContractId;

      // If we have a draft contract from preview, update it to pending_review
      if (draftContractId) {
        const updatePayload = {
          title: contractTitle,
          description: contractDescription || null,
          contractData,
          notes: contractNotes || null,
          status: 'pending_review'
        };

        try {
          await contractService.updateContract(draftContractId, updatePayload);
          submittedContractId = draftContractId;
        } catch (updateError) {
          if (updateError.response?.status === 404) {
            // Stale draft ID in localStorage — contract was deleted or DB was reset
            if (templateId && user?.id) {
              localStorage.removeItem(`draftContract_${templateId}_${user.id}`);
            }
            setDraftContractId(null);
            const freshPayload = {
              templateId: template.id,
              title: contractTitle,
              description: contractDescription || null,
              contractData,
              notes: contractNotes || null
            };
            const response = await contractService.createContract(freshPayload);
            submittedContractId = response.data.data.id;
          } else {
            throw updateError;
          }
        }

      } else {
        // No draft exists, create new contract directly as pending_review
        const payload = {
          templateId: template.id,
          title: contractTitle,
          description: contractDescription || null,
          contractData,
          notes: contractNotes || null
          // status will default to 'pending_review' in backend
        };

        console.log('Submitting new contract with payload:', payload);

        const response = await contractService.createContract(payload);
        submittedContractId = response.data.data.id;
      }

      // Generate document if not already generated
      try {
        toast.info('Generating dokumen kontrak...', { duration: 2000 });
        await contractService.generateDocument(submittedContractId);
        console.log('Document generated for contract:', submittedContractId);
      } catch (generateError) {
        console.error('Error generating document:', generateError);
        // Don't fail submission if document generation fails
        toast.warning('Kontrak berhasil diajukan, namun dokumen gagal di-generate. Silakan coba generate ulang nanti.', {
          duration: 5000
        });
      }

      // Clear draft from localStorage after successful submission
      if (templateId && user?.id) {
        const storageKey = `draftContract_${templateId}_${user.id}`;
        localStorage.removeItem(storageKey);
      }
      
      toast.success('Kontrak berhasil diajukan dan menunggu review!', {
        duration: 5000
      });
      navigate(`/contracts/${submittedContractId}`);
      
    } catch (error) {
      console.error('Error creating contract:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Gagal membuat kontrak. Silakan coba lagi.';
      
      toast.error(errorMessage, {
        duration: 8000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle preview contract - generate document with filled data
  const handlePreviewContract = async () => {
    if (!validateStep()) {
      toast.error('Mohon lengkapi semua data terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      toast.info('Generating preview dokumen kontrak...', { duration: 2000 });

      // Prepare contract data
      const contractData = (template.fields || []).map(field => ({
        fieldLabel: field.label,
        fieldType: field.type,
        value: formData[field.label] || '',
        order: field.order || 0
      }));

      const payload = {
        templateId: template.id,
        title: contractTitle,
        description: contractDescription || null,
        contractData,
        notes: contractNotes || null,
        status: 'draft' // Save as draft for preview
      };

      let currentDraftId = draftContractId;

      // Step 1: Create or update draft contract
      if (draftContractId) {
        // Update existing draft contract
        console.log('Updating existing draft contract:', draftContractId);
        try {
          await contractService.updateContract(draftContractId, payload);
        } catch (updateError) {
          // If update fails (e.g., contract was deleted), create new one
          console.log('Draft not found, creating new one');
          const contractResponse = await contractService.createContract(payload);
          currentDraftId = contractResponse.data.data.id;
          setDraftContractId(currentDraftId);
        }
      } else {
        // Create new draft contract
        console.log('Creating new draft contract for preview:', payload);
        const contractResponse = await contractService.createContract(payload);
        currentDraftId = contractResponse.data.data.id;
        setDraftContractId(currentDraftId); // Store draft ID for later use
        console.log('Draft contract created:', currentDraftId);
      }

      // Step 2: Generate document from draft contract
      toast.info('Generating dokumen dengan data terisi...', { duration: 3000 });
      
      const generateResponse = await contractService.generateDocument(currentDraftId);
      
      console.log('Document generated:', generateResponse.data);

      // Step 3: Download generated document with authentication
      toast.info('Downloading dokumen...', { duration: 2000 });
      
      try {
        const downloadResponse = await contractService.downloadDocument(currentDraftId);
        
        // Create blob from response
        const blob = new Blob([downloadResponse.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Contract_${generateResponse.data.contractNumber || 'Preview'}.docx`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Preview dokumen berhasil di-generate dan didownload!', {
          duration: 5000
        });
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        toast.error('Gagal download dokumen: ' + (downloadError.response?.data?.message || downloadError.message), {
          duration: 5000
        });
      }

      // Show info about submitting
      setTimeout(() => {
        toast.info('Draft tersimpan. Klik Submit untuk ajukan ke approval workflow.', {
          duration: 6000
        });
      }, 1000);

    } catch (error) {
      console.error('Error previewing contract:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Gagal membuat preview kontrak';
      
      toast.error(errorMessage, {
        duration: 8000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render field based on type
  const renderField = (field) => {
    const value = formData[field.label] || '';
    const error = errors[field.label];

    switch (field.type) {
      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            error={Boolean(error)}
            helperText={error}
            required={field.required}
          />
        );

      case 'number':
      case 'currency':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            error={Boolean(error)}
            helperText={error}
            required={field.required}
            InputProps={field.type === 'currency' ? { startAdornment: 'Rp ' } : {}}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            error={Boolean(error)}
            helperText={error}
            required={field.required}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            error={Boolean(error)}
            helperText={error}
            required={field.required}
          />
        );

      case 'phone':
        return (
          <TextField
            fullWidth
            type="tel"
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            error={Boolean(error)}
            helperText={error}
            required={field.required}
          />
        );

      case 'dropdown':
        return (
          <FormControl fullWidth error={Boolean(error)} required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleFieldChange(field.label, e.target.value)}
            >
              {(field.options || []).map((option, idx) => (
                <MenuItem key={idx} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {error && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{error}</Typography>}
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" error={Boolean(error)} required={field.required}>
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleFieldChange(field.label, e.target.value)}
            >
              {(field.options || []).map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl component="fieldset" error={Boolean(error)} required={field.required}>
            <FormLabel component="legend">{field.label}</FormLabel>
            {(field.options || []).map((option, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={(value || []).includes(option)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(value || []), option]
                        : (value || []).filter(v => v !== option);
                      handleFieldChange(field.label, newValue);
                    }}
                  />
                }
                label={option}
              />
            ))}
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </FormControl>
        );

      default: // text
        return (
          <TextField
            fullWidth
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            error={Boolean(error)}
            helperText={error}
            required={field.required}
          />
        );
    }
  };

  if (loading || !template) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/contracts')}
          sx={{ mb: 2 }}
        >
          Kembali ke Daftar Template
        </Button>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Ajukan Kontrak
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Template: {template.templateName}
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 3 }}>
        {/* Step 0: Contract Info */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Informasi Umum Kontrak
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul Kontrak"
                  placeholder="Masukkan judul kontrak"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  error={Boolean(errors.contractTitle)}
                  helperText={errors.contractTitle}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Deskripsi (Opsional)"
                  placeholder="Masukkan deskripsi kontrak"
                  value={contractDescription}
                  onChange={(e) => setContractDescription(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Fill Form Fields */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Isi Data Kontrak
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {template.fields && template.fields.length > 0 ? (
              <Grid container spacing={3}>
                {template.fields
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((field, index) => (
                    <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={index}>
                      {renderField(field)}
                    </Grid>
                  ))}
              </Grid>
            ) : (
              <Alert severity="info">Template ini tidak memiliki field form</Alert>
            )}
          </Box>
        )}

        {/* Step 2: Review & Submit */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Review Data Kontrak
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Contract Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Informasi Kontrak
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Judul:</Typography>
                    <Typography variant="body1" fontWeight={500}>{contractTitle}</Typography>
                  </Box>
                  {contractDescription && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Deskripsi:</Typography>
                      <Typography variant="body2">{contractDescription}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">Template:</Typography>
                    <Typography variant="body2">{template.templateName}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Form Data */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Data Kontrak
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {template.fields
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((field, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {field.label}:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {Array.isArray(formData[field.label])
                              ? formData[field.label].join(', ')
                              : formData[field.label] || '-'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Approval Flow */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Alur Persetujuan
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {template.approvalMatrix?.reviewerId && (
                    <Chip
                      icon={<PersonIcon />}
                      label="Akan direview oleh Reviewer"
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {template.approvalMatrix?.approver1Id && (
                    <Chip
                      icon={<PersonIcon />}
                      label="Memerlukan approval dari Approver 1"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {template.approvalMatrix?.approver2Id && (
                    <Chip
                      icon={<PersonIcon />}
                      label="Memerlukan approval dari Approver 2"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Template Document Preview */}
            <Card sx={{ mt: 2, bgcolor: 'success.lighter', borderColor: 'success.main', borderWidth: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Preview Dokumen Kontrak
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.templateName} - {template.originalFileName}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<VisibilityIcon />}
                    onClick={handlePreviewContract}
                    size="small"
                    disabled={loading}
                  >
                    Preview Data
                  </Button>
                </Box>
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Tips:</strong> Click "Preview Data" untuk melihat data yang akan mengisi dokumen kontrak. Placeholder seperti {'{{nomor_dokumen}}'} akan diganti dengan data yang Anda isi.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>

            {/* Notes */}
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Catatan Tambahan (Opsional)"
                placeholder="Tambahkan catatan untuk reviewer/approver"
                value={contractNotes}
                onChange={(e) => setContractNotes(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Kembali
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                size="large"
              >
                Lanjut
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handlePreviewContract}
                  startIcon={<VisibilityIcon />}
                  size="large"
                  disabled={loading}
                >
                  Review Contract
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={<SendIcon />}
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Mengirim...' : 'Ajukan Kontrak'}
                </Button>
              </>
            )}

          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateContract;
