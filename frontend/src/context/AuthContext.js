import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Function to load user from localStorage
  const loadUserFromStorage = () => {
    setLoading(true);
    
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setInitialized(true);
        setLoading(false);
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setInitialized(true);
        setLoading(false);
        return false;
      }
    } else {
      setUser(null);
      setInitialized(true);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const { user, token } = response.data.data;
      
      if (!user || !token) {
        throw new Error('Missing user or token in response');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setLoading(false);
      setInitialized(true);
      
      toast.success('Login berhasil!');
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login gagal. Silakan coba lagi.';
      const reason = error.response?.data?.reason;
      
      // Special handling for suspended account
      if (reason === 'account_suspended' || error.response?.status === 403) {
        toast.error(message, {
          autoClose: 10000, // 10 seconds for important message
          position: "top-center",
          style: {
            background: '#d32f2f',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '16px'
          }
        });
      } else if (error.response?.status === 401) {
        // Invalid credentials - show clear error message
        toast.error(message, {
          autoClose: 5000,
          position: "top-center"
        });
      } else {
        // Other errors
        toast.error(message);
      }
      
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Anda telah logout');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
