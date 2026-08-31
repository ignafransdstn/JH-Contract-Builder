const express = require('express');
const router = express.Router();
const {
  createContract,
  getAllContracts,
  getContractById,
  updateContract,
  deleteContract,
  getMyPendingContracts,
  getMySubmittedContracts
} = require('../controllers/contractController');
const {
  generateDocument,
  downloadGeneratedDocument,
  getGenerationPreview,
  viewGeneratedDocument,
  viewGeneratedDocumentAsPDF
} = require('../controllers/documentGeneratorController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/contracts/pending/me:
 *   get:
 *     summary: Get contracts pending for current user
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pending/me', getMyPendingContracts);

/**
 * @swagger
 * /api/contracts/my-submissions:
 *   get:
 *     summary: Get user's own submitted contracts with progress tracking
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, draft, pending_review, reviewed, pending_approval1, approved1, pending_approval2, approved2, completed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of submitted contracts with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *                 pagination:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-submissions', getMySubmittedContracts);

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: Get all contracts with pagination and filtering
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_review, reviewed, pending_approval1, approved1, pending_approval2, approved2, completed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in contract number or title
 *     responses:
 *       200:
 *         description: List of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getAllContracts);

/**
 * @swagger
 * /api/contracts/{id}:
 *   get:
 *     summary: Get contract by ID
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', getContractById);

/**
 * @swagger
 * /api/contracts:
 *   post:
 *     summary: Create a new contract
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - title
 *               - contractData
 *               - reviewer
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Document template ID
 *               title:
 *                 type: string
 *                 description: Contract title
 *               description:
 *                 type: string
 *                 description: Contract description
 *               contractData:
 *                 type: object
 *                 description: Contract form data based on template
 *               reviewer:
 *                 type: string
 *                 format: uuid
 *                 description: Reviewer user ID
 *               approver1:
 *                 type: string
 *                 format: uuid
 *                 description: First approver user ID (optional)
 *               approver2:
 *                 type: string
 *                 format: uuid
 *                 description: Second approver user ID (optional)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authorize('user', 'staff', 'supervisor', 'admin'), createContract);

/**
 * @swagger
 * /api/contracts/{id}:
 *   put:
 *     summary: Update contract (only draft or pending_review)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               contractData:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id', authorize('user', 'staff', 'supervisor', 'admin'), updateContract);

/**
 * @swagger
 * /api/contracts/{id}:
 *   delete:
 *     summary: Delete contract
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id', authorize('user', 'staff', 'supervisor', 'admin'), deleteContract);

// ========== DOCUMENT GENERATION ROUTES ==========

/**
 * @swagger
 * /api/contracts/{id}/generate:
 *   post:
 *     summary: Generate document from contract data
 *     description: Merge contract data into template document using placeholders
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Document generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     downloadUrl:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/:id/generate', generateDocument);

/**
 * @swagger
 * /api/contracts/{id}/download:
 *   get:
 *     summary: Download generated document
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Document file
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/download', downloadGeneratedDocument);

/**
 * @swagger
 * /api/contracts/{id}/view:
 *   get:
 *     summary: View generated document inline (for preview in browser)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Document file for inline viewing
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/view', viewGeneratedDocument);

/**
 * @swagger
 * /api/contracts/{id}/view-pdf:
 *   get:
 *     summary: View generated document as PDF inline (converted for browser preview)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: PDF file for inline viewing in browser
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/view-pdf', viewGeneratedDocumentAsPDF);

/**
 * @swagger
 * /api/contracts/{id}/preview:
 *   get:
 *     summary: Get document generation preview
 *     description: Shows what data will be merged into document placeholders
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Preview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/preview', getGenerationPreview);

module.exports = router;
