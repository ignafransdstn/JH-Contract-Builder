import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { contractService, approvalService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending_review: { label: 'Menunggu Review', color: 'warning', layer: 'reviewer' },
  reviewed: { label: 'Sudah Direview', color: 'info', layer: 'reviewer' },
  pending_approval1: { label: 'Menunggu Approval 1', color: 'primary', layer: 'approval1' },
  approved1: { label: 'Disetujui Layer 1', color: 'success', layer: 'approval1' },
  pending_approval2: { label: 'Menunggu Approval 2', color: 'primary', layer: 'approval2' },
  approved2: { label: 'Disetujui Layer 2', color: 'success', layer: 'approval2' },
  completed: { label: 'Selesai', color: 'success', layer: 'completed' },
  rejected: { label: 'Ditolak', color: 'error', layer: 'rejected' }
};

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Load contracts that need approval from this user
  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await contractService.getAllContracts();
      const allContracts = response.data.data || [];

      // Filter contracts where current user is reviewer or approver
      const myContracts = allContracts.filter(contract => {
        return contract.reviewerId === user.id ||
               contract.approver1Id === user.id ||
               contract.approver2Id === user.id;
      });

      setContracts(myContracts);
      filterContractsByTab(myContracts, 0); // Default to Pending tab
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('Gagal memuat daftar kontrak untuk approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [user.id]);

  // Filter contracts by tab (Pending vs History)
  const filterContractsByTab = (contractsList, tab) => {
    if (tab === 0) {
      // Pending: Show contracts where user needs to take action
      const pending = contractsList.filter(contract => {
        if (contract.reviewerId === user.id && contract.status === 'pending_review') return true;
        if (contract.approver1Id === user.id && contract.status === 'pending_approval1') return true;
        if (contract.approver2Id === user.id && contract.status === 'pending_approval2') return true;
        return false;
      });
      setFilteredContracts(pending);
    } else {
      // History: Show contracts where user already took action or completed
      const history = contractsList.filter(contract => {
        const isPending = 
          (contract.reviewerId === user.id && contract.status === 'pending_review') ||
          (contract.approver1Id === user.id && contract.status === 'pending_approval1') ||
          (contract.approver2Id === user.id && contract.status === 'pending_approval2');
        return !isPending && (
          contract.reviewerId === user.id ||
          contract.approver1Id === user.id ||
          contract.approver2Id === user.id
        );
      });
      setFilteredContracts(history);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterContractsByTab(contracts, newValue);
  };

  // View contract details
  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setViewDialogOpen(true);
  };

  // Open action dialog (Approve/Reject)
  const handleOpenActionDialog = (contract, type) => {
    setSelectedContract(contract);
    setActionType(type);
    setComments('');
    setActionDialogOpen(true);
  };

  // Open edit dialog (for Reviewer only)
  const handleOpenEditDialog = (contract) => {
    setSelectedContract(contract);
    // Initialize edited data with current contract data
    const dataMap = {};
    (contract.contractData || []).forEach(field => {
      dataMap[field.fieldLabel] = field.value;
    });
    setEditedData({
      title: contract.title,
      description: contract.description,
      notes: contract.notes,
      contractData: dataMap
    });
    setEditDialogOpen(true);
  };

  // Handle edit contract (Reviewer ONLY)
  const handleSaveEdit = async () => {
    try {
      setSubmitting(true);

      // Convert edited data map back to contractData array
      const contractDataArray = (selectedContract.template?.fields || []).map(field => ({
        fieldLabel: field.label,
        fieldType: field.type,
        value: editedData.contractData[field.label] || '',
        order: field.order || 0
      }));

      const payload = {
        title: editedData.title,
        description: editedData.description,
        notes: editedData.notes,
        contractData: contractDataArray
      };

      await contractService.updateContract(selectedContract.id, payload);
      toast.success('Data kontrak berhasil diperbarui');
      setEditDialogOpen(false);
      loadContracts(); // Reload to get updated data
    } catch (error) {
      console.error('Error editing contract:', error);
      toast.error(error.response?.data?.message || 'Gagal memperbarui data kontrak');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle approval action
  const handleSubmitAction = async () => {
    if (!selectedContract) return;

    try {
      setSubmitting(true);

      const payload = {
        action: actionType === 'approve' ? (
          selectedContract.status === 'pending_review' ? 'reviewed' : 
          selectedContract.status === 'pending_approval1' ? 'approved' :
          'approved'
        ) : 'rejected',
        comments: comments
      };

      // Determine which endpoint to call based on current layer
      if (selectedContract.status === 'pending_review') {
        // Reviewer
        await approvalService.reviewContract(selectedContract.id, payload);
        toast.success(actionType === 'approve' ? 'Kontrak berhasil direview dan dilanjutkan ke approval' : 'Kontrak ditolak');
      } else if (selectedContract.status === 'pending_approval1') {
        // Approver 1
        await approvalService.approveContractLayer1(selectedContract.id, payload);
        toast.success(actionType === 'approve' ? 'Kontrak berhasil disetujui oleh Approver 1' : 'Kontrak ditolak');
      } else if (selectedContract.status === 'pending_approval2') {
        // Approver 2
        await approvalService.approveContractLayer2(selectedContract.id, payload);
        toast.success(actionType === 'approve' ? 'Kontrak berhasil disetujui oleh Approver 2' : 'Kontrak ditolak');
      }

      setActionDialogOpen(false);
      setSelectedContract(null);
      loadContracts(); // Reload data
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(error.response?.data?.message || 'Gagal memproses approval');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle document preview
  const handlePreviewDocument = async (contract) => {
    try {
      setGeneratingPreview(true);
      
      // Check if document already generated
      if (!contract.generatedDocument || !contract.generatedDocument.filePath) {
        // Auto-generate document if not exists
        toast.info('Sedang membuat dokumen preview...', { autoClose: 2000 });
        await contractService.generateDocument(contract.id);
        
        // Reload contract data to get generated document info
        const updatedContract = await contractService.getContractById(contract.id);
        contract = updatedContract.data.data;
      }

      // Download document as PDF blob
      toast.info('Mengkonversi dokumen ke PDF...', { autoClose: 2000 });
      const response = await contractService.viewDocumentAsPDF(contract.id);
      const blob = new Blob([response.data], { 
        type: 'application/pdf' 
      });
      
      // Create object URL from blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Set URL for modal preview
      setDocumentUrl(blobUrl);
      setPreviewDialogOpen(true);
      
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('Gagal menampilkan preview dokumen');
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Get user's role in contract
  const getUserRole = (contract) => {
    if (contract.reviewerId === user.id) return 'Reviewer';
    if (contract.approver1Id === user.id) return 'Approver 1';
    if (contract.approver2Id === user.id) return 'Approver 2';
    return '-';
  };

  // Check if user can edit (Reviewer only)
  const canEdit = (contract) => {
    return contract.reviewerId === user.id && contract.status === 'pending_review';
  };

  // Check if user can take action (approve/reject)
  const canTakeAction = (contract) => {
    return (contract.reviewerId === user.id && contract.status === 'pending_review') ||
           (contract.approver1Id === user.id && contract.status === 'pending_approval1') ||
           (contract.approver2Id === user.id && contract.status === 'pending_approval2');
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
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Pending Approvals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kelola approval dan review kontrak yang membutuhkan persetujuan Anda
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Menunggu Aksi (${filteredContracts.length})`} />
          <Tab label="Riwayat" />
        </Tabs>
      </Paper>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <Alert severity="info">
          {tabValue === 0
            ? 'Tidak ada kontrak yang membutuhkan approval dari Anda saat ini.'
            : 'Tidak ada riwayat approval.'}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>No. Kontrak</strong></TableCell>
                <TableCell><strong>Judul</strong></TableCell>
                <TableCell><strong>Diajukan Oleh</strong></TableCell>
                <TableCell><strong>Role Anda</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Tanggal</strong></TableCell>
                <TableCell align="center"><strong>Aksi</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id} hover>
                  <TableCell>{contract.contractNumber}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {contract.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Template: {contract.template?.templateName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {contract.submittedBy?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {contract.submittedBy?.role}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getUserRole(contract)} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_CONFIG[contract.status]?.label || contract.status}
                      color={STATUS_CONFIG[contract.status]?.color || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {format(new Date(contract.submittedAt || contract.createdAt), 'dd MMM yyyy HH:mm', { locale: localeId })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Lihat Detail">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewContract(contract)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {canEdit(contract) && (
                        <Tooltip title="Edit Data (Reviewer)">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenEditDialog(contract)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canTakeAction(contract) && (
                        <>
                          <Tooltip title="Setujui">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenActionDialog(contract, 'approve')}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tolak">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenActionDialog(contract, 'reject')}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Contract Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Detail Kontrak
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedContract && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">No. Kontrak:</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedContract.contractNumber}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Judul:</Typography>
                <Typography variant="body1">{selectedContract.title}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                <Chip
                  label={STATUS_CONFIG[selectedContract.status]?.label || selectedContract.status}
                  color={STATUS_CONFIG[selectedContract.status]?.color || 'default'}
                  size="small"
                />
              </Grid>

              {selectedContract.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Deskripsi:</Typography>
                  <Typography variant="body2">{selectedContract.description}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Data Kontrak
                </Typography>
              </Grid>

              {(selectedContract.contractData || []).map((field, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {field.fieldLabel}:
                  </Typography>
                  <Typography variant="body1">
                    {field.value || '-'}
                  </Typography>
                </Grid>
              ))}

              {selectedContract.approvalHistory && selectedContract.approvalHistory.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Riwayat Approval
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {selectedContract.approvalHistory.map((history, idx) => (
                      <Card key={idx} sx={{ mb: 1 }}>
                        <CardContent>
                          <Typography variant="body2" fontWeight={500}>
                            {history.layer === 'reviewer' ? 'Reviewer' :
                             history.layer === 'approval1' ? 'Approver 1' :
                             history.layer === 'approval2' ? 'Approver 2' : history.layer}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Action: {history.action} at {format(new Date(history.timestamp), 'dd MMM yyyy HH:mm')}
                          </Typography>
                          {history.comments && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Catatan: {history.comments}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Contract Dialog (Reviewer Only) */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !submitting && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Edit Data Kontrak (Reviewer)
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedContract && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Judul Kontrak"
                  value={editedData.title || ''}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Deskripsi"
                  value={editedData.description || ''}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Data Kontrak
                </Typography>
              </Grid>

              {(selectedContract.template?.fields || []).map((field, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={editedData.contractData?.[field.label] || ''}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      contractData: {
                        ...editedData.contractData,
                        [field.label]: e.target.value
                      }
                    })}
                    required={field.required}
                    multiline={field.type === 'textarea'}
                    rows={field.type === 'textarea' ? 3 : 1}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Catatan"
                  value={editedData.notes || ''}
                  onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => !submitting && setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {actionType === 'approve' ? (
              <CheckCircleIcon color="success" />
            ) : (
              <CancelIcon color="error" />
            )}
            <Typography variant="h6" fontWeight={600}>
              {actionType === 'approve' ? 'Setujui Kontrak' : 'Tolak Kontrak'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {actionType === 'approve'
              ? 'Anda akan menyetujui kontrak ini dan melanjutkan ke tahap berikutnya.'
              : 'Anda akan menolak kontrak ini. Kontrak akan dikembalikan ke pembuat.'}
          </Typography>

          {selectedContract && (
            <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="body2"><strong>No. Kontrak:</strong> {selectedContract.contractNumber}</Typography>
                <Typography variant="body2"><strong>Judul:</strong> {selectedContract.title}</Typography>
                <Typography variant="body2">
                  <strong>Template:</strong> {selectedContract.template?.templateName}
                </Typography>
              </CardContent>
            </Card>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label={actionType === 'approve' ? 'Catatan (Opsional)' : 'Alasan Penolakan (Wajib)'}
            placeholder={actionType === 'approve' 
              ? 'Tambahkan catatan jika diperlukan...'
              : 'Jelaskan alasan penolakan...'}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required={actionType === 'reject'}
          />

          {/* Preview Document Button */}
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => handlePreviewDocument(selectedContract)}
              disabled={generatingPreview}
            >
              {generatingPreview ? 'Menyiapkan Preview...' : 'Preview Dokumen'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={submitting || (actionType === 'reject' && !comments.trim())}
          >
            {submitting ? 'Memproses...' : actionType === 'approve' ? 'Setujui' : 'Tolak'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          if (documentUrl) {
            window.URL.revokeObjectURL(documentUrl);
            setDocumentUrl('');
          }
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <PreviewIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Preview Dokumen (PDF)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '80vh', display: 'flex', flexDirection: 'column' }}>
          {documentUrl ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <iframe
                src={documentUrl}
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
          <Button onClick={() => {
            setPreviewDialogOpen(false);
            if (documentUrl) {
              window.URL.revokeObjectURL(documentUrl);
              setDocumentUrl('');
            }
          }}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingApprovals;
