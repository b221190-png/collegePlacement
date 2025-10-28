const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const OffCampusOpportunity = require('../models/OffCampusOpportunity');
const ApplicationWindow = require('../models/ApplicationWindow');
const RecruitmentRound = require('../models/RecruitmentRound');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      totalStudents,
      totalCompanies,
      totalApplications,
      activeCompanies,
      placedStudents,
      totalOffCampusOpportunities
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Student.countDocuments(),
      Company.countDocuments(),
      Application.countDocuments(),
      Company.countDocuments({ status: 'active' }),
      Student.countDocuments({ placed: true }),
      OffCampusOpportunity.countDocuments({ isActive: true })
    ]);

    // Get application statistics
    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user statistics by role
    const userStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent applications
    const recentApplications = await Application.find()
      .populate('studentId', 'rollNumber')
      .populate('userId', 'name')
      .populate('companyId', 'name')
      .sort({ submittedAt: -1 })
      .limit(10);

    // Get active application windows
    const activeWindows = await ApplicationWindow.getActiveWindows();

    // Get upcoming recruitment rounds
    const upcomingRounds = await RecruitmentRound.getUpcomingRounds(7);

    // Get top companies by applications
    const topCompanies = await Application.aggregate([
      {
        $group: {
          _id: '$companyId',
          applicationCount: { $sum: 1 }
        }
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' }
    ]);

    // Format statistics
    const stats = {
      overview: {
        totalUsers,
        totalStudents,
        totalCompanies,
        totalApplications,
        activeCompanies,
        placedStudents,
        placementRate: totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0,
        totalOffCampusOpportunities
      },
      applications: {
        total: totalApplications,
        byStatus: applicationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      users: {
        total: totalUsers,
        byRole: userStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      recent: {
        applications: recentApplications,
        activeWindows: activeWindows.length,
        upcomingRounds: upcomingRounds.length
      },
      topCompanies
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin dashboard'
    });
  }
});

// @route   GET /api/dashboard/recruiter/:companyId
// @desc    Get recruiter dashboard statistics
// @access  Private (Admin or Company Recruiter)
router.get('/recruiter/:companyId', protect, [
  query('companyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID')
], async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check permissions
    if (req.user.role === 'recruiter') {
      if (!req.user.companyId || req.user.companyId.toString() !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your company dashboard.'
        });
      }
    }

    // Get company details
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get application statistics for this company
    const applicationStats = await Application.getDashboardStats(companyId);

    // Get recent applications for this company
    const recentApplications = await Application.getByCompany({ companyId })
      .populate('studentId', 'rollNumber branch cgpa phone')
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 })
      .limit(10);

    // Get recruitment rounds for this company
    const recruitmentRounds = await RecruitmentRound.find({ companyId })
      .sort({ roundNumber: 1 });

    // Get application window if exists
    const applicationWindow = await ApplicationWindow.findOne({
      companyId,
      isActive: true
    });

    // Get applications by round
    const applicationsByRound = await Promise.all(
      recruitmentRounds.map(async (round) => {
        const count = await Application.countDocuments({
          companyId,
          roundId: round._id
        });
        return {
          roundId: round._id,
          roundName: round.name,
          roundNumber: round.roundNumber,
          status: round.status,
          applicationCount: count
        };
      })
    );

    // Get daily application trends for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await Application.aggregate([
      {
        $match: {
          companyId: company._id,
          submittedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Format statistics
    const stats = {
      company: {
        id: company._id,
        name: company.name,
        logoUrl: company.logoUrl,
        totalPositions: company.totalPositions,
        applicationDeadline: company.applicationDeadline,
        status: company.status
      },
      applications: applicationStats,
      recentApplications,
      recruitment: {
        rounds: recruitmentRounds,
        applicationsByRound,
        activeWindow: applicationWindow
      },
      trends: {
        dailyApplications: dailyTrends
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get recruiter dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recruiter dashboard'
    });
  }
});

// @route   GET /api/dashboard/student/:studentId
// @desc    Get student dashboard statistics
// @access  Private (Admin or Student themselves)
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student profile
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      const userStudent = await Student.findOne({ userId: req.user._id });
      if (!userStudent || userStudent._id.toString() !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own dashboard.'
        });
      }
    }

    // Get student's applications
    const applications = await student.getApplications();

    // Get application statistics
    const applicationStats = {
      total: applications.length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      underReview: applications.filter(app => app.status === 'under-review').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      selected: applications.filter(app => app.status === 'selected').length
    };

    // Get active companies (available for application)
    const activeCompanies = await Company.getActiveCompanies();

    // Check eligibility for active companies
    const eligibleCompanies = await Promise.all(
      activeCompanies.map(async (company) => {
        const eligibility = await student.checkEligibility(company._id);
        return {
          company: {
            id: company._id,
            name: company.name,
            logoUrl: company.logoUrl,
            packageOffered: company.packageOffered,
            applicationDeadline: company.applicationDeadline
          },
          eligible: eligibility.eligible,
          reason: eligibility.reason
        };
      })
    );

    // Get off-campus opportunities
    const offCampusOpportunities = await OffCampusOpportunity.getFeaturedOpportunities(5);

    // Get upcoming application windows
    const upcomingWindows = await ApplicationWindow.getUpcomingWindows(5);

    // Get student's profile completion
    const profileCompletion = {
      basicInfo: !!(student.rollNumber && student.branch && student.cgpa && student.phone && student.batch),
      resume: !!student.resumeUrl,
      skills: !!(student.skills && student.skills.length > 0)
    };

    const completionPercentage = Object.values(profileCompletion).filter(Boolean).length * 33.33;

    // Format statistics
    const stats = {
      student: {
        id: student._id,
        name: student.userId.name,
        email: student.userId.email,
        rollNumber: student.rollNumber,
        branch: student.branch,
        cgpa: student.cgpa,
        batch: student.batch,
        placed: student.placed,
        placedCompany: student.placedCompany,
        profileCompletion: {
          ...profileCompletion,
          percentage: Math.round(completionPercentage)
        }
      },
      applications: applicationStats,
      recentApplications: applications.slice(0, 5),
      opportunities: {
        eligibleCompanies: eligibleCompanies.filter(Eligible => eligible.eligible),
        totalActiveCompanies: activeCompanies.length,
        offCampusOpportunities,
        upcomingWindows
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student dashboard'
    });
  }
});

// @route   GET /api/dashboard/analytics/overall
// @desc    Get overall analytics (admin only)
// @access  Private (Admin only)
router.get('/analytics/overall', protect, authorize('admin'), [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year')
], async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Get application trends
    const applicationTrends = await Application.aggregate([
      {
        $match: {
          submittedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'week' ? '%Y-%m-%d' :
                     period === 'month' ? '%Y-%m-%d' :
                     period === 'quarter' ? '%Y-%m' : '%Y',
              date: '$submittedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get placement statistics
    const placementStats = await Student.aggregate([
      {
        $group: {
          _id: '$branch',
          total: { $sum: 1 },
          placed: { $sum: { $cond: ['$placed', 1, 0] } },
          avgCGPA: { $avg: '$cgpa' }
        }
      },
      {
        $addFields: {
          placementRate: { $multiply: [{ $divide: ['$placed', '$total'] }, 100] }
        }
      },
      { $sort: { placementRate: -1 } }
    ]);

    // Get company performance
    const companyPerformance = await Application.aggregate([
      {
        $group: {
          _id: '$companyId',
          totalApplications: { $sum: 1 },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } },
          avgScore: { $avg: '$score' }
        }
      },
      {
        $addFields: {
          selectionRate: { $multiply: [{ $divide: ['$selected', '$totalApplications'] }, 100] }
        }
      },
      { $sort: { selected: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' }
    ]);

    // Get skill demand analysis
    const skillDemand = await Company.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 },
          companies: { $addToSet: '$name' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Format analytics
    const analytics = {
      period,
      dateRange: {
        start: startDate,
        end: now
      },
      trends: {
        applications: applicationTrends
      },
      placements: {
        byBranch: placementStats
      },
      companies: {
        performance: companyPerformance
      },
      skills: {
        demand: skillDemand
      }
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Get overall analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;