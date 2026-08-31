const { User } = require('../models');
const jwt = require('jsonwebtoken');
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

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (or Admin only in production)
exports.register = async (req, res) => {
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
    const userExists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // For public registration (no authentication), only allow 'user' role
    // Admin can create users with any role through /api/users endpoint
    const userRole = req.user ? (role || 'user') : 'user';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      department,
      position,
      phone,
      createdBy: req.user ? req.user.id : null
    });

    // Generate token
    const token = generateToken(user.id);

    logger.info(`New user registered: ${email} with role: ${userRole}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position
        },
        token
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user - use scope to include password
    const user = await User.scope('withPassword').findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email tidak terdaftar. Silakan periksa kembali email Anda atau daftar akun baru.'
      });
    }

    // Check if user status is active
    if (user.status === 'deactivate') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah ditangguhkan. Silakan hubungi Administrator untuk informasi lebih lanjut.',
        reason: 'account_suspended'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password salah. Silakan periksa kembali password Anda.'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user info',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, position, phone } = req.body;

    const user = await User.findByPk(req.user.id);

    if (name) user.name = name;
    if (department) user.department = department;
    if (position) user.position = position;
    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const user = await User.scope('withPassword').findByPk(req.user.id);

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};
