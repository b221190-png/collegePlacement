const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['admin', 'recruiter', 'student'])
    .withMessage('Role must be admin, recruiter, or student'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search
    } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users
    const users = await User.find(query)
      .select('-password')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is accessing their own profile or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own profile.'
      });
    }

    const user = await User.findById(id).select('-password').populate('companyId', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only or own profile)
// @access  Private
router.put('/:id', protect, [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'recruiter', 'student'])
    .withMessage('Role must be admin, recruiter, or student'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, role, companyId, isActive } = req.body;

    // Check permissions
    const isOwnProfile = req.user._id.toString() === id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update object with allowed fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
      updates.email = email;
    }

    // Only admins can update these fields
    if (isAdmin) {
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (companyId !== undefined) updates.companyId = companyId;

      // Validation for recruiter role
      if (role === 'recruiter' && !companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for recruiter role'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password').populate('companyId', 'name');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete associated student profile if exists
    if (user.role === 'student') {
      const Student = require('../models/Student');
      await Student.findOneAndDelete({ userId: id });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// @route   POST /api/users/:id/deactivate
// @desc    Deactivate user (admin only)
// @access  Private (Admin only)
router.post('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already deactivated'
      });
    }

    // Deactivate user
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user'
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Activate user (admin only)
// @access  Private (Admin only)
router.post('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    // Activate user
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating user'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (admin only)
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Format stats
    const formattedStats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byRole: {}
    };

    stats.forEach(stat => {
      formattedStats.byRole[stat._id] = {
        total: stat.count,
        active: stat.active,
        inactive: stat.count - stat.active
      };
    });

    res.json({
      success: true,
      data: { stats: formattedStats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

module.exports = router;