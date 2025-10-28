const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Company = require('../models/Company');
const RecruitmentRound = require('../models/RecruitmentRound');
const Application = require('../models/Application');
const { protect, authorize, companyAccess } = require('../middleware/auth');

const router = express.Router();

// Configure multer for company logo uploads
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
    cb(null, 'company-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow image files only
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for logos
  }
});

// @route   GET /api/companies
// @desc    Get all companies with filters
// @access  Public (with optional auth for more data)
router.get('/', [
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
    .isIn(['active', 'inactive', 'completed'])
    .withMessage('Status must be active, inactive, or completed'),
  query('industry')
    .optional()
    .isString()
    .withMessage('Industry must be a string')
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
      industry,
      search,
      minPackage,
      maxPackage,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (industry) query.industry = { $regex: industry, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Package filtering (basic implementation)
    if (minPackage || maxPackage) {
      const packageQuery = {};
      if (minPackage) packageQuery.$gte = minPackage;
      if (maxPackage) packageQuery.$lte = maxPackage;
      query.packageOffered = packageQuery;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get companies
    const companies = await Company.find(query)
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get application counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const stats = await company.getApplicationStats();
        return {
          ...company.toObject(),
          applicationStats: stats
        };
      })
    );

    // Get total count
    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: {
        companies: companiesWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching companies'
    });
  }
});

// @route   GET /api/companies/active
// @desc    Get active companies (for students)
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const companies = await Company.getActiveCompanies();

    // Get application counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const stats = await company.getApplicationStats();
        return {
          ...company.toObject(),
          applicationStats: stats,
          isApplicationOpen: company.isApplicationOpen()
        };
      })
    );

    res.json({
      success: true,
      data: { companies: companiesWithStats }
    });
  } catch (error) {
    console.error('Get active companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active companies'
    });
  }
});

// @route   GET /api/companies/:id
// @desc    Get company by ID
// @access  Public (with optional auth)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id)
      .populate('createdBy', 'name')
      .populate({
        path: 'recruitmentProcess',
        select: 'roundName description duration'
      });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get application stats
    const applicationStats = await company.getApplicationStats();

    // Get recruitment rounds
    const recruitmentRounds = await company.getRecruitmentRounds();

    // Check if user is authenticated and has access to more data
    let additionalData = {};
    if (req.user) {
      if (req.user.role === 'admin' ||
          (req.user.role === 'recruiter' && req.user.companyId && req.user.companyId.toString() === id)) {
        // Get full applications for admin/recruiter
        additionalData.applications = await company.getApplications();
      } else if (req.user.role === 'student') {
        // Check if student has already applied
        const Student = require('../models/Student');
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
          const Application = require('../models/Application');
          const existingApplication = await Application.findOne({
            studentId: student._id,
            companyId: id
          });
          additionalData.hasApplied = !!existingApplication;
          additionalData.applicationStatus = existingApplication?.status;
        }
      }
    }

    res.json({
      success: true,
      data: {
        company: {
          ...company.toObject(),
          applicationStats,
          recruitmentRounds,
          isApplicationOpen: company.isApplicationOpen(),
          ...additionalData
        }
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company'
    });
  }
});

// @route   POST /api/companies
// @desc    Create new company (admin only)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), upload.single('logo'), [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Company description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('industry')
    .isIn(['Information Technology', 'Software Development', 'Consulting', 'Banking and Finance', 'Manufacturing', 'Healthcare', 'Education', 'E-commerce', 'Telecommunications', 'Automotive', 'Other'])
    .withMessage('Invalid industry'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('packageOffered')
    .trim()
    .notEmpty()
    .withMessage('Package offered is required'),
  body('totalPositions')
    .isInt({ min: 1 })
    .withMessage('Total positions must be at least 1'),
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
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
      name,
      description,
      industry,
      location,
      packageOffered,
      totalPositions,
      applicationDeadline,
      requirements = [],
      skills = [],
      jobDescription,
      eligibilityCriteria,
      recruitmentProcess = [],
      website,
      contactEmail,
      contactPhone
    } = req.body;

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    // Create company
    const company = new Company({
      name,
      description,
      industry,
      location,
      packageOffered,
      totalPositions,
      applicationDeadline: new Date(applicationDeadline),
      requirements,
      skills,
      jobDescription,
      eligibilityCriteria,
      recruitmentProcess,
      website,
      contactEmail,
      contactPhone,
      createdBy: req.user._id
    });

    // Add logo if uploaded
    if (req.file) {
      company.logoUrl = `/uploads/${req.file.filename}`;
    }

    await company.save();

    // Create default recruitment rounds
    await company.createDefaultRounds();

    // Get populated company data
    const populatedCompany = await Company.findById(company._id)
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company: populatedCompany }
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating company'
    });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update company (admin only or company recruiter)
// @access  Private
router.put('/:id', protect, companyAccess, upload.single('logo'), [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  body('totalPositions')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total positions must be at least 1'),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
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

    // Find company
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company name is being changed and if it already exists
    if (updates.name && updates.name !== company.name) {
      const existingCompany = await Company.findOne({
        name: updates.name,
        _id: { $ne: id }
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this name already exists'
        });
      }
    }

    // Update logo if uploaded
    if (req.file) {
      updates.logoUrl = `/uploads/${req.file.filename}`;
    }

    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: { company: updatedCompany }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating company'
    });
  }
});

// @route   DELETE /api/companies/:id
// @desc    Delete company (admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Delete associated applications
    await Application.deleteMany({ companyId: id });

    // Delete recruitment rounds
    await RecruitmentRound.deleteMany({ companyId: id });

    // Delete company
    await Company.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting company'
    });
  }
});

// @route   POST /api/companies/:id/rounds
// @desc    Create recruitment round for company
// @access  Private (Admin or company recruiter)
router.post('/:id/rounds', protect, companyAccess, [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Round name is required')
    .isLength({ max: 100 })
    .withMessage('Round name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  body('roundNumber')
    .isInt({ min: 1 })
    .withMessage('Round number must be at least 1')
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
    const {
      name,
      description,
      scheduledDate,
      roundNumber,
      duration,
      location,
      isOnline = false,
      meetingLink,
      instructions,
      maxCandidates
    } = req.body;

    // Check if company exists
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if round number already exists for this company
    const existingRound = await RecruitmentRound.findOne({
      companyId: id,
      roundNumber
    });

    if (existingRound) {
      return res.status(400).json({
        success: false,
        message: `Round ${roundNumber} already exists for this company`
      });
    }

    // Create recruitment round
    const round = new RecruitmentRound({
      companyId: id,
      name,
      description,
      scheduledDate: new Date(scheduledDate),
      roundNumber,
      duration,
      location,
      isOnline,
      meetingLink,
      instructions,
      maxCandidates,
      createdBy: req.user._id
    });

    await round.save();

    res.status(201).json({
      success: true,
      message: 'Recruitment round created successfully',
      data: { round }
    });
  } catch (error) {
    console.error('Create recruitment round error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating recruitment round'
    });
  }
});

// @route   GET /api/companies/:id/rounds
// @desc    Get recruitment rounds for company
// @access  Private (Admin or company recruiter)
router.get('/:id/rounds', protect, companyAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const rounds = await company.getRecruitmentRounds();

    res.json({
      success: true,
      data: { rounds }
    });
  } catch (error) {
    console.error('Get recruitment rounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recruitment rounds'
    });
  }
});

// @route   GET /api/companies/search
// @desc    Search companies
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: query, industry, location, type } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build filters
    const filters = {};
    if (industry) filters.industry = industry;
    if (location) filters.location = { $regex: location, $options: 'i' };

    const companies = await Company.searchCompanies(query, filters);

    res.json({
      success: true,
      data: { companies }
    });
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching companies'
    });
  }
});

// @route   GET /api/companies/stats
// @desc    Get company statistics (admin only)
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Company.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$status', 'active', 1, 0] } },
          totalPositions: { $sum: '$totalPositions' }
        }
      }
    ]);

    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ status: 'active' });

    // Get top industries
    const topIndustries = stats
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        inactiveCompanies: totalCompanies - activeCompanies,
        byIndustry: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            active: stat.active,
            totalPositions: stat.totalPositions
          };
          return acc;
        }, {}),
        topIndustries
      }
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company statistics'
    });
  }
});

module.exports = router;