const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const ApplicationReviewHistory = require('../models/ApplicationReviewHistory');
const { protect, authorize, studentAccess, companyAccess } = require('../middleware/auth');

const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'application-resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow resume files (PDF, DOC, DOCX)
  const allowedTypes = {
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for resumes
  }
});

// @route   GET /api/applications
// @desc    Get applications with filters (admin/recruiter only)
// @access  Private (Admin, Recruiter)
router.get('/', protect, authorize('admin', 'recruiter'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'])
    .withMessage('Invalid status'),
  query('companyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID')
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
      status,
      companyId,
      roundId,
      minScore,
      maxScore,
      search
    } = req.query;

    // Build query
    let query = {};

    // If recruiter, only show their company's applications
    if (req.user.role === 'recruiter') {
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: 'Recruiter is not associated with any company'
        });
      }
      query.companyId = req.user.companyId;
    } else if (companyId) {
      query.companyId = companyId;
    }

    if (status) query.status = status;
    if (roundId) query.roundId = roundId;

    // Score filtering
    if (minScore !== undefined || maxScore !== undefined) {
      query.score = {};
      if (minScore !== undefined) query.score.$gte = parseFloat(minScore);
      if (maxScore !== undefined) query.score.$lte = parseFloat(maxScore);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let applications;
    if (req.user.role === 'admin') {
      applications = await Application.find(query)
        .populate('studentId', 'rollNumber branch cgpa phone')
        .populate('userId', 'name email')
        .populate('companyId', 'name logoUrl')
        .populate('roundId', 'name roundNumber')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    } else {
      // Recruiter - already filtered by companyId
      applications = await Application.find(query)
        .populate('studentId', 'rollNumber branch cgpa phone')
        .populate('userId', 'name email')
        .populate('roundId', 'name roundNumber')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    // Apply search filter if provided
    if (search) {
      applications = applications.filter(app => {
        const searchTerm = search.toLowerCase();
        return (
          app.studentId?.rollNumber?.toLowerCase().includes(searchTerm) ||
          app.userId?.name?.toLowerCase().includes(searchTerm) ||
          app.userId?.email?.toLowerCase().includes(searchTerm) ||
          app.studentId?.branch?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Get total count
    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
});

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate('studentId', 'rollNumber branch cgpa phone skills resumeUrl')
      .populate('userId', 'name email')
      .populate('companyId', 'name logoUrl description location packageOffered')
      .populate('roundId', 'name roundNumber description scheduledDate')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    const isOwnApplication = req.user.role === 'student' &&
      application.studentId &&
      (await Student.findOne({ userId: req.user._id, _id: application.studentId._id }));

    const isCompanyRecruiter = req.user.role === 'recruiter' &&
      req.user.companyId &&
      req.user.companyId.toString() === application.companyId._id.toString();

    const isAdmin = req.user.role === 'admin';

    if (!isOwnApplication && !isCompanyRecruiter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get review history for admins and recruiters
    let reviewHistory = [];
    if (isAdmin || isCompanyRecruiter) {
      reviewHistory = await application.getReviewHistory();
    }

    res.json({
      success: true,
      data: {
        application,
        reviewHistory
      }
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
});

// @route   POST /api/applications
// @desc    Submit new application (student only)
// @access  Private (Student only)
router.post('/', protect, authorize('student'), upload.single('resume'), [
  body('companyId')
    .isMongoId()
    .withMessage('Invalid company ID'),
  body('formData')
    .isObject()
    .withMessage('Form data is required')
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

    const { companyId, formData } = req.body;

    // Get student profile
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check if student is already placed
    if (student.placed) {
      return res.status(400).json({
        success: false,
        message: 'You are already placed and cannot apply to more companies'
      });
    }

    // Check if company exists and is active
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (company.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Company is not currently accepting applications'
      });
    }

    // Check application deadline
    if (new Date() > company.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check eligibility
    const eligibility = await student.checkEligibility(companyId);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      studentId: student._id,
      companyId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this company'
      });
    }

    // Create application
    const application = new Application({
      studentId: student._id,
      companyId,
      formData: JSON.parse(formData),
      resumeUrl: req.file ? `/uploads/${req.file.filename}` : student.resumeUrl
    });

    await application.save();

    // Populate response data
    await application.populate([
      { path: 'companyId', select: 'name logoUrl' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application'
    });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status (recruiter/admin only)
// @access  Private (Recruiter, Admin)
router.put('/:id/status', protect, [
  body('status')
    .isIn(['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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
    const { status, notes } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    const isCompanyRecruiter = req.user.role === 'recruiter' &&
      req.user.companyId &&
      req.user.companyId.toString() === application.companyId.toString();

    const isAdmin = req.user.role === 'admin';

    if (!isCompanyRecruiter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if application can be updated
    if (!application.canBeUpdated() && status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'This application cannot be updated in its current state'
      });
    }

    // Update status
    await application.updateStatus(status, req.user._id, notes);

    // Get updated application with populated data
    const updatedApplication = await Application.findById(id)
      .populate('studentId', 'rollNumber branch cgpa phone')
      .populate('userId', 'name email')
      .populate('companyId', 'name logoUrl')
      .populate('roundId', 'name roundNumber');

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: updatedApplication }
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application status'
    });
  }
});

// @route   PUT /api/applications/:id/score
// @desc    Update application score (recruiter/admin only)
// @access  Private (Recruiter, Admin)
router.put('/:id/score', protect, [
  body('score')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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
    const { score, notes } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    const isCompanyRecruiter = req.user.role === 'recruiter' &&
      req.user.companyId &&
      req.user.companyId.toString() === application.companyId.toString();

    const isAdmin = req.user.role === 'admin';

    if (!isCompanyRecruiter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update score
    await application.updateScore(score, req.user._id, notes);

    // Get updated application with populated data
    const updatedApplication = await Application.findById(id)
      .populate('studentId', 'rollNumber branch cgpa phone')
      .populate('userId', 'name email')
      .populate('companyId', 'name logoUrl');

    res.json({
      success: true,
      message: 'Application score updated successfully',
      data: { application: updatedApplication }
    });
  } catch (error) {
    console.error('Update application score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application score'
    });
  }
});

// @route   POST /api/applications/bulk-update
// @desc    Bulk update applications (recruiter/admin only)
// @access  Private (Recruiter, Admin)
router.post('/bulk-update', protect, authorize('admin', 'recruiter'), [
  body('applicationIds')
    .isArray({ min: 1 })
    .withMessage('Application IDs must be a non-empty array'),
  body('status')
    .isIn(['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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

    const { applicationIds, status, notes } = req.body;

    // Build query
    let query = { _id: { $in: applicationIds } };

    // If recruiter, only update their company's applications
    if (req.user.role === 'recruiter') {
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: 'Recruiter is not associated with any company'
        });
      }
      query.companyId = req.user.companyId;
    }

    // Find applications to update
    const applications = await Application.find(query);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No applications found'
      });
    }

    // Update each application
    const updatePromises = applications.map(async (application) => {
      if (application.canBeUpdated() || status === 'rejected') {
        return await application.updateStatus(status, req.user._id, notes);
      }
      return application;
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `${applications.length} applications updated successfully`
    });
  } catch (error) {
    console.error('Bulk update applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk updating applications'
    });
  }
});

// @route   GET /api/applications/student/:studentId
// @desc    Get applications for a student
// @access  Private
router.get('/student/:studentId', protect, studentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check permissions
    if (req.user.role === 'student' && req.studentId && req.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own applications.'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const applications = await Application.getByStudent(studentId)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments({ studentId });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get student applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student applications'
    });
  }
});

// @route   GET /api/applications/company/:companyId
// @desc    Get applications for a company
// @access  Private (Admin or company recruiter)
router.get('/company/:companyId', protect, companyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20, status, roundId } = req.query;

    // Build query
    const query = { companyId };
    if (status) query.status = status;
    if (roundId) query.roundId = roundId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const applications = await Application.getByCompany(query)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get company applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company applications'
    });
  }
});

// @route   GET /api/applications/stats
// @desc    Get application statistics
// @access  Private (Admin or company recruiter)
router.get('/stats', protect, async (req, res) => {
  try {
    let stats;

    if (req.user.role === 'admin') {
      stats = await Application.getDashboardStats();
    } else if (req.user.role === 'recruiter') {
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: 'Recruiter is not associated with any company'
        });
      }
      stats = await Application.getDashboardStats(req.user.companyId);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application statistics'
    });
  }
});

module.exports = router;