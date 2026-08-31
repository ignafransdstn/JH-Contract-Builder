import api from './api';

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// User Services
export const userService = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  getAllUsersForApproval: () => api.get('/users/all-for-approval'),
};

// Document Template Services
export const documentService = {
  getAllTemplates: (params) => api.get('/documents', { 
    params: { ...params, _t: Date.now() } // Cache-busting timestamp
  }),
  getTemplateById: (id) => api.get(`/documents/${id}`),
  // New hybrid flow
  uploadSimple: (formData) => api.post('/documents/upload-simple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  extractPlaceholders: (id) => api.get(`/documents/${id}/extract-placeholders`),
  completeTemplate: (id, data) => api.put(`/documents/${id}/complete`, data),
  // Old AI flow
  uploadAndScanDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateTemplateFields: (id, fields) => api.put(`/documents/${id}/fields`, { fields }),
  setApprovalMatrix: (id, approvalMatrix) => api.put(`/documents/${id}/approval-matrix`, { approvalMatrix }),
  updateTemplate: (id, data) => api.put(`/documents/${id}`, data),
  deleteTemplate: (id) => api.delete(`/documents/${id}`),
};

// Contract Services
export const contractService = {
  getAllContracts: (params) => api.get('/contracts', { params }),
  getContractById: (id) => api.get(`/contracts/${id}`),
  createContract: (contractData) => api.post('/contracts', contractData),
  updateContract: (id, contractData) => api.put(`/contracts/${id}`, contractData),
  deleteContract: (id) => api.delete(`/contracts/${id}`),
  getMyPendingContracts: () => api.get('/contracts/pending/me'),
  getMySubmittedContracts: (params) => api.get('/contracts/my-submissions', { 
    params: { ...params, _t: Date.now() } // Cache-busting
  }),
  // Document generation
  generateDocument: (id) => api.post(`/contracts/${id}/generate`),
  downloadDocument: (id) => api.get(`/contracts/${id}/download`, { responseType: 'blob' }),
  viewDocument: (id) => api.get(`/contracts/${id}/view`, { responseType: 'blob' }),
  viewDocumentAsPDF: (id) => api.get(`/contracts/${id}/view-pdf`, { responseType: 'blob' }),
  getGenerationPreview: (id) => api.get(`/contracts/${id}/preview`),
};

// Approval Services
export const approvalService = {
  reviewContract: (id, data) => api.post(`/approvals/${id}/review`, data),
  approveContractLayer1: (id, data) => api.post(`/approvals/${id}/approve1`, data),
  approveContractLayer2: (id, data) => api.post(`/approvals/${id}/approve2`, data),
  getApprovalStatistics: () => api.get('/approvals/statistics'),
};

export default api;
