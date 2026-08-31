const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getAllUsersForApproval,
  resetUserPassword,
  toggleUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/role/:role', getUsersByRole);
router.get('/all-for-approval', getAllUsersForApproval);
router.get('/:id', getUserById);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.put('/:id/reset-password', authorize('admin'), resetUserPassword);
router.put('/:id/status', authorize('admin'), toggleUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
