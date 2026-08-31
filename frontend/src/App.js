import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from 'react-query';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import DocumentTemplates from './pages/Documents/DocumentTemplates';
import CreateTemplate from './pages/Documents/CreateTemplate';
import EditTemplate from './pages/Documents/EditTemplate';
import ViewTemplate from './pages/Documents/ViewTemplate';
import Contracts from './pages/Contracts/Contracts';
import CreateContract from './pages/Contracts/CreateContract';
import ContractDetail from './pages/Contracts/ContractDetail';
import MySubmissions from './pages/Contracts/MySubmissions';
import PendingApprovals from './pages/Approvals/PendingApprovals';
import Users from './pages/Users/Users';
import Profile from './pages/Profile/Profile';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

// Theme with color palette from the image
const theme = createTheme({
  palette: {
    primary: {
      main: '#CC6F57',
      dark: '#A05643',
      light: '#E5B8AB',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8B7B6F',
      light: '#A89A8E',
      dark: '#6B5D51',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#2196F3',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                
                {/* Document Templates */}
                <Route 
                  path="templates" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor', 'staff']}>
                      <DocumentTemplates />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="templates/create" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor']}>
                      <CreateTemplate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="templates/:id" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor', 'staff']}>
                      <ViewTemplate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="templates/:id/edit" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor', 'staff']}>
                      <EditTemplate />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Contracts */}
                <Route path="contracts" element={<Contracts />} />
                <Route 
                  path="contracts/create" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor', 'staff', 'user']}>
                      <CreateContract />
                    </ProtectedRoute>
                  } 
                />
                <Route path="contracts/:id" element={<ContractDetail />} />
                <Route 
                  path="my-submissions" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor', 'manager', 'c-level', 'staff', 'user']}>
                      <MySubmissions />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Approvals */}
                <Route 
                  path="approvals" 
                  element={
                    <ProtectedRoute roles={['admin', 'supervisor', 'manager', 'c-level']}>
                      <PendingApprovals />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Users - Admin Only */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Users />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Profile */}
                <Route path="profile" element={<Profile />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
