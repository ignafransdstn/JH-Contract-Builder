import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Assignment as ContractIcon,
  CheckCircle as ApprovedIcon,
  PendingActions as PendingIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { contractService, approvalService } from '../../services';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [pendingContracts, setPendingContracts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsRes = await approvalService.getApprovalStatistics();
      setStatistics(statsRes.data.data);

      // Load pending contracts for approvers
      if (hasRole(['supervisor', 'manager', 'c-level'])) {
        const pendingRes = await contractService.getMyPendingContracts();
        setPendingContracts(pendingRes.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Contracts',
      value: statistics?.total || 0,
      icon: <ContractIcon sx={{ fontSize: 40 }} />,
      color: '#CC6F57',
    },
    {
      title: 'Pending Review',
      value: statistics?.pending_review || 0,
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      color: '#FF9800',
    },
    {
      title: 'Pending Approval',
      value: (statistics?.pending_approval1 || 0) + (statistics?.pending_approval2 || 0),
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      color: '#2196F3',
    },
    {
      title: 'Completed',
      value: statistics?.completed || 0,
      icon: <ApprovedIcon sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selamat datang, {user?.name}
          </Typography>
        </Box>
        
        {hasRole(['staff']) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/contracts/create')}
          >
            Buat Kontrak Baru
          </Button>
        )}
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pending Approvals */}
      {hasRole(['supervisor', 'manager', 'c-level']) && pendingContracts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Pending Approvals
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/approvals')}
            >
              Lihat Semua
            </Button>
          </Box>
          
          <Box>
            {pendingContracts.slice(0, 5).map((contract) => (
              <Box
                key={contract.id}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => navigate(`/contracts/${contract.id}`)}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {contract.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {contract.contractNumber} • Submitted by {contract.submittedBy?.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          {hasRole(['supervisor', 'admin']) && (
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DocumentIcon />}
                onClick={() => navigate('/templates/create')}
              >
                Create Template
              </Button>
            </Grid>
          )}
          
          {hasRole(['user', 'staff']) && (
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/contracts/create')}
              >
                Submit Contract
              </Button>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ContractIcon />}
              onClick={() => navigate('/contracts')}
            >
              View All Contracts
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
