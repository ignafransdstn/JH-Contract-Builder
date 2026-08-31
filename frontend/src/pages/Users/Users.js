import React, { useState, useEffect } from 'react';
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
  TablePagination,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as ResetPasswordIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Dialogs state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [openToggleStatusDialog, setOpenToggleStatusDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    department: '',
    position: '',
    phone: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const roles = [
    { value: 'admin', label: 'Admin', color: 'error' },
    { value: 'supervisor', label: 'Supervisor', color: 'warning' },
    { value: 'manager', label: 'Manager', color: 'info' },
    { value: 'c-level', label: 'C-Level', color: 'success' },
    { value: 'staff', label: 'Staff', color: 'default' },
    { value: 'user', label: 'User', color: 'default' }
  ];

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj?.color || 'default';
  };

  // Password validation helper
  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password harus minimal 8 karakter' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password harus mengandung minimal 1 huruf kapital' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password harus mengandung minimal 1 angka' };
    }
    
    if (!/[!@#$%^&*()\-+=[\]{};':"\\|,.<>/?]/.test(password)) {
      return { valid: false, message: 'Password harus mengandung minimal 1 karakter spesial (kecuali spasi dan underscore)' };
    }
    
    if (/[ _]/.test(password)) {
      return { valid: false, message: 'Password tidak boleh mengandung spasi atau underscore (_)' };
    }
    
    return { valid: true };
  };

  const getPasswordHelperText = () => {
    return 'Min 8 karakter, 1 huruf kapital, angka, dan karakter spesial (tanpa spasi/_)';
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setUsers(response.data.data);
      setTotalUsers(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  // Add User
  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      department: '',
      position: '',
      phone: ''
    });
    setOpenAddDialog(true);
  };

  const handleAddUser = async () => {
    try {
      // Validate password
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        showAlert('error', passwordValidation.message);
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('success', 'User created successfully');
      setOpenAddDialog(false);
      fetchUsers();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to create user');
    }
  };

  // Edit User
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || ''
    });
    setOpenEditDialog(true);
  };

  const handleEditUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${selectedUser.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('success', 'User updated successfully');
      setOpenEditDialog(false);
      fetchUsers();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to update user');
    }
  };

  // Delete User
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('success', 'User deleted successfully');
      setOpenDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Reset Password
  const handleOpenResetPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setOpenResetPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    try {
      // Validate password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        showAlert('error', passwordValidation.message);
        return;
      }

      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser.id}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('success', 'Password reset successfully');
      setOpenResetPasswordDialog(false);
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to reset password');
    }
  };

  // Toggle User Status
  const handleOpenToggleStatusDialog = (user) => {
    setSelectedUser(user);
    setOpenToggleStatusDialog(true);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedUser.status === 'active' ? 'deactivate' : 'active';
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setOpenToggleStatusDialog(false);
      fetchUsers();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to change user status');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add User
        </Button>
      </Box>

      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert({ show: false, type: '', message: '' })}>
          {alert.message}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filter by Role"
              value={roleFilter}
              onChange={handleRoleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                )
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role)} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.position || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={user.status === 'active' ? 'Active' : 'Deactivate'} 
                        color={user.status === 'active' ? 'success' : 'default'} 
                        size="small"
                      />
                      <Tooltip title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}>
                        <IconButton
                          size="small"
                          color={user.status === 'active' ? 'success' : 'default'}
                          onClick={() => handleOpenToggleStatusDialog(user)}
                        >
                          {user.status === 'active' ? <ToggleOnIcon /> : <ToggleOffIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit User">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEditDialog(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleOpenResetPasswordDialog(user)}
                      >
                        <ResetPasswordIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(user)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText={getPasswordHelperText()}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained"
            disabled={!formData.name || !formData.email || !formData.password || !validatePassword(formData.password).valid}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditUser} 
            variant="contained"
            disabled={!formData.name || !formData.email}
          >
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={openResetPasswordDialog} onClose={() => setOpenResetPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Reset password for user: <strong>{selectedUser?.name}</strong>
          </Typography>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText={getPasswordHelperText()}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetPasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained"
            disabled={!validatePassword(newPassword).valid}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={openToggleStatusDialog} onClose={() => setOpenToggleStatusDialog(false)}>
        <DialogTitle>
          {selectedUser?.status === 'active' ? 'Deactivate User' : 'Activate User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {selectedUser?.status === 'active' ? 'deactivate' : 'activate'} user <strong>{selectedUser?.name}</strong>?
          </Typography>
          <Alert severity={selectedUser?.status === 'active' ? 'warning' : 'info'} sx={{ mt: 2 }}>
            {selectedUser?.status === 'active' 
              ? 'This user will not be able to login and access the system.'
              : 'This user will be able to login and access the system.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenToggleStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleToggleStatus} 
            variant="contained" 
            color={selectedUser?.status === 'active' ? 'warning' : 'success'}
          >
            {selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
