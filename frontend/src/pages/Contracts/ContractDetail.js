import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { contractService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await contractService.getContractById(id);
      setContract(response.data.data);
    } catch (error) {
      console.error('Error loading contract:', error);
      toast.error('Gagal memuat detail kontrak');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async () => {
    try {
      setDownloading(true);
      const response = await contractService.downloadDocument(id);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contract.contractNumber}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Dokumen berhasil didownload');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Gagal mendownload dokumen');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewDocument = async () => {
    try {
      setLoadingPreview(true);
      toast.info('Mengkonversi dokumen ke PDF...', { autoClose: 2000 });
      
      const response = await contractService.viewDocumentAsPDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('Gagal menampilkan preview dokumen');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_review': return 'info';
      case 'reviewed': return 'info';
      case 'pending_approval1': return 'warning';
      case 'approved1': return 'info';
      case 'pending_approval2': return 'warning';
      case 'approved2': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending_review': return 'Menunggu Review';
      case 'reviewed': return 'Sudah di Review';
      case 'pending_approval1': return 'Menunggu Approval 1';
      case 'approved1': return 'Disetujui Approval 1';
      case 'pending_approval2': return 'Menunggu Approval 2';
      case 'approved2': return 'Disetujui Approval 2';
      case 'rejected': return 'Ditolak';
      case 'completed': return 'Selesai';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box>
        <Alert severity="error">Kontrak tidak ditemukan</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/contracts')} sx={{ mt: 2 }}>
          Kembali
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/contracts')}
            sx={{ mb: 1 }}
          >
            Kembali
          </Button>
          <Typography variant="h4" fontWeight={700}>
            Detail Kontrak
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {contract.generatedDocument && (
            <>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handlePreviewDocument}
                disabled={loadingPreview}
              >
                {loadingPreview ? 'Loading...' : 'Preview'}
              </Button>
              {/* Only show Download button if contract is completed (all approvals done) */}
              {contract.status === 'completed' && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadDocument}
                  disabled={downloading}
                >
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Contract Number & Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="overline" color="text.secondary">
              Nomor Kontrak
            </Typography>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {contract.contractNumber}
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ mt: 2 }}>
              {contract.title}
            </Typography>
            {contract.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {contract.description}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={2}>
              <Chip
                label={getStatusLabel(contract.status)}
                color={getStatusColor(contract.status)}
                size="large"
                sx={{ fontSize: '0.9rem', fontWeight: 600 }}
              />
              {contract.submittedBy && (
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Diajukan oleh
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {contract.submittedBy.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contract.submittedAt && format(new Date(contract.submittedAt), 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Contract Information */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Informasi Kontrak
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell width="40%" sx={{ fontWeight: 600 }}>Template</TableCell>
                      <TableCell>{contract.template?.templateName || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(contract.status)}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Tanggal Dibuat</TableCell>
                      <TableCell>
                        {format(new Date(contract.createdAt), 'dd MMMM yyyy, HH:mm')}
                      </TableCell>
                    </TableRow>
                    {contract.submittedAt && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tanggal Diajukan</TableCell>
                        <TableCell>
                          {format(new Date(contract.submittedAt), 'dd MMMM yyyy, HH:mm')}
                        </TableCell>
                      </TableRow>
                    )}
                    {contract.notes && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Catatan</TableCell>
                        <TableCell>{contract.notes}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Contract Data */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Data Kontrak
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {contract.contractData && contract.contractData.length > 0 ? (
                      contract.contractData
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((field, index) => (
                          <TableRow key={index}>
                            <TableCell width="40%" sx={{ fontWeight: 600 }}>
                              {field.fieldLabel}
                            </TableCell>
                            <TableCell>
                              {field.fieldType === 'date' && field.value
                                ? format(new Date(field.value), 'dd MMMM yyyy')
                                : field.value || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Tidak ada data kontrak
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Approval Flow & History */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Alur Persetujuan
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                {/* Submitter */}
                <Box display="flex" alignItems="center" gap={2}>
                  <Box>
                    <CheckCircleIcon color="success" />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Pengaju
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {contract.submittedBy?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {contract.submittedBy?.role}
                    </Typography>
                  </Box>
                </Box>

                {/* Reviewer */}
                {contract.reviewer && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box>
                      {contract.status === 'pending_review' ? (
                        <HourglassEmptyIcon color="warning" />
                      ) : ['reviewed', 'pending_approval1', 'approved1', 'pending_approval2', 'approved2', 'completed'].includes(contract.status) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Reviewer
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {contract.reviewer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {contract.reviewer.role}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Approver 1 */}
                {contract.approver1 && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box>
                      {contract.status === 'pending_approval1' ? (
                        <HourglassEmptyIcon color="warning" />
                      ) : ['pending_approval2', 'approved1', 'approved2', 'completed'].includes(contract.status) ? (
                        <CheckCircleIcon color="success" />
                      ) : ['pending_review', 'reviewed'].includes(contract.status) ? (
                        <HourglassEmptyIcon color="disabled" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Approver 1
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {contract.approver1.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {contract.approver1.role}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Approver 2 */}
                {contract.approver2 && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box>
                      {contract.status === 'pending_approval2' ? (
                        <HourglassEmptyIcon color="warning" />
                      ) : ['approved2', 'completed'].includes(contract.status) ? (
                        <CheckCircleIcon color="success" />
                      ) : ['pending_review', 'reviewed', 'pending_approval1', 'approved1'].includes(contract.status) ? (
                        <HourglassEmptyIcon color="disabled" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Approver 2
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {contract.approver2.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {contract.approver2.role}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Generated Document */}
          {contract.generatedDocument && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Dokumen
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" alignItems="center" gap={2} p={2} bgcolor="grey.50" borderRadius={1}>
                  <DescriptionIcon color="primary" fontSize="large" />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {contract.generatedDocument.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generated: {format(new Date(contract.generatedDocument.generatedAt), 'dd MMM yyyy, HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={handlePreviewDocument}
                    disabled={loadingPreview}
                  >
                    {loadingPreview ? 'Loading...' : 'Preview'}
                  </Button>
                  {/* Only show Download button if contract is completed (all approvals done) */}
                  {contract.status === 'completed' && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadDocument}
                      disabled={downloading}
                    >
                      Download
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Approval History */}
          {contract.approvalHistory && contract.approvalHistory.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Riwayat Persetujuan
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {contract.approvalHistory.map((history, index) => (
                  <Box key={index} mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {['approved', 'reviewed'].includes(history.action) ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2" fontWeight={600}>
                        {history.action === 'reviewed' ? 'Sudah di Review' : history.action === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Oleh: {history.approverName} ({history.role})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {format(new Date(history.timestamp), 'dd MMMM yyyy, HH:mm')}
                    </Typography>
                    {history.notes && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{history.notes}"
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Preview Dokumen (PDF)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {previewUrl ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <iframe
                src={previewUrl}
                title="Document Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </Box>
          ) : (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
              flexDirection="column"
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sedang mengkonversi dokumen ke PDF...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractDetail;
