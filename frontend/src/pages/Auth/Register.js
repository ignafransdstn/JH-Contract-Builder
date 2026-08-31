import React, { useState } from 'react';
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
  Grid,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const validationSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Nama minimal 3 karakter')
    .required('Nama wajib diisi'),
  email: Yup.string()
    .email('Email tidak valid')
    .required('Email wajib diisi'),
  password: Yup.string()
    .min(8, 'Password minimal 8 karakter')
    .matches(/[A-Z]/, 'Password harus mengandung minimal 1 huruf kapital')
    .matches(/[0-9]/, 'Password harus mengandung minimal 1 angka')
    .matches(/[!@#$%^&*()\-+=[\]{};':"\\|,.<>/?]/, 'Password harus mengandung minimal 1 karakter spesial')
    .test('no-space-underscore', 'Password tidak boleh mengandung spasi atau underscore', value => {
      if (!value) return true;
      return !/[ _]/.test(value);
    })
    .required('Password wajib diisi'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
  department: Yup.string(),
  position: Yup.string(),
  phone: Yup.string(),
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      position: '',
      phone: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        const { confirmPassword, ...registerData } = values;
        // Role akan diset sebagai 'user' di backend
        
        await axios.post('http://localhost:5000/api/auth/register', registerData);
        
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #CC6F57 0%, #E5B8AB 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Button
              component={Link}
              to="/login"
              startIcon={<ArrowBack />}
              sx={{ mb: 2 }}
            >
              Kembali ke Login
            </Button>
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              Daftar Akun
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Buat akun baru untuk menggunakan JH Contract Builder
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Pendaftaran Akun Eksternal:</strong> Akun yang didaftarkan melalui halaman ini 
                akan terdaftar sebagai <strong>User</strong> dengan akses terbatas untuk pengguna eksternal. 
                Untuk role lain (Admin, Supervisor, Manager, dll), silakan hubungi Administrator.
              </Typography>
            </Alert>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registrasi berhasil! Mengalihkan ke halaman login...
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Nama Lengkap"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  required
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Konfirmasi Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="department"
                  name="department"
                  label="Departemen (Opsional)"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="position"
                  name="position"
                  label="Posisi (Opsional)"
                  value={formik.values.position}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="No. Telepon (Opsional)"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="+62812345678"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                * Password harus minimal 8 karakter, mengandung huruf kapital, angka, dan karakter spesial (tanpa spasi atau underscore)
              </Typography>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || success}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sudah punya akun?{' '}
              <Link to="/login" style={{ color: '#CC6F57', textDecoration: 'none', fontWeight: 600 }}>
                Login di sini
              </Link>
            </Typography>
          </Box>

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

export default Register;
