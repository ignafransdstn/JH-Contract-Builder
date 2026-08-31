const { Contract, User } = require('../models');
const { sendApprovalNotification, sendStatusUpdateNotification } = require('../utils/emailService');
const logger = require('../utils/logger');

// @desc    Review contract (Supervisor)
// @route   POST /api/approvals/:id/review
// @access  Private (Supervisor)
exports.reviewContract = async (req, res) => {
  try {
    const { action, comments } = req.body; // action: 'reviewed' or 'rejected'

    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver1', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver2', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is the reviewer
    if (contract.reviewerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this contract'
      });
    }

    // Check if contract is in correct status
    if (contract.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: 'Contract is not pending review'
      });
    }

    if (action === 'rejected') {
      // Reject contract
      contract.status = 'rejected';
      contract.currentApprovalLayer = 'completed';
      contract.rejectedById = req.user.id;
      contract.rejectedAt = new Date();
      contract.rejectionReason = comments;

      const approvalHistory = contract.approvalHistory || [];
      approvalHistory.push({
        layer: 'reviewer',
        approverId: req.user.id,
        action: 'rejected',
        comments,
        timestamp: new Date()
      });
      contract.approvalHistory = approvalHistory;

      await contract.save();

      // Send notification to submitter
      try {
        await sendStatusUpdateNotification(contract, contract.submittedBy, 'rejected');
      } catch (emailError) {
        logger.error('Error sending rejection notification:', emailError);
      }

      logger.info(`Contract rejected: ${contract.contractNumber} by ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: 'Contract rejected',
        data: contract
      });
    }

    // Review approved - move to next layer
    contract.status = 'reviewed';
    const approvalHistory = contract.approvalHistory || [];
    approvalHistory.push({
      layer: 'reviewer',
      approverId: req.user.id,
      action: 'reviewed',
      comments,
      timestamp: new Date()
    });
    contract.approvalHistory = approvalHistory;

    // Check if approval layer 1 is required
    if (contract.approver1Id) {
      contract.status = 'pending_approval1';
      contract.currentApprovalLayer = 'approval1';
      
      await contract.save();

      // Send notification to approver1
      try {
        const approver1 = await User.findByPk(contract.approver1Id);
        await sendApprovalNotification(contract, approver1, 'approval1');
      } catch (emailError) {
        logger.error('Error sending approval1 notification:', emailError);
      }

      // Send status update to submitter
      try {
        await sendStatusUpdateNotification(contract, contract.submittedBy, 'reviewed');
      } catch (emailError) {
        logger.error('Error sending status update:', emailError);
      }

      logger.info(`Contract reviewed and sent to approval1: ${contract.contractNumber}`);

      return res.status(200).json({
        success: true,
        message: 'Contract reviewed and sent for approval',
        data: contract
      });
    }

    // No approval layers - complete the contract
    contract.status = 'completed';
    contract.currentApprovalLayer = 'completed';
    contract.completedAt = new Date();
    await contract.save();

    try {
      await sendStatusUpdateNotification(contract, contract.submittedBy, 'completed');
    } catch (emailError) {
      logger.error('Error sending completion notification:', emailError);
    }

    logger.info(`Contract reviewed and completed: ${contract.contractNumber}`);

    res.status(200).json({
      success: true,
      message: 'Contract reviewed and completed',
      data: contract
    });
  } catch (error) {
    logger.error('Review contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing contract',
      error: error.message
    });
  }
};

// @desc    Approve contract - Layer 1
// @route   POST /api/approvals/:id/approve1
// @access  Private (Manager, C-Level)
exports.approveContractLayer1 = async (req, res) => {
  try {
    const { action, comments, signature } = req.body; // action: 'approved' or 'rejected'

    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver2', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is the approver1
    if (contract.approver1Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this contract'
      });
    }

    // Check if contract is in correct status
    if (contract.status !== 'pending_approval1') {
      return res.status(400).json({
        success: false,
        message: 'Contract is not pending approval layer 1'
      });
    }

    if (action === 'rejected') {
      // Reject contract
      contract.status = 'rejected';
      contract.currentApprovalLayer = 'completed';
      contract.rejectedById = req.user.id;
      contract.rejectedAt = new Date();
      contract.rejectionReason = comments;

      const approvalHistory = contract.approvalHistory || [];
      approvalHistory.push({
        layer: 'approval1',
        approverId: req.user.id,
        action: 'rejected',
        comments,
        signature,
        timestamp: new Date()
      });
      contract.approvalHistory = approvalHistory;

      await contract.save();

      // Send notification to submitter
      try {
        await sendStatusUpdateNotification(contract, contract.submittedBy, 'rejected');
      } catch (emailError) {
        logger.error('Error sending rejection notification:', emailError);
      }

      logger.info(`Contract rejected at layer 1: ${contract.contractNumber}`);

      return res.status(200).json({
        success: true,
        message: 'Contract rejected',
        data: contract
      });
    }

    // Approval layer 1 approved
    contract.status = 'approved1';
    const approvalHistory = contract.approvalHistory || [];
    approvalHistory.push({
      layer: 'approval1',
      approverId: req.user.id,
      action: 'approved',
      comments,
      signature,
      timestamp: new Date()
    });
    contract.approvalHistory = approvalHistory;

    // Check if approval layer 2 is required
    if (contract.approver2Id) {
      contract.status = 'pending_approval2';
      contract.currentApprovalLayer = 'approval2';
      
      await contract.save();

      // Send notification to approver2
      try {
        const approver2 = await User.findByPk(contract.approver2Id);
        await sendApprovalNotification(contract, approver2, 'approval2');
      } catch (emailError) {
        logger.error('Error sending approval2 notification:', emailError);
      }

      // Send status update to submitter
      try {
        await sendStatusUpdateNotification(contract, contract.submittedBy, 'approved1');
      } catch (emailError) {
        logger.error('Error sending status update:', emailError);
      }

      logger.info(`Contract approved layer 1 and sent to layer 2: ${contract.contractNumber}`);

      return res.status(200).json({
        success: true,
        message: 'Contract approved and sent to layer 2',
        data: contract
      });
    }

    // No layer 2 - complete the contract
    contract.status = 'completed';
    contract.currentApprovalLayer = 'completed';
    contract.completedAt = new Date();
    await contract.save();

    try {
      await sendStatusUpdateNotification(contract, contract.submittedBy, 'completed');
    } catch (emailError) {
      logger.error('Error sending completion notification:', emailError);
    }

    logger.info(`Contract approved and completed: ${contract.contractNumber}`);

    res.status(200).json({
      success: true,
      message: 'Contract approved and completed',
      data: contract
    });
  } catch (error) {
    logger.error('Approve contract layer 1 error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving contract',
      error: error.message
    });
  }
};

// @desc    Approve contract - Layer 2
// @route   POST /api/approvals/:id/approve2
// @access  Private (C-Level)
exports.approveContractLayer2 = async (req, res) => {
  try {
    const { action, comments, signature } = req.body; // action: 'approved' or 'rejected'

    const contract = await Contract.findByPk(req.params.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is the approver2
    if (contract.approver2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this contract'
      });
    }

    // Check if contract is in correct status
    if (contract.status !== 'pending_approval2') {
      return res.status(400).json({
        success: false,
        message: 'Contract is not pending approval layer 2'
      });
    }

    if (action === 'rejected') {
      // Reject contract
      contract.status = 'rejected';
      contract.currentApprovalLayer = 'completed';
      contract.rejectedById = req.user.id;
      contract.rejectedAt = new Date();
      contract.rejectionReason = comments;

      const approvalHistory = contract.approvalHistory || [];
      approvalHistory.push({
        layer: 'approval2',
        approverId: req.user.id,
        action: 'rejected',
        comments,
        signature,
        timestamp: new Date()
      });
      contract.approvalHistory = approvalHistory;

      await contract.save();

      // Send notification to submitter
      try {
        await sendStatusUpdateNotification(contract, contract.submittedBy, 'rejected');
      } catch (emailError) {
        logger.error('Error sending rejection notification:', emailError);
      }

      logger.info(`Contract rejected at layer 2: ${contract.contractNumber}`);

      return res.status(200).json({
        success: true,
        message: 'Contract rejected',
        data: contract
      });
    }

    // Final approval - complete contract
    contract.status = 'completed';
    contract.currentApprovalLayer = 'completed';
    contract.completedAt = new Date();

    const approvalHistory = contract.approvalHistory || [];
    approvalHistory.push({
      layer: 'approval2',
      approverId: req.user.id,
      action: 'approved',
      comments,
      signature,
      timestamp: new Date()
    });
    contract.approvalHistory = approvalHistory;

    await contract.save();

    // Send notification to submitter
    try {
      await sendStatusUpdateNotification(contract, contract.submittedBy, 'completed');
    } catch (emailError) {
      logger.error('Error sending completion notification:', emailError);
    }

    logger.info(`Contract approved layer 2 and completed: ${contract.contractNumber}`);

    res.status(200).json({
      success: true,
      message: 'Contract approved and completed',
      data: contract
    });
  } catch (error) {
    logger.error('Approve contract layer 2 error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving contract',
      error: error.message
    });
  }
};

// @desc    Get approval statistics
// @route   GET /api/approvals/statistics
// @access  Private
exports.getApprovalStatistics = async (req, res) => {
  try {
    const { fn, col } = require('sequelize');
    
    const stats = await Contract.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const result = {
      total: 0,
      draft: 0,
      pending_review: 0,
      reviewed: 0,
      pending_approval1: 0,
      approved1: 0,
      pending_approval2: 0,
      approved2: 0,
      completed: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      result[stat.status] = parseInt(stat.count);
      result.total += parseInt(stat.count);
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get approval statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
