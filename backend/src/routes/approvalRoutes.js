const express = require('express');
const router = express.Router();
const {
  reviewContract,
  approveContractLayer1,
  approveContractLayer2,
  getApprovalStatistics
} = require('../controllers/approvalController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/approvals/statistics:
 *   get:
 *     summary: Get approval statistics
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Approval statistics by status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     draft:
 *                       type: integer
 *                     pending_review:
 *                       type: integer
 *                     reviewed:
 *                       type: integer
 *                     pending_approval1:
 *                       type: integer
 *                     approved1:
 *                       type: integer
 *                     pending_approval2:
 *                       type: integer
 *                     approved2:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *                     rejected:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/statistics', getApprovalStatistics);

/**
 * @swagger
 * /api/approvals/{id}/review:
 *   post:
 *     summary: Review contract (Supervisor)
 *     tags: [Approvals]
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
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [reviewed, rejected]
 *                 description: Review action
 *               comments:
 *                 type: string
 *                 description: Review comments
 *     responses:
 *       200:
 *         description: Contract reviewed successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/review', authorize('supervisor', 'admin'), reviewContract);

/**
 * @swagger
 * /api/approvals/{id}/approve1:
 *   post:
 *     summary: Approve contract - Layer 1 (Manager/C-Level)
 *     tags: [Approvals]
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
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Approval action
 *               comments:
 *                 type: string
 *                 description: Approval comments
 *               signature:
 *                 type: string
 *                 description: Base64 encoded signature image
 *     responses:
 *       200:
 *         description: Contract approved/rejected successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/approve1', authorize('manager', 'c-level', 'admin'), approveContractLayer1);

/**
 * @swagger
 * /api/approvals/{id}/approve2:
 *   post:
 *     summary: Approve contract - Layer 2 (C-Level)
 *     tags: [Approvals]
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
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Final approval action
 *               comments:
 *                 type: string
 *                 description: Approval comments
 *               signature:
 *                 type: string
 *                 description: Base64 encoded signature image
 *     responses:
 *       200:
 *         description: Contract final approval completed
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/approve2', authorize('c-level', 'admin'), approveContractLayer2);

module.exports = router;
