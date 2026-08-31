import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { documentService, userService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Contracts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState({});

  // Load published templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAllTemplates({ search: searchTerm });
      
      // Backend already filters based on targetedUsers, just use the data as-is
      // Filter only published templates (optional as backend might already filter)
      const publishedTemplates = (response.data.data || []).filter(
        template => template.status === 'published'
      );
      
      setTemplates(publishedTemplates);

      // Load user details for approval matrix
      const userIds = new Set();
      publishedTemplates.forEach(template => {
        if (template.approvalMatrix) {
          if (template.approvalMatrix.reviewerId) userIds.add(template.approvalMatrix.reviewerId);
          if (template.approvalMatrix.approver1Id) userIds.add(template.approvalMatrix.approver1Id);
          if (template.approvalMatrix.approver2Id) userIds.add(template.approvalMatrix.approver2Id);
        }
      });

      // Fetch user details
      const usersData = {};
      for (const userId of userIds) {
        try {
          const userResponse = await userService.getUserById(userId);
          usersData[userId] = userResponse.data.data;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Gagal memuat daftar template kontrak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Handle search
  const handleSearch = () => {
    loadTemplates();
  };

  // Handle create contract from template
  const handleCreateContract = (templateId) => {
    navigate(`/contracts/create?templateId=${templateId}`);
  };

  // Check if user can create contract
  const canCreate = ['admin', 'supervisor', 'staff', 'manager', 'c-level', 'user'].includes(user?.role);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Pengajuan Kontrak
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pilih template dokumen kontrak yang ingin Anda ajukan
        </Typography>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Cari template berdasarkan nama atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button onClick={handleSearch}>Cari</Button>
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Templates List */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={30} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : templates.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm
            ? 'Tidak ada template kontrak yang ditemukan dengan kata kunci tersebut.'
            : 'Belum ada template kontrak yang dipublish. Silakan hubungi Administrator untuk membuat template kontrak.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Template Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                        mr: 2
                      }}
                    >
                      <DescriptionIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {template.templateName}
                      </Typography>
                      <Chip
                        label={template.category || 'Umum'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Description */}
                  {template.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {template.description}
                    </Typography>
                  )}

                  {/* Fields Info */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${template.fields?.length || 0} Field`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Digunakan: ${template.usageCount || 0}x`}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Approval Hierarchy */}
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Hirarki Approval:
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {/* Reviewer */}
                    {template.approvalMatrix?.reviewerId && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 18, mr: 1, color: 'info.main' }} />
                        <Typography variant="body2">
                          <strong>Reviewer:</strong>{' '}
                          {users[template.approvalMatrix.reviewerId]?.name || 'Loading...'}
                          {' '}
                          <Chip
                            label={users[template.approvalMatrix.reviewerId]?.role || ''}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </Typography>
                      </Box>
                    )}

                    {/* Approver 1 */}
                    {template.approvalMatrix?.approver1Id && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 18, mr: 1, color: 'warning.main' }} />
                        <Typography variant="body2">
                          <strong>Approver 1:</strong>{' '}
                          {users[template.approvalMatrix.approver1Id]?.name || 'Loading...'}
                          {' '}
                          <Chip
                            label={users[template.approvalMatrix.approver1Id]?.role || ''}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </Typography>
                      </Box>
                    )}

                    {/* Approver 2 */}
                    {template.approvalMatrix?.approver2Id && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 18, mr: 1, color: 'success.main' }} />
                        <Typography variant="body2">
                          <strong>Approver 2:</strong>{' '}
                          {users[template.approvalMatrix.approver2Id]?.name || 'Loading...'}
                          {' '}
                          <Chip
                            label={users[template.approvalMatrix.approver2Id]?.role || ''}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </Typography>
                      </Box>
                    )}

                    {!template.approvalMatrix?.reviewerId &&
                     !template.approvalMatrix?.approver1Id &&
                     !template.approvalMatrix?.approver2Id && (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Belum ada approval matrix yang di-set
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  {canCreate ? (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleCreateContract(template.id)}
                    >
                      Ajukan Kontrak
                    </Button>
                  ) : (
                    <Alert severity="warning" sx={{ width: '100%' }}>
                      Anda tidak memiliki akses untuk mengajukan kontrak
                    </Alert>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Contracts;
