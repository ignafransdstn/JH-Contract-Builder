const { User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Password validation helper
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password harus minimal 8 karakter' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 huruf kapital' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 angka' };
  }
  
  if (!/[!@#$%^&*()\-+=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 karakter spesial (kecuali spasi dan underscore)' };
  }
  
  if (/[ _]/.test(password)) {
    return { valid: false, message: 'Password tidak boleh mengandung spasi atau underscore (_)' };
  }
  
  return { valid: true };
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Supervisor)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 10 } = req.query;

    // Build query
    const where = {};
    if (role) where.role = role;
    if (department) where.department = department;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Execute query with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, position, phone } = req.body;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      position,
      phone,
      createdBy: req.user.id
    });

    logger.info(`User created: ${email} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, department, position, phone } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.destroy();

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const users = await User.findAll({
      where: { 
        role, 
        status: 'active' // Changed from isActive to status
      },
      attributes: ['id', 'name', 'email', 'role', 'department', 'position'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users by role',
      error: error.message
    });
  }
};

// @desc    Get all active users for approval matrix
// @route   GET /api/users/all-for-approval
// @access  Private
exports.getAllUsersForApproval = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { 
        status: 'active'
      },
      attributes: ['id', 'name', 'email', 'role', 'department', 'position'],
      order: [['role', 'ASC'], ['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get all users for approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users for approval',
      error: error.message
    });
  }
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin)
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by User model hook)
    user.password = newPassword;
    await user.save();

    logger.info(`Password reset for user: ${user.email} by admin: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Toggle user status (active/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value
    if (!status || !['active', 'deactivate'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "deactivate"'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating their own account
    if (user.id === req.user.id && status === 'deactivate') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Update status
    user.status = status;
    await user.save();

    logger.info(`User status changed: ${user.email} to ${status} by admin: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing user status',
      error: error.message
    });
  }
};
