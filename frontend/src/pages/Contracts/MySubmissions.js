import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Avatar,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  DeleteOutline as DeleteOutlineIcon
} from '@mui/icons-material';
import { contractService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const MySubmissions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, page]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await contractService.getMySubmittedContracts({ 
        status: statusFilter,
        page,
        limit: 10 
      });
      setSubmissions(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Gagal memuat daftar pengajuan kontrak');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending_review: 'warning',
      reviewed: 'info',
      pending_approval1: 'warning',
      approved1: 'info',
      pending_approval2: 'warning',
      approved2: 'success',
      completed: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      pending_review: 'Menunggu Review',
      reviewed: 'Sudah di Review',
      pending_approval1: 'Menunggu Approval 1',
      approved1: 'Approved Layer 1',
      pending_approval2: 'Menunggu Approval 2',
      approved2: 'Approved Layer 2',
      completed: 'Selesai',
      rejected: 'Ditolak'
    };
    return labels[status] || status;
  };

  const getProgressStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const renderProgressTracker = (contract) => {
    const { progress } = contract;
    const steps = [];

    // Review step
    steps.push({
      label: 'Review Dokumen',
      person: progress.review.reviewer,
      status: progress.review.status,
      completedAt: progress.review.completedAt,
      comments: progress.review.comments
    });

    // Approval 1 step
    steps.push({
      label: 'Approval Layer 1',
      person: progress.approval1.approver,
      status: progress.approval1.status,
      completedAt: progress.approval1.completedAt,
      comments: progress.approval1.comments
    });

    // Approval 2 step (if exists)
    if (progress.approval2) {
      steps.push({
        label: 'Approval Layer 2',
        person: progress.approval2.approver,
        status: progress.approval2.status,
        completedAt: progress.approval2.completedAt,
        comments: progress.approval2.comments
      });
    }

    const activeStep = steps.findIndex(s => s.status === 'pending' || s.status === 'rejected');
    const currentStep = activeStep === -1 ? steps.length : activeStep;

    return (
      <Stepper activeStep={currentStep} orientation="vertical" sx={{ mt: 2 }}>
        {steps.map((step, index) => (
          <Step key={index} completed={step.status === 'approved'}>
            <StepLabel
              error={step.status === 'rejected'}
              StepIconComponent={() => getProgressStatusIcon(step.status)}
            >
              <Box>
                <Typography variant="subtitle2">{step.label}</Typography>
                {step.person && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {step.person.name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {step.person.name} ({step.person.role})
                    </Typography>
                  </Box>
                )}
              </Box>
            </StepLabel>
            <StepContent>
              {step.completedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {format(new Date(step.completedAt), 'dd MMM yyyy HH:mm')}
                </Typography>
              )}
              {step.comments && (
                <Alert severity={step.status === 'rejected' ? 'error' : 'info'} sx={{ mt: 1 }}>
                  {step.comments}
                </Alert>
              )}
              {step.status === 'pending' && (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  Sedang menunggu {step.label.toLowerCase()}...
                </Typography>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
    );
  };

  const handleViewDetail = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  const handleDeleteClick = (submission) => {
    setSubmissionToDelete(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return;
    try {
      setDeleting(true);
      await contractService.deleteContract(submissionToDelete.id);
      toast.success('Draft kontrak berhasil dihapus');
      setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus draft kontrak');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSubmissionToDelete(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          {user?.role === 'admin' ? 'Tracking Semua Pengajuan Kontrak' : 'Dokumen Kontrak Saya'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {user?.role === 'admin' 
            ? 'Monitor progress approval semua dokumen kontrak yang diajukan' 
            : ['supervisor', 'manager', 'c-level'].includes(user?.role)
              ? 'Semua dokumen kontrak yang berkaitan dengan akun Anda (sebagai pengaju, reviewer, atau approver)'
              : 'Monitor progress approval dokumen kontrak yang Anda ajukan'}
        </Typography>
      </Paper>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">Semua Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending_review">Menunggu Review</MenuItem>
                <MenuItem value="reviewed">Sudah di Review</MenuItem>
                <MenuItem value="pending_approval1">Menunggu Approval 1</MenuItem>
                <MenuItem value="pending_approval2">Menunggu Approval 2</MenuItem>
                <MenuItem value="completed">Selesai</MenuItem>
                <MenuItem value="rejected">Ditolak</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary" align="right">
              Total: {pagination?.total || 0} pengajuan
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {user?.role === 'admin' ? 'Belum Ada Pengajuan Contract' : 'Belum Ada Dokumen Kontrak'}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {user?.role === 'admin' 
              ? 'Belum ada kontrak yang diajukan oleh user'
              : ['supervisor', 'manager', 'c-level'].includes(user?.role)
                ? 'Belum ada dokumen kontrak yang berkaitan dengan akun Anda'
                : 'Anda belum mengajukan kontrak apapun'}
          </Typography>
          {!['admin', 'supervisor', 'manager', 'c-level'].includes(user?.role) && (
            <Button
              variant="contained"
              onClick={() => navigate('/contracts')}
              sx={{ mt: 2 }}
            >
              Ajukan Kontrak Baru
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={3}>
          {submissions.map((submission) => (
            <Card key={submission.id} elevation={2}>
              <CardContent>
                <Grid container spacing={2}>
                  {/* Header Section */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {submission.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Chip
                            label={submission.contractNumber}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={getStatusLabel(submission.status)}
                            color={getStatusColor(submission.status)}
                            size="small"
                          />
                          {submission.template && (
                            <Chip
                              label={submission.template.templateName}
                              size="small"
                              icon={<DocumentIcon />}
                            />
                          )}
                          {/* Role badge for supervisor/manager/c-level */}
                          {['supervisor', 'manager', 'c-level'].includes(user?.role) && (() => {
                            const roleInContract =
                              submission.submittedById === user?.id ? 'Pengaju' :
                              submission.reviewerId === user?.id ? 'Reviewer' :
                              submission.approver1Id === user?.id ? 'Approver 1' :
                              submission.approver2Id === user?.id ? 'Approver 2' : null;
                            return roleInContract ? (
                              <Chip
                                label={`Anda sebagai ${roleInContract}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : null;
                          })()}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Diajukan: {submission.submittedAt ? format(new Date(submission.submittedAt), 'dd MMM yyyy HH:mm') : '-'}
                          {(user?.role === 'admin' || ['supervisor', 'manager', 'c-level'].includes(user?.role)) && submission.submittedBy && (
                            <> • Oleh: {submission.submittedBy.name}</>
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {submission.status === 'draft' && submission.submittedById === user?.id && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => handleDeleteClick(submission)}
                          >
                            Hapus Draft
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetail(submission.id)}
                        >
                          Lihat Detail
                        </Button>
                      </Box>
                    </Box>

                    <Divider />
                  </Grid>

                  {/* Progress Tracker Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                      Progress Approval
                    </Typography>
                    {submission.status === 'draft' ? (
                      <Alert severity="info">
                        Dokumen masih dalam status draft. Submit dokumen untuk memulai proses approval.
                      </Alert>
                    ) : (
                      renderProgressTracker(submission)
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            sx={{ mr: 2 }}
          >
            Sebelumnya
          </Button>
          <Typography sx={{ alignSelf: 'center', mx: 2 }}>
            Halaman {page} dari {pagination.pages}
          </Typography>
          <Button
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Selanjutnya
          </Button>
        </Box>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Draft Kontrak</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus draft kontrak{' '}
            <strong>{submissionToDelete?.title}</strong>{' '}({submissionToDelete?.contractNumber})?
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Batal
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MySubmissions;
