const express = require('express');
const { query, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Application = require('../models/Application');
const ApplicationReviewHistory = require('../models/ApplicationReviewHistory');

const router = express.Router();

// @route   GET /api/applications/:id/history
// @desc    Get application review history
// @access  Private (Admin, Recruiter, or own application for student)
router.get('/:id/history', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the application first
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    let hasAccess = false;
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'recruiter') {
      // Check if recruiter can access this company's applications
      hasAccess = req.user.companyId && req.user.companyId.toString() === application.companyId.toString();
    } else if (req.user.role === 'student') {
      // Check if student owns this application
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });
      hasAccess = student && student._id.toString() === application.studentId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get review history
    const history = await ApplicationReviewHistory.getByApplication(id);

    res.json({
      success: true,
      data: {
        applicationId: id,
        history,
        totalReviews: history.length
      }
    });
  } catch (error) {
    console.error('Get application review history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application review history'
    });
  }
});

// @route   GET /api/applications/review/history
// @desc    Get review history for all applications (admin/recruiter only)
// @access  Private (Admin, Recruiter)
router.get('/review/history', protect, authorize('admin', 'recruiter'), [
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
  query('reviewerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid reviewer ID')
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      companyId,
      reviewerId,
      dateFrom,
      dateTo
    } = req.query;

    // Build query
    let query = {};

    // If recruiter, only show their company's reviews
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

    if (reviewerId) {
      query.reviewerId = reviewerId;
    }

    if (dateFrom || dateTo) {
      query.reviewedAt = {};
      if (dateFrom) query.reviewedAt.$gte = new Date(dateFrom);
      if (dateTo) query.reviewedAt.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get review history
    const history = await ApplicationReviewHistory.find(query)
      .populate('applicationId', 'studentId companyId status score')
      .populate('reviewerId', 'name email role')
      .populate({
        path: 'applicationId',
        populate: {
          path: 'studentId',
          select: 'rollNumber branch cgpa'
        }
      })
      .populate({
        path: 'applicationId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .sort({ reviewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ApplicationReviewHistory.countDocuments(query);

    // Group by action type
    const actionStats = await ApplicationReviewHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$reviewType',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = actionStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: {
          totalReviews: total,
          statusChanges: stats['status_change'] || 0,
          scoreUpdates: stats['score_update'] || 0,
          bothActions: stats['both'] || 0
        },
        filters: { companyId, reviewerId, dateFrom, dateTo }
      }
    });
  } catch (error) {
    console.error('Get review history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review history'
    });
  }
});

// @route   GET /api/applications/review/my-activity
// @desc    Get current user's review activity
// @access  Private (Admin, Recruiter)
router.get('/review/my-activity', protect, authorize('admin', 'recruiter'), [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const query = {
      reviewerId: req.user._id,
      reviewedAt: { $gte: cutoffDate }
    };

    // Get reviewer's activity
    const activity = await ApplicationReviewHistory.find(query)
      .populate('applicationId', 'status score')
      .populate({
        path: 'applicationId',
        populate: {
          path: 'studentId',
          select: 'rollNumber branch cgpa'
        }
      })
      .populate({
        path: 'applicationId',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .sort({ reviewedAt: -1 })
      .limit(50);

    // Get daily activity stats
    const dailyStats = await ApplicationReviewHistory.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reviewedAt' } },
          reviews: { $sum: 1 },
          statusChanges: { $sum: { $cond: [{ $ne: ['$oldStatus', '$newStatus'] }, 1, 0] } },
          scoreUpdates: { $sum: { $cond: [{ $ne: ['$oldScore', '$newScore'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get summary statistics
    const summary = await ApplicationReviewHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgScoreGiven: { $avg: '$newScore' },
          uniqueApplications: { $addToSet: '$applicationId' }
        }
      }
    ]);

    const stats = summary[0] || { totalReviews: 0, avgScoreGiven: 0, uniqueApplications: [] };

    res.json({
      success: true,
      data: {
        activity,
        statistics: {
          totalReviews: stats.totalReviews,
          uniqueApplications: stats.uniqueApplications.length,
          avgScoreGiven: Math.round(stats.avgScoreGiven * 100) / 100,
          dailyActivity: dailyStats
        },
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get reviewer activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviewer activity'
    });
  }
});

module.exports = router;