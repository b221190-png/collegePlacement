const express = require('express');
const { query, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const OffCampusOpportunity = require('../models/OffCampusOpportunity');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search/global
// @desc    Global search across all entities
// @access  Public (with optional auth for enhanced results)
router.get('/global', optionalAuth, [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('type')
    .optional()
    .isIn(['all', 'students', 'companies', 'opportunities', 'applications'])
    .withMessage('Invalid search type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
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
      q: searchTerm,
      type = 'all',
      limit = 20,
      branch,
      batch,
      industry
    } = req.query;

    const results = {
      query: searchTerm,
      filters: { type, branch, batch, industry },
      results: {}
    };

    // Search students (only if admin or searching for all/students)
    if (type === 'all' || type === 'students') {
      if (req.user && req.user.role === 'admin') {
        const studentQuery = {
          $or: [
            { 'userId.name': { $regex: searchTerm, $options: 'i' } },
            { 'userId.email': { $regex: searchTerm, $options: 'i' } },
            { rollNumber: { $regex: searchTerm, $options: 'i' } },
            { skills: { $in: [new RegExp(searchTerm, 'i')] } }
          ]
        };

        if (branch) studentQuery.branch = branch;
        if (batch) studentQuery.batch = parseInt(batch);

        const students = await Student.find(studentQuery)
          .populate('userId', 'name email isActive')
          .populate('placedCompany', 'name logoUrl')
          .limit(limit)
          .sort({ 'userId.name': 1 });

        results.results.students = students.map(student => ({
          id: student._id,
          name: student.userId?.name,
          email: student.userId?.email,
          rollNumber: student.rollNumber,
          branch: student.branch,
          cgpa: student.cgpa,
          batch: student.batch,
          placed: student.placed,
          placedCompany: student.placedCompany,
          skills: student.skills,
          type: 'student'
        }));
      }
    }

    // Search companies
    if (type === 'all' || type === 'companies') {
      const companyQuery = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { location: { $regex: searchTerm, $options: 'i' } },
          { industry: { $regex: searchTerm, $options: 'i' } },
          { skills: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      };

      if (industry) companyQuery.industry = industry;

      const companies = await Company.find(companyQuery)
        .populate('createdBy', 'name')
        .limit(limit)
        .sort({ name: 1 });

      results.results.companies = companies.map(company => ({
        id: company._id,
        name: company.name,
        description: company.description.substring(0, 200) + '...',
        industry: company.industry,
        location: company.location,
        packageOffered: company.packageOffered,
        totalPositions: company.totalPositions,
        status: company.status,
        logoUrl: company.logoUrl,
        type: 'company'
      }));
    }

    // Search off-campus opportunities
    if (type === 'all' || type === 'opportunities') {
      const opportunityQuery = {
        isActive: true,
        applicationDeadline: { $gte: new Date() },
        $text: { $search: searchTerm }
      };

      const opportunities = await OffCampusOpportunity.find(opportunityQuery)
        .populate('createdBy', 'name')
        .limit(limit)
        .sort({ postedDate: -1 });

      results.results.opportunities = opportunities.map(opp => ({
        id: opp._id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        location: opp.location,
        industry: opp.industry,
        experience: opp.experience,
        applicationDeadline: opp.applicationDeadline,
        skills: opp.skills,
        type: 'opportunity'
      }));
    }

    // Search applications (only if admin or recruiter)
    if ((type === 'all' || type === 'applications') &&
        req.user && ['admin', 'recruiter'].includes(req.user.role)) {
      const applicationQuery = {
        $or: [
          { 'studentId.userId.name': { $regex: searchTerm, $options: 'i' } },
          { 'studentId.rollNumber': { $regex: searchTerm, $options: 'i' } },
          { 'companyId.name': { $regex: searchTerm, $options: 'i' } },
          { recruiterNotes: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // If recruiter, only show their company's applications
      if (req.user.role === 'recruiter' && req.user.companyId) {
        applicationQuery.companyId = req.user.companyId;
      }

      const applications = await Application.find(applicationQuery)
        .populate('studentId', 'rollNumber branch cgpa')
        .populate('userId', 'name email')
        .populate('companyId', 'name')
        .limit(limit)
        .sort({ submittedAt: -1 });

      results.results.applications = applications.map(app => ({
        id: app._id,
        studentName: app.userId?.name,
        studentRollNumber: app.studentId?.rollNumber,
        studentBranch: app.studentId?.branch,
        studentCGPA: app.studentId?.cgpa,
        companyName: app.companyId?.name,
        status: app.status,
        score: app.score,
        submittedAt: app.submittedAt,
        type: 'application'
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results.results).reduce(
      (total, category) => total + category.length, 0
    );

    results.totalResults = totalResults;
    results.searchTime = new Date().toISOString();

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during global search'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions based on partial input
// @access  Public
router.get('/suggestions', [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
  query('type')
    .optional()
    .isIn(['companies', 'skills', 'locations', 'branches'])
    .withMessage('Invalid suggestion type')
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

    const { q: searchTerm, type = 'companies', limit = 10 } = req.query;
    const suggestions = [];

    switch (type) {
      case 'companies':
        const companies = await Company.find({
          name: { $regex: searchTerm, $options: 'i' },
          status: 'active'
        })
          .select('name logoUrl')
          .limit(limit)
          .sort({ name: 1 });

        companies.forEach(company => {
          suggestions.push({
            text: company.name,
            type: 'company',
            logoUrl: company.logoUrl,
            id: company._id
          });
        });
        break;

      case 'skills':
        // Get unique skills from students and companies
        const studentSkills = await Student.distinct('skills', {
          skills: { $regex: searchTerm, $options: 'i' }
        });

        const companySkills = await Company.distinct('skills', {
          skills: { $regex: searchTerm, $options: 'i' }
        });

        const allSkills = [...new Set([...studentSkills, ...companySkills])]
          .filter(skill => skill && skill.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, limit);

        allSkills.forEach(skill => {
          suggestions.push({
            text: skill,
            type: 'skill'
          });
        });
        break;

      case 'locations':
        const locations = await Company.distinct('location', {
          location: { $regex: searchTerm, $options: 'i' }
        }).limit(limit);

        locations.forEach(location => {
          suggestions.push({
            text: location,
            type: 'location'
          });
        });
        break;

      case 'branches':
        const branches = [
          'Computer Science',
          'Information Technology',
          'Electronics and Communication',
          'Electrical Engineering',
          'Mechanical Engineering',
          'Civil Engineering',
          'Chemical Engineering',
          'Biotechnology'
        ].filter(branch =>
          branch.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, limit);

        branches.forEach(branch => {
          suggestions.push({
            text: branch,
            type: 'branch'
          });
        });
        break;
    }

    res.json({
      success: true,
      data: {
        suggestions,
        query: searchTerm,
        type
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting search suggestions'
    });
  }
});

// @route   GET /api/search/advanced
// @desc    Advanced search with multiple filters
// @access  Private
router.get('/advanced', protect, [
  query('category')
    .optional()
    .isIn(['students', 'companies', 'applications', 'opportunities'])
    .withMessage('Invalid category'),
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
      category = 'companies',
      q: searchTerm,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let results = [];
    let total = 0;

    // Build advanced search based on category
    switch (category) {
      case 'students':
        // Only admins can search students
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        const studentQuery = {};
        if (searchTerm) {
          studentQuery.$or = [
            { 'userId.name': { $regex: searchTerm, $options: 'i' } },
            { 'userId.email': { $regex: searchTerm, $options: 'i' } },
            { rollNumber: { $regex: searchTerm, $options: 'i' } }
          ];
        }

        // Add filters from query params
        Object.keys(req.query).forEach(key => {
          if (!['category', 'q', 'page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
            studentQuery[key] = req.query[key];
          }
        });

        const students = await Student.find(studentQuery)
          .populate('userId', 'name email isActive')
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(parseInt(limit));

        total = await Student.countDocuments(studentQuery);

        results = students.map(student => ({
          id: student._id,
          name: student.userId?.name,
          email: student.userId?.email,
          rollNumber: student.rollNumber,
          branch: student.branch,
          cgpa: student.cgpa,
          batch: student.batch,
          placed: student.placed,
          isActive: student.userId?.isActive
        }));
        break;

      case 'companies':
        const companyQuery = {};
        if (searchTerm) {
          companyQuery.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { location: { $regex: searchTerm, $options: 'i' } }
          ];
        }

        const companies = await Company.find(companyQuery)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(parseInt(limit));

        total = await Company.countDocuments(companyQuery);

        results = companies.map(company => ({
          id: company._id,
          name: company.name,
          description: company.description,
          industry: company.industry,
          location: company.location,
          packageOffered: company.packageOffered,
          totalPositions: company.totalPositions,
          status: company.status
        }));
        break;

      // Add more cases for applications and opportunities as needed
    }

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { category, q: searchTerm, sortBy, sortOrder }
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during advanced search'
    });
  }
});

module.exports = router;