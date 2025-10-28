const express = require('express');
const { body, query, validationResult } = require('express-validator');
const OffCampusOpportunity = require('../models/OffCampusOpportunity');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/off-campus-opportunities
// @desc    Get all off-campus opportunities with filters
// @access  Public
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['internship', 'full-time', 'freelance', 'remote', 'part-time'])
    .withMessage('Invalid opportunity type'),
  query('industry')
    .optional()
    .isString()
    .withMessage('Industry must be a string'),
  query('experience')
    .optional()
    .isIn(['fresher', 'experienced', 'any'])
    .withMessage('Invalid experience level')
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
      type,
      industry,
      experience,
      location,
      skills,
      search,
      sortBy = 'postedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {
      isActive: true,
      applicationDeadline: { $gte: new Date() }
    };

    if (type) query.type = type;
    if (industry) query.industry = { $regex: industry, $options: 'i' };
    if (experience) query.experience = experience;
    if (location) {
      query.$or = [
        { location: { $regex: location, $options: 'i' } },
        { isRemote: true }
      ];
    }

    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get opportunities
    const opportunities = await OffCampusOpportunity.find(query)
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Increment view count for each opportunity
    const opportunitiesWithViews = opportunities.map(opp => ({
      ...opp.toObject(),
      isStillActive: opp.isStillActive
    }));

    // Get total count
    const total = await OffCampusOpportunity.countDocuments(query);

    res.json({
      success: true,
      data: {
        opportunities: opportunitiesWithViews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get off-campus opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching off-campus opportunities'
    });
  }
});

// @route   GET /api/off-campus-opportunities/featured
// @desc    Get featured off-campus opportunities
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const opportunities = await OffCampusOpportunity.getFeaturedOpportunities(parseInt(limit));

    res.json({
      success: true,
      data: { opportunities }
    });
  } catch (error) {
    console.error('Get featured opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured opportunities'
    });
  }
});

// @route   GET /api/off-campus-opportunities/:id
// @desc    Get off-campus opportunity by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await OffCampusOpportunity.findById(id)
      .populate('createdBy', 'name');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check if opportunity is still active
    if (!opportunity.isActive || new Date() > opportunity.applicationDeadline) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity is no longer active'
      });
    }

    // Increment view count
    if (req.user) {
      await opportunity.incrementViews();
    }

    res.json({
      success: true,
      data: {
        opportunity: {
          ...opportunity.toObject(),
          isStillActive: opportunity.isStillActive
        }
      }
    });
  } catch (error) {
    console.error('Get off-campus opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching opportunity'
    });
  }
});

// @route   POST /api/off-campus-opportunities
// @desc    Create new off-campus opportunity (admin/recruiter only)
// @access  Private (Admin, Recruiter)
router.post('/', protect, authorize('admin', 'recruiter'), [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required'),
  body('type')
    .isIn(['internship', 'full-time', 'freelance', 'remote', 'part-time'])
    .withMessage('Invalid opportunity type'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('applicationLink')
    .isURL()
    .withMessage('Application link must be a valid URL'),
  body('industry')
    .isIn(['Information Technology', 'Software Development', 'Consulting', 'Banking and Finance', 'Manufacturing', 'Healthcare', 'Education', 'E-commerce', 'Telecommunications', 'Automotive', 'Marketing', 'Design', 'Other'])
    .withMessage('Invalid industry'),
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    })
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
      title,
      company,
      type,
      location,
      isRemote = false,
      duration,
      stipend,
      salary,
      description,
      requirements = [],
      skills = [],
      applicationLink,
      industry,
      experience = 'fresher',
      minExperience,
      maxExperience,
      tags = []
    } = req.body;

    // Create opportunity
    const opportunity = new OffCampusOpportunity({
      title,
      company,
      type,
      location,
      isRemote,
      duration,
      stipend,
      salary,
      description,
      requirements,
      skills,
      applicationLink,
      industry,
      experience,
      minExperience,
      maxExperience,
      tags,
      createdBy: req.user._id
    });

    await opportunity.save();

    // Populate response data
    await opportunity.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Off-campus opportunity created successfully',
      data: { opportunity }
    });
  } catch (error) {
    console.error('Create off-campus opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating opportunity'
    });
  }
});

// @route   PUT /api/off-campus-opportunities/:id
// @desc    Update off-campus opportunity (admin/recruiter only)
// @access  Private (Admin, Recruiter)
router.put('/:id', protect, authorize('admin', 'recruiter'), [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
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

    const opportunity = await OffCampusOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check permissions - recruiter can only update their own opportunities
    if (req.user.role === 'recruiter' && opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own opportunities.'
      });
    }

    // Update opportunity
    const updatedOpportunity = await OffCampusOpportunity.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Opportunity updated successfully',
      data: { opportunity: updatedOpportunity }
    });
  } catch (error) {
    console.error('Update off-campus opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating opportunity'
    });
  }
});

// @route   DELETE /api/off-campus-opportunities/:id
// @desc    Delete off-campus opportunity (admin/recruiter only)
// @access  Private (Admin, Recruiter)
router.delete('/:id', protect, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await OffCampusOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check permissions - recruiter can only delete their own opportunities
    if (req.user.role === 'recruiter' && opportunity.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own opportunities.'
      });
    }

    await OffCampusOpportunity.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete off-campus opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting opportunity'
    });
  }
});

// @route   POST /api/off-campus-opportunities/:id/track-application
// @desc    Track application click for opportunity (student only)
// @access  Private (Student only)
router.post('/:id/track-application', protect, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await OffCampusOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    if (!opportunity.isActive || new Date() > opportunity.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Opportunity is no longer active'
      });
    }

    // Increment application count
    await opportunity.incrementApplications();

    res.json({
      success: true,
      message: 'Application tracked successfully',
      data: {
        applicationLink: opportunity.applicationLink
      }
    });
  } catch (error) {
    console.error('Track application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking application'
    });
  }
});

// @route   GET /api/off-campus-opportunities/search
// @desc    Search off-campus opportunities
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: query, type, location, skills, experience } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build filters
    const filters = {};
    if (type) filters.type = type;
    if (location) filters.location = location;
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      filters.skills = { $in: skillArray };
    }
    if (experience) filters.experience = experience;

    const opportunities = await OffCampusOpportunity.searchOpportunities(query, filters);

    res.json({
      success: true,
      data: { opportunities }
    });
  } catch (error) {
    console.error('Search opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching opportunities'
    });
  }
});

// @route   GET /api/off-campus-opportunities/by-skills
// @desc    Get opportunities by skills
// @access  Public
router.get('/by-skills', async (req, res) => {
  try {
    const { skills } = req.query;

    if (!skills) {
      return res.status(400).json({
        success: false,
        message: 'Skills parameter is required'
      });
    }

    const skillArray = Array.isArray(skills) ? skills : skills.split(',');

    const opportunities = await OffCampusOpportunity.getBySkills(skillArray);

    res.json({
      success: true,
      data: { opportunities }
    });
  } catch (error) {
    console.error('Get opportunities by skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching opportunities by skills'
    });
  }
});

// @route   GET /api/off-campus-opportunities/my-opportunities
// @desc    Get opportunities created by the user (admin/recruiter only)
// @access  Private (Admin, Recruiter)
router.get('/my-opportunities', protect, authorize('admin', 'recruiter'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Build query
    let query = { createdBy: req.user._id };

    if (status === 'active') {
      query.isActive = true;
      query.applicationDeadline = { $gte: new Date() };
    } else if (status === 'expired') {
      query.applicationDeadline = { $lt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const opportunities = await OffCampusOpportunity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OffCampusOpportunity.countDocuments(query);

    res.json({
      success: true,
      data: {
        opportunities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your opportunities'
    });
  }
});

module.exports = router;