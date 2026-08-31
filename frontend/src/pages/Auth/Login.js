import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [accountSuspended, setAccountSuspended] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email wajib diisi';
    if (!password) newErrors.password = 'Password wajib diisi';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setAccountSuspended(false); // Reset suspended state
    setLoginError(''); // Reset login error
    
    try {
      const result = await login({ email, password });
      
      if (result.success) {
        // Navigate will happen automatically via useEffect when user state is set
      } else {
        // Check if account is suspended
        if (result.message && result.message.includes('ditangguhkan')) {
          setAccountSuspended(true);
        } else {
          // Show other login errors
          setLoginError(result.message || 'Login gagal. Silakan coba lagi.');
        }
        setLoading(false);
      }
    } catch (error) {
      setLoginError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #CC6F57 0%, #E5B8AB 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              JH Contract Builder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistem Manajemen Kontrak Digital
            </Typography>
          </Box>

          {accountSuspended && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setAccountSuspended(false)}
            >
              <AlertTitle sx={{ fontWeight: 'bold' }}>Akun Ditangguhkan</AlertTitle>
              Akun Anda telah ditangguhkan oleh Administrator. Silakan hubungi Administrator untuk informasi lebih lanjut dan aktivasi kembali akun Anda.
            </Alert>
          )}

          {loginError && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setLoginError('')}
            >
              <AlertTitle sx={{ fontWeight: 'bold' }}>Login Gagal</AlertTitle>
              {loginError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { 
                setEmail(e.target.value);
                setErrors({...errors, email: ''});
              }}
              error={Boolean(errors.email)}
              helperText={errors.email}
              margin="normal"
              autoComplete="email"
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { 
                setPassword(e.target.value);
                setErrors({...errors, password: ''});
              }}
              error={Boolean(errors.password)}
              helperText={errors.password}
              margin="normal"
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}

              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Loading...' : 'Login'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                atau
              </Typography>
            </Divider>

            <Button
              fullWidth
              component={Link}
              to="/register"
              variant="outlined"
              size="large"
              sx={{ py: 1.5 }}
            >
              Daftar Akun Baru
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              © 2026 Jimbaran Hijau. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
