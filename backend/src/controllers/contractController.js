const { Contract, DocumentTemplate, User } = require('../models');
const { sendApprovalNotification, sendStatusUpdateNotification } = require('../utils/emailService');
const logger = require('../utils/logger');

// @desc    Create contract submission
// @route   POST /api/contracts
// @access  Private (User, Staff, Admin)
exports.createContract = async (req, res) => {
  try {
    const { templateId, title, description, contractData, notes, status } = req.body;

    // Get template with associations
    const template = await DocumentTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    if (!template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Document template is not active'
      });
    }

    // Get approval matrix from template
    const approvalMatrix = template.approvalMatrix || {};

    // Extract reviewer and approvers from approval matrix
    const reviewerId = approvalMatrix.reviewerId || null;
    const approver1Id = approvalMatrix.approver1Id || null;
    const approver2Id = approvalMatrix.approver2Id || null;

    // Determine contract status and submission details
    const contractStatus = status || 'pending_review';
    const isDraft = contractStatus === 'draft';

    // Create contract with retry mechanism for duplicate contract numbers
    let contract;
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        // Generate contract number
        const contractNumber = await Contract.generateContractNumber();

        // Try to create contract
        contract = await Contract.create({
          contractNumber,
          templateId: templateId,
          title,
          description,
          contractData,
          notes,
          submittedById: req.user.id,
          reviewerId: isDraft ? null : reviewerId,
          approver1Id: isDraft ? null : approver1Id,
          approver2Id: isDraft ? null : approver2Id,
          status: contractStatus,
          currentApprovalLayer: isDraft ? null : 'reviewer',
          submittedAt: isDraft ? null : new Date()
        });

        // Success - break out of retry loop
        break;
      } catch (createError) {
        // Check if it's a unique constraint error on contractNumber
        if (createError.name === 'SequelizeUniqueConstraintError' &&
            createError.errors?.some(err => err.path === 'contractNumber')) {
          retryCount++;
          logger.warn(`Duplicate contract number detected, retrying... (${retryCount}/${maxRetries})`);
          
          if (retryCount >= maxRetries) {
            logger.error('Max retries reached for contract number generation');
            throw new Error('Unable to generate unique contract number after multiple attempts. Please try again.');
          }
          
          // Add small delay before retry to avoid race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // Not a contract number duplicate error, re-throw
          throw createError;
        }
      }
    }

    // Update template usage count
    await template.increment('usageCount');

    // Fetch contract with associations
    const contractWithAssociations = await Contract.findByPk(contract.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'role'] },
        { model: DocumentTemplate, as: 'template', attributes: ['id', 'templateName'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
      ]
    });

    // Send notification to reviewer if exists (only for non-draft contracts)
    if (reviewerId && !isDraft) {
      try {
        const reviewerUser = await User.findByPk(reviewerId);
        if (reviewerUser) {
          await sendApprovalNotification(contractWithAssociations, reviewerUser, 'reviewer');
        }
      } catch (emailError) {
        logger.error('Error sending reviewer notification:', emailError);
      }
    }

    logger.info(`Contract created: ${contract.contractNumber} by ${req.user.email} (${contractStatus})`);

    res.status(201).json({
      success: true,
      message: isDraft ? 'Draft contract created successfully' : 'Contract submitted successfully',
      data: contractWithAssociations
    });
  } catch (error) {
    logger.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating contract',
      error: error.message
    });
  }
};

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
exports.getAllContracts = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 100 } = req.query; // Increased default limit for approvals page
    const { Op } = require('sequelize');

    // Build query based on user role
    const where = {};
    
    // Role-based filtering
    if (req.user.role === 'user' || req.user.role === 'staff') {
      // User/Staff can only see their own contracts OR contracts they need to review/approve
      where[Op.or] = [
        { submittedById: req.user.id },
        { reviewerId: req.user.id },
        { approver1Id: req.user.id },
        { approver2Id: req.user.id }
      ];
    } else if (req.user.role === 'manager' || req.user.role === 'c-level') {
      // Manager/C-Level can see contracts they need to review/approve
      where[Op.or] = [
        { reviewerId: req.user.id },
        { approver1Id: req.user.id },
        { approver2Id: req.user.id }
      ];
    } else if (req.user.role === 'supervisor') {
      // Supervisor can review AND see all contracts from their department
      // For now: supervisors can see all contracts
      // Future: add department filtering
    }
    // Admin can see all contracts (no filter)

    if (status) where.status = status;
    
    if (search) {
      where[Op.or] = [
        { contractNumber: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Execute query with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: contracts } = await Contract.findAndCountAll({
      where,
      include: [
        { model: DocumentTemplate, as: 'template', attributes: ['id', 'templateName', 'category', 'fields'] },
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'approver1', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'approver2', attributes: ['id', 'name', 'email', 'role'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: contracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get all contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contracts',
      error: error.message
    });
  }
};

// @desc    Get contract by ID
// @route   GET /api/contracts/:id
// @access  Private
exports.getContractById = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: DocumentTemplate, as: 'template' },
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'role', 'department'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'approver1', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'approver2', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'rejectedBy', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check access permission
    const canAccess = 
      req.user.role === 'admin' ||
      req.user.role === 'supervisor' ||
      contract.submittedBy.id === req.user.id ||
      (contract.reviewer && contract.reviewer.id === req.user.id) ||
      (contract.approver1 && contract.approver1.id === req.user.id) ||
      (contract.approver2 && contract.approver2.id === req.user.id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this contract'
      });
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    logger.error('Get contract by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contract',
      error: error.message
    });
  }
};

// @desc    Update contract (only draft or by staff/supervisor)
// @route   PUT /api/contracts/:id
// @access  Private (Staff, Supervisor, Admin)
exports.updateContract = async (req, res) => {
  try {
    const { title, description, contractData, notes, status } = req.body;

    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check permission
    const canEdit = 
      req.user.role === 'admin' ||
      req.user.role === 'supervisor' ||
      (req.user.role === 'staff' && contract.submittedById === req.user.id) ||
      (req.user.role === 'user' && contract.submittedById === req.user.id);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this contract'
      });
    }

    // Only allow edit if status is draft or pending_review
    if (!['draft', 'pending_review'].includes(contract.status)) {
      return res.status(400).json({
        success: false,
        message: 'Contract cannot be edited in current status'
      });
    }

    const wasSubmittingFromDraft = contract.status === 'draft' && status === 'pending_review';

    if (title) contract.title = title;
    if (description !== undefined) contract.description = description;
    if (contractData) contract.contractData = contractData;
    if (notes !== undefined) contract.notes = notes;

    // Handle promotion from draft to pending_review (submit action)
    if (wasSubmittingFromDraft) {
      // Populate reviewer/approver IDs from template's approval matrix
      const template = await DocumentTemplate.findByPk(contract.templateId);
      if (template) {
        const approvalMatrix = template.approvalMatrix || {};
        contract.reviewerId = approvalMatrix.reviewerId || null;
        contract.approver1Id = approvalMatrix.approver1Id || null;
        contract.approver2Id = approvalMatrix.approver2Id || null;
      }
      contract.status = 'pending_review';
      contract.currentApprovalLayer = 'reviewer';
      contract.submittedAt = new Date();
    }

    await contract.save();

    // Send notification to reviewer when draft is submitted
    if (wasSubmittingFromDraft && contract.reviewerId) {
      try {
        const contractWithAssociations = await Contract.findByPk(contract.id, {
          include: [
            { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'role'] },
            { model: DocumentTemplate, as: 'template', attributes: ['id', 'templateName'] },
            { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
          ]
        });
        const reviewerUser = await User.findByPk(contract.reviewerId);
        if (reviewerUser) {
          await sendApprovalNotification(contractWithAssociations, reviewerUser, 'reviewer');
        }
      } catch (emailError) {
        logger.error('Error sending reviewer notification on draft submit:', emailError);
      }
    }

    logger.info(`Contract updated: ${contract.contractNumber}${wasSubmittingFromDraft ? ' (submitted from draft)' : ''}`);

    res.status(200).json({
      success: true,
      message: wasSubmittingFromDraft ? 'Contract submitted successfully' : 'Contract updated successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Update contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contract',
      error: error.message
    });
  }
};

// @desc    Delete contract (only draft, only by submitter or admin)
// @route   DELETE /api/contracts/:id
// @access  Private
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Hanya kontrak berstatus draft yang dapat dihapus'
      });
    }

    const isOwner = contract.submittedById === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus kontrak ini'
      });
    }

    await contract.destroy();

    logger.info(`Contract deleted: ${contract.contractNumber}`);

    res.status(200).json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    logger.error('Delete contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contract',
      error: error.message
    });
  }
};

// @desc    Get contracts pending for current user
// @route   GET /api/contracts/pending/me
// @access  Private
exports.getMyPendingContracts = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const where = {};

    // Find contracts pending for current user based on role
    if (req.user.role === 'supervisor') {
      // Reviewer
      where.reviewerId = req.user.id;
      where.status = 'pending_review';
    } else if (req.user.role === 'manager' || req.user.role === 'c-level') {
      // Approver
      where[Op.or] = [
        { approver1Id: req.user.id, status: 'pending_approval1' },
        { approver2Id: req.user.id, status: 'pending_approval2' }
      ];
    } else {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const contracts = await Contract.findAll({
      where,
      include: [
        { model: DocumentTemplate, as: 'template', attributes: ['id', 'templateName', 'category'] },
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['submittedAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Get my pending contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending contracts',
      error: error.message
    });
  }
};

// @desc    Get user's own submitted contracts (for tracking)
// @route   GET /api/contracts/my-submissions
// @access  Private (User, Staff, Admin for all submissions)
exports.getMySubmittedContracts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Role-based filtering: admin sees all, supervisor/manager/c-level see contracts they are involved in
    const where = {};
    if (req.user.role === 'admin') {
      // No filter - admin sees all
    } else if (['supervisor', 'manager', 'c-level'].includes(req.user.role)) {
      // These roles see contracts where they appear in any role
      where[Op.or] = [
        { submittedById: req.user.id },
        { reviewerId: req.user.id },
        { approver1Id: req.user.id },
        { approver2Id: req.user.id }
      ];
    } else {
      // user, staff - only their own submissions
      where.submittedById = req.user.id;
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count: total, rows: contracts } = await Contract.findAndCountAll({
      where,
      include: [
        { 
          model: DocumentTemplate, 
          as: 'template', 
          attributes: ['id', 'templateName', 'category'] 
        },
        { 
          model: User, 
          as: 'submittedBy', 
          attributes: ['id', 'name', 'email', 'role'] 
        },
        { 
          model: User, 
          as: 'reviewer', 
          attributes: ['id', 'name', 'email', 'role'] 
        },
        { 
          model: User, 
          as: 'approver1', 
          attributes: ['id', 'name', 'email', 'role'] 
        },
        { 
          model: User, 
          as: 'approver2', 
          attributes: ['id', 'name', 'email', 'role'] 
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['submittedAt', 'DESC']]
    });

    // Enhance contracts with progress information
    const enhancedContracts = contracts.map(contract => {
      const contractData = contract.toJSON();
      
      // Calculate approval progress
      const progress = {
        review: {
          status: 'pending',
          reviewer: contractData.reviewer,
          completedAt: null,
          comments: null
        },
        approval1: {
          status: 'pending',
          approver: contractData.approver1,
          completedAt: null,
          comments: null
        },
        approval2: contractData.approver2 ? {
          status: 'pending',
          approver: contractData.approver2,
          completedAt: null,
          comments: null
        } : null
      };

      // Update progress based on approval history
      if (contractData.approvalHistory && contractData.approvalHistory.length > 0) {
        contractData.approvalHistory.forEach(history => {
          if (history.layer === 'reviewer') {
            progress.review.status = (history.action === 'approved' || history.action === 'reviewed') ? 'approved' : 'rejected';
            progress.review.completedAt = history.timestamp;
            progress.review.comments = history.comments;
          } else if (history.layer === 'approval1') {
            progress.approval1.status = history.action === 'approved' ? 'approved' : 'rejected';
            progress.approval1.completedAt = history.timestamp;
            progress.approval1.comments = history.comments;
          } else if (history.layer === 'approval2') {
            progress.approval2.status = history.action === 'approved' ? 'approved' : 'rejected';
            progress.approval2.completedAt = history.timestamp;
            progress.approval2.comments = history.comments;
          }
        });
      }

      // Update status based on current contract status
      if (contractData.status === 'draft') {
        progress.review.status = 'not_started';
        progress.approval1.status = 'not_started';
        if (progress.approval2) progress.approval2.status = 'not_started';
      } else if (contractData.status === 'pending_review') {
        progress.review.status = 'pending';
      } else if (contractData.status === 'reviewed' || contractData.status === 'pending_approval1') {
        progress.review.status = 'approved';
        progress.approval1.status = 'pending';
      } else if (contractData.status === 'approved1' || contractData.status === 'pending_approval2') {
        progress.review.status = 'approved';
        progress.approval1.status = 'approved';
        if (progress.approval2) progress.approval2.status = 'pending';
      } else if (contractData.status === 'approved2' || contractData.status === 'completed') {
        progress.review.status = 'approved';
        progress.approval1.status = 'approved';
        if (progress.approval2) progress.approval2.status = 'approved';
      } else if (contractData.status === 'rejected') {
        // Find which layer rejected
        const rejectionHistory = contractData.approvalHistory?.find(h => h.action === 'rejected');
        if (rejectionHistory) {
          if (rejectionHistory.layer === 'reviewer') {
            progress.review.status = 'rejected';
          } else if (rejectionHistory.layer === 'approval1') {
            progress.review.status = 'approved';
            progress.approval1.status = 'rejected';
          } else if (rejectionHistory.layer === 'approval2') {
            progress.review.status = 'approved';
            progress.approval1.status = 'approved';
            progress.approval2.status = 'rejected';
          }
        }
      }

      return {
        ...contractData,
        progress
      };
    });

    const logMessage = req.user.role === 'admin' 
      ? `Admin ${req.user.email} retrieved ${contracts.length} total submitted contracts`
      : `User ${req.user.email} retrieved ${contracts.length} submitted contracts`;
    logger.info(logMessage);

    res.status(200).json({
      success: true,
      data: enhancedContracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get my submitted contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submitted contracts',
      error: error.message
    });
  }
};
