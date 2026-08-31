const express = require('express');
const router = express.Router();
const {
  uploadAndScanDocument,
  uploadDocumentSimple,
  extractPlaceholders,
  completeTemplate,
  updateTemplateFields,
  setApprovalMatrix,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getAllTemplates);
router.get('/:id', getTemplateById);

// Supervisor, Staff, Admin routes
router.put('/:id/fields', authorize('supervisor', 'staff', 'admin'), updateTemplateFields);

// Supervisor, Admin only routes - NEW HYBRID FLOW
router.post('/upload-simple', authorize('supervisor', 'admin'), upload.single('document'), uploadDocumentSimple);
router.get('/:id/extract-placeholders', authorize('supervisor', 'admin'), extractPlaceholders);
router.put('/:id/complete', authorize('supervisor', 'admin'), completeTemplate);

// Supervisor, Admin only routes - OLD AI FLOW
router.post('/upload', authorize('supervisor', 'admin'), upload.single('document'), uploadAndScanDocument);
router.put('/:id/approval-matrix', authorize('supervisor', 'admin'), setApprovalMatrix);
router.put('/:id', authorize('supervisor', 'admin'), updateTemplate);
router.delete('/:id', authorize('supervisor', 'admin'), deleteTemplate);

module.exports = router;
