const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ApplicationWindow = require('../models/ApplicationWindow');
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/application-windows
// @desc    Get all application windows (admin only)
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
  query('companyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID'),
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
      companyId,
      isActive,
      search
    } = req.query;

    // Build query
    const query = {};
    if (companyId) query.companyId = companyId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get application windows
    const windows = await ApplicationWindow.find(query)
      .populate('companyId', 'name logoUrl')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get application stats for each window
    const windowsWithStats = await Promise.all(
      windows.map(async (window) => {
        const stats = await window.getApplicationStats();
        const eligibleCount = await window.getEligibleStudentsCount();
        return {
          ...window.toObject(),
          applicationStats: stats,
          eligibleCount,
          isCurrentlyActive: window.isCurrentlyActive()
        };
      })
    );

    // Get total count
    const total = await ApplicationWindow.countDocuments(query);

    res.json({
      success: true,
      data: {
        windows: windowsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get application windows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application windows'
    });
  }
});

// @route   GET /api/application-windows/active
// @desc    Get currently active application windows
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const windows = await ApplicationWindow.getActiveWindows();

    res.json({
      success: true,
      data: { windows }
    });
  } catch (error) {
    console.error('Get active application windows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active application windows'
    });
  }
});

// @route   GET /api/application-windows/upcoming
// @desc    Get upcoming application windows
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const windows = await ApplicationWindow.getUpcomingWindows(parseInt(limit));

    res.json({
      success: true,
      data: { windows }
    });
  } catch (error) {
    console.error('Get upcoming application windows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming application windows'
    });
  }
});

// @route   GET /api/application-windows/:id
// @desc    Get application window by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const window = await ApplicationWindow.findById(id)
      .populate('companyId', 'name logoUrl description')
      .populate('createdBy', 'name');

    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Application window not found'
      });
  }

    // Get additional stats
    const stats = await window.getApplicationStats();
    const eligibleCount = await window.getEligibleStudentsCount();

    res.json({
      success: true,
      data: {
        window: {
          ...window.toObject(),
          applicationStats: stats,
          eligibleCount,
          isCurrentlyActive: window.isCurrentlyActive()
        }
      }
    });
  } catch (error) {
    console.error('Get application window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application window'
    });
  }
});

// @route   POST /api/application-windows
// @desc    Create new application window (admin only)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('companyId')
    .isMongoId()
    .withMessage('Invalid company ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('minCGPA')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Minimum CGPA must be between 0 and 10'),
  body('maxBacklogs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum backlogs must be a non-negative integer'),
  body('eligibleBranches')
    .optional()
    .isArray()
    .withMessage('Eligible branches must be an array'),
  body('passingYear')
    .optional()
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Passing year must be between 2000 and 2030')
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
      companyId,
      startDate,
      endDate,
      startTime,
      endTime,
      minCGPA,
      maxBacklogs = 0,
      eligibleBranches = [],
      passingYear,
      description
    } = req.body;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if there's an active window for this company
    const existingActiveWindow = await ApplicationWindow.findOne({
      companyId,
      isActive: true,
      $or: [
        {
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(startDate) }
        },
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(endDate) }
        },
        {
          startDate: { $gte: new Date(startDate) },
          endDate: { $lte: new Date(endDate) }
        }
      ]
    });

    if (existingActiveWindow) {
      return res.status(400).json({
        success: false,
        message: 'Company already has an active application window during this period'
      });
    }

    // Create application window
    const window = new ApplicationWindow({
      companyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      minCGPA,
      maxBacklogs,
      eligibleBranches,
      passingYear,
      description,
      createdBy: req.user._id
    });

    await window.save();

    // Populate response data
    await window.populate('companyId', 'name logoUrl');

    res.status(201).json({
      success: true,
      message: 'Application window created successfully',
      data: { window }
    });
  } catch (error) {
    console.error('Create application window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating application window'
    });
  }
});

// @route   PUT /api/application-windows/:id
// @desc    Update application window (admin only)
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('minCGPA')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Minimum CGPA must be between 0 and 10'),
  body('maxBacklogs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum backlogs must be a non-negative integer')
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
    const updates = req.body;

    const window = await ApplicationWindow.findById(id);
    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Application window not found'
      });
    }

    // Update window
    const updatedWindow = await ApplicationWindow.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('companyId', 'name logoUrl');

    res.json({
      success: true,
      message: 'Application window updated successfully',
      data: { window: updatedWindow }
    });
  } catch (error) {
    console.error('Update application window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application window'
    });
  }
});

// @route   DELETE /api/application-windows/:id
// @desc    Delete application window (admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const window = await ApplicationWindow.findById(id);
    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Application window not found'
      });
    }

    // Check if window is currently active
    if (window.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active application window'
      });
    }

    await ApplicationWindow.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Application window deleted successfully'
    });
  } catch (error) {
    console.error('Delete application window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting application window'
    });
  }
});

// @route   POST /api/application-windows/:id/deactivate
// @desc    Deactivate application window (admin only)
// @access  Private (Admin only)
router.post('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const window = await ApplicationWindow.findById(id);
    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Application window not found'
      });
    }

    if (!window.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Application window is already deactivated'
      });
    }

    window.isActive = false;
    await window.save();

    res.json({
      success: true,
      message: 'Application window deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate application window error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating application window'
    });
  }
});

// @route   GET /api/application-windows/eligible/:companyId
// @desc    Check eligibility for a company (student only)
// @access  Private (Student only)
router.get('/eligible/:companyId', protect, authorize('student'), async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get student profile
    const Student = require('../models/Student');
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check eligibility
    const eligibility = await student.checkEligibility(companyId);

    // Get application window details if eligible
    let windowDetails = null;
    if (eligibility.eligible) {
      const window = await ApplicationWindow.findOne({
        companyId,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      }).populate('companyId', 'name logoUrl');

      if (window) {
        windowDetails = {
          ...window.toObject(),
          isCurrentlyActive: window.isCurrentlyActive()
        };
      }
    }

    res.json({
      success: true,
      data: {
        eligibility,
        windowDetails
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking eligibility'
    });
  }
});

module.exports = router;