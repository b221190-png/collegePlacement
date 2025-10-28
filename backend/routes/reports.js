const express = require('express');
const { query, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/applications
// @desc    Generate application report (admin only)
// @access  Private (Admin only)
router.get('/applications', protect, authorize('admin'), [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('status')
    .optional()
    .isIn(['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'])
    .withMessage('Invalid status'),
  query('companyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
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
      format = 'json',
      status,
      companyId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 100
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (companyId) query.companyId = companyId;
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }

    // Get applications with populated data
    const applications = await Application.find(query)
      .populate('studentId', 'rollNumber branch cgpa phone')
      .populate('userId', 'name email')
      .populate('companyId', 'name logoUrl')
      .populate('roundId', 'name roundNumber')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit));

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Application ID,Student Name,Student Email,Company Name,Roll Number,Branch,CGPA,Status,Score,Submitted Date,Reviewed Date\n';
      const csvData = applications.map(app => {
        const student = app.studentId || {};
        const user = app.userId || {};
        const company = app.companyId || {};
        return `${app._id},${user.name || ''},${user.email || ''},${company.name || ''},${student.rollNumber || ''},${student.branch || ''},${student.cgpa || ''},${app.status},${app.score || ''},${app.submittedAt},${app.reviewedAt || ''}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=applications_report.csv');
      return res.send(csvHeader + csvData);
    }

    // Return JSON format
    res.json({
      success: true,
      data: {
        applications,
        total: applications.length,
        filters: { status, companyId, dateFrom, dateTo }
      }
    });
  } catch (error) {
    console.error('Generate application report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating application report'
    });
  }
});

// @route   GET /api/reports/students
// @desc    Generate student report (admin only)
// @access  Private (Admin only)
router.get('/students', protect, authorize('admin'), [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  query('branch')
    .optional()
    .isIn(['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Other'])
    .withMessage('Invalid branch'),
  query('placed')
    .optional()
    .isBoolean()
    .withMessage('Placed must be boolean'),
  query('batch')
    .optional()
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Invalid batch year')
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
      format = 'json',
      branch,
      placed,
      batch,
      page = 1,
      limit = 100
    } = req.query;

    // Build query
    const query = {};
    if (branch) query.branch = branch;
    if (placed !== undefined) query.placed = placed === 'true';
    if (batch) query.batch = parseInt(batch);

    // Get students with populated data
    const students = await Student.find(query)
      .populate('userId', 'name email isActive lastLogin')
      .populate('placedCompany', 'name logoUrl')
      .sort({ rollNumber: 1 })
      .limit(parseInt(limit));

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Student ID,Name,Email,Roll Number,Branch,CGPA,Phone,Batch,Skills,Placed,Placed Company,Resume,Last Login\n';
      const csvData = students.map(student => {
        const user = student.userId || {};
        const placedCompany = student.placedCompany || {};
        return `${student._id},${user.name || ''},${user.email || ''},${student.rollNumber},${student.branch},${student.cgpa},${student.phone},${student.batch},${student.skills ? student.skills.join(';') : ''},${student.placed},${placedCompany.name || ''},${student.resumeUrl || ''},${user.lastLogin || ''}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students_report.csv');
      return res.send(csvHeader + csvData);
    }

    res.json({
      success: true,
      data: {
        students,
        total: students.length,
        filters: { branch, placed, batch }
      }
    });
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating student report'
    });
  }
});

// @route   GET /api/reports/placements
// @desc    Generate placement statistics report (admin only)
// @access  Private (Admin only)
router.get('/placements', protect, authorize('admin'), [
  query('batch')
    .optional()
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Invalid batch year'),
  query('branch')
    .optional()
    .isIn(['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Other'])
    .withMessage('Invalid branch')
], async (req, res) => {
  try {
    const { batch, branch } = req.query;

    // Build query
    const query = {};
    if (batch) query.batch = parseInt(batch);
    if (branch) query.branch = branch;

    // Get placement statistics
    const placementStats = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            branch: '$branch',
            batch: '$batch'
          },
          totalStudents: { $sum: 1 },
          placedStudents: { $sum: { $cond: ['$placed', 1, 0] } },
          avgCGPA: { $avg: '$cgpa' },
          avgPackage: { $avg: { $cond: ['$package', { $toDouble: { $arrayElemAt: [{ $split: ['$package', ' '] }, 0] } }, 0] } }
        }
      },
      {
        $addFields: {
          placementRate: { $multiply: [{ $divide: ['$placedStudents', '$totalStudents'] }, 100] }
        }
      },
      { $sort: { '_id.batch': -1, placementRate: -1 } }
    ]);

    // Get company-wise placement data
    const companyStats = await Student.aggregate([
      { $match: { placed: true, ...(batch && { batch: parseInt(batch) }), ...(branch && { branch }) } },
      {
        $group: {
          _id: '$placedCompany',
          count: { $sum: 1 },
          avgCGPA: { $avg: '$cgpa' },
          branches: { $addToSet: '$branch' }
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' },
      { $sort: { count: -1 } }
    ]);

    // Overall statistics
    const overallStats = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          placedStudents: { $sum: { $cond: ['$placed', 1, 0] } },
          avgCGPA: { $avg: '$cgpa' },
          totalCompanies: { $addToSet: '$placedCompany' }
        }
      },
      {
        $addFields: {
          placementRate: { $multiply: [{ $divide: ['$placedStudents', '$totalStudents'] }, 100] },
          uniqueCompanies: { $size: '$totalCompanies' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        placementStats,
        companyStats,
        overallStats: overallStats[0] || {},
        filters: { batch, branch }
      }
    });
  } catch (error) {
    console.error('Generate placement report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating placement report'
    });
  }
});

// @route   GET /api/reports/company-performance
// @desc    Generate company performance report (admin only)
// @access  Private (Admin only)
router.get('/company-performance', protect, authorize('admin'), [
  query('companyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
], async (req, res) => {
  try {
    const { companyId, dateFrom, dateTo } = req.query;

    // Build query
    const query = {};
    if (companyId) query._id = companyId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Get companies with their performance metrics
    const companies = await Company.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const performanceData = await Promise.all(
      companies.map(async (company) => {
        // Get application statistics for this company
        const appStats = await Application.aggregate([
          { $match: { companyId: company._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              avgScore: { $avg: '$score' }
            }
          }
        ]);

        // Get placed students for this company
        const placedStudents = await Student.find({
          placedCompany: company._id
        }).populate('userId', 'name email');

        // Format statistics
        const stats = {
          totalApplications: 0,
          submitted: 0,
          'under-review': 0,
          shortlisted: 0,
          rejected: 0,
          selected: 0,
          avgScore: 0
        };

        appStats.forEach(stat => {
          stats[stat._id] = stat.count;
          stats.totalApplications += stat.count;
          if (stat.avgScore) {
            stats.avgScore = stat.avgScore;
          }
        });

        return {
          company: {
            id: company._id,
            name: company.name,
            industry: company.industry,
            location: company.location,
            packageOffered: company.packageOffered,
            totalPositions: company.totalPositions,
            status: company.status,
            createdAt: company.createdAt
          },
          statistics: stats,
          placedStudents: placedStudents.length,
          placedStudentDetails: placedStudents,
          conversionRate: stats.totalApplications > 0 ?
            ((stats.selected / stats.totalApplications) * 100).toFixed(2) : 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        companyPerformance: performanceData,
        totalCompanies: companies.length,
        filters: { companyId, dateFrom, dateTo }
      }
    });
  } catch (error) {
    console.error('Generate company performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating company performance report'
    });
  }
});

module.exports = router;