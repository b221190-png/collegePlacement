const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Round = require('../models/Round');

/**
 * @swagger
 * components:
 *   schemas:
 *     RecruiterAnalytics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalApplications:
 *               type: integer
 *             newApplications:
 *               type: integer
 *             shortlistedCandidates:
 *               type: integer
 *             selectedCandidates:
 *               type: integer
 *             activeRecruitments:
 *               type: integer
 *             conversionRate:
 *               type: number
 *         applicationTrends:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               count:
 *                 type: integer
 *         statusBreakdown:
 *           type: object
 *           properties:
 *             pending:
 *               type: integer
 *             shortlisted:
 *               type: integer
 *             in_progress:
 *               type: integer
 *             selected:
 *               type: integer
 *             rejected:
 *               type: integer
 *         branchWiseStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               branch:
 *                 type: string
 *               applications:
 *                 type: integer
 *               shortlisted:
 *                 type: integer
 *               selected:
 *                 type: integer
 *               conversionRate:
 *                 type: number
 *         recentApplications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               student:
 *                 type: object
 *               appliedAt:
 *                 type: string
 *               status:
 *                 type: string
 */

/**
 * @swagger
 * /api/recruiter/analytics/dashboard:
 *   get:
 *     summary: Get recruiter dashboard analytics
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Company ID (if not provided, uses all companies associated with recruiter)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Recruiter analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RecruiterAnalytics'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/analytics/dashboard', auth.protect, async (req, res) => {
  try {
    const { companyId, period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get companies associated with recruiter
    let companies;
    if (companyId) {
      // Verify recruiter has access to this company
      const company = await Company.findOne({ _id: companyId, userId: req.user.id });
      if (!company) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or company not found'
        });
      }
      companies = [company];
    } else {
      companies = await Company.find({ userId: req.user.id });
    }

    if (companies.length === 0) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalApplications: 0,
            newApplications: 0,
            shortlistedCandidates: 0,
            selectedCandidates: 0,
            activeRecruitments: 0,
            conversionRate: 0
          },
          applicationTrends: [],
          statusBreakdown: {},
          branchWiseStats: [],
          recentApplications: [],
          companies: []
        }
      });
    }

    const companyIds = companies.map(c => c._id);

    // Get all applications for these companies
    const applicationQuery = { companyId: { $in: companyIds } };
    const allApplications = await Application.find(applicationQuery)
      .populate('studentId', 'name rollNumber branch batch cgpa email')
      .populate('companyId', 'name')
      .sort({ appliedAt: -1 });

    // Get applications in the specified period
    const periodApplications = allApplications.filter(
      app => new Date(app.appliedAt) >= startDate
    );

    // Calculate overview statistics
    const totalApplications = allApplications.length;
    const newApplications = periodApplications.length;
    const shortlistedCandidates = allApplications.filter(app => app.status === 'shortlisted').length;
    const selectedCandidates = allApplications.filter(app => app.status === 'selected').length;
    const conversionRate = totalApplications > 0 ? ((selectedCandidates / totalApplications) * 100).toFixed(2) : '0.00';

    // Get active recruitment windows
    const ApplicationWindow = require('../models/ApplicationWindow');
    const activeRecruitments = await ApplicationWindow.countDocuments({
      companyId: { $in: companyIds },
      status: 'active',
      endDate: { $gte: now }
    });

    // Calculate status breakdown
    const statusBreakdown = {
      pending: allApplications.filter(app => app.status === 'pending').length,
      shortlisted: shortlistedCandidates,
      in_progress: allApplications.filter(app => app.status === 'in_progress').length,
      selected: selectedCandidates,
      rejected: allApplications.filter(app => app.status === 'rejected').length
    };

    // Calculate application trends (last 14 days)
    const trendsData = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.setHours(0, 0, 0, 0));
      const dateEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayApplications = allApplications.filter(app => {
        const appDate = new Date(app.appliedAt);
        return appDate >= dateStart && appDate <= dateEnd;
      });

      trendsData.push({
        date: dateStart.toISOString().split('T')[0],
        count: dayApplications.length
      });
    }

    // Calculate branch-wise statistics
    const branchStats = {};
    allApplications.forEach(app => {
      if (app.studentId && app.studentId.branch) {
        const branch = app.studentId.branch;
        if (!branchStats[branch]) {
          branchStats[branch] = {
            branch,
            applications: 0,
            shortlisted: 0,
            selected: 0
          };
        }
        branchStats[branch].applications++;
        if (app.status === 'shortlisted') branchStats[branch].shortlisted++;
        if (app.status === 'selected') branchStats[branch].selected++;
      }
    });

    const branchWiseStats = Object.values(branchStats).map(stat => ({
      ...stat,
      conversionRate: stat.applications > 0 ? ((stat.selected / stat.applications) * 100).toFixed(2) : '0.00'
    }));

    // Get recent applications (last 10)
    const recentApplications = allApplications.slice(0, 10).map(app => ({
      id: app._id,
      student: {
        id: app.studentId?._id,
        name: app.studentId?.name || 'N/A',
        rollNumber: app.studentId?.rollNumber || 'N/A',
        branch: app.studentId?.branch || 'N/A',
        cgpa: app.studentId?.cgpa || 'N/A'
      },
      company: {
        id: app.companyId?._id,
        name: app.companyId?.name || 'N/A'
      },
      appliedAt: app.appliedAt,
      status: app.status,
      score: app.score
    }));

    // Get rounds information
    const rounds = await Round.find({ companyId: { $in: companyIds }, isActive: true })
      .sort({ sequence: 1 });

    res.json({
      success: true,
      data: {
        overview: {
          totalApplications,
          newApplications,
          shortlistedCandidates,
          selectedCandidates,
          activeRecruitments,
          conversionRate: parseFloat(conversionRate)
        },
        applicationTrends: trendsData,
        statusBreakdown,
        branchWiseStats,
        recentApplications,
        companies: companies.map(c => ({
          id: c._id,
          name: c.name,
          industry: c.industry,
          location: c.location,
          status: c.status
        })),
        activeRounds: rounds.map(r => ({
          id: r._id,
          name: r.name,
          type: r.type,
          sequence: r.sequence,
          scheduledDate: r.scheduledDate
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching recruiter analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/recruiter/companies:
 *   get:
 *     summary: Get companies associated with recruiter
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *       500:
 *         description: Server error
 */
router.get('/companies', auth.protect, async (req, res) => {
  try {
    const companies = await Company.find({ userId: req.user.id })
      .sort({ name: 1 });

    // Get application statistics for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const applicationStats = await Application.aggregate([
          { $match: { companyId: company._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = {
          totalApplications: 0,
          selected: 0,
          shortlisted: 0,
          rejected: 0,
          pending: 0,
          in_progress: 0
        };

        applicationStats.forEach(stat => {
          stats.totalApplications += stat.count;
          if (stat._id === 'selected') stats.selected = stat.count;
          if (stat._id === 'shortlisted') stats.shortlisted = stat.count;
          if (stat._id === 'rejected') stats.rejected = stat.count;
          if (stat._id === 'pending') stats.pending = stat.count;
          if (stat._id === 'in_progress') stats.in_progress = stat.count;
        });

        return {
          ...company.toObject(),
          stats
        };
      })
    );

    res.json({
      success: true,
      data: companiesWithStats
    });

  } catch (error) {
    console.error('Error fetching recruiter companies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/recruiter/applications:
 *   get:
 *     summary: Get applications for recruiter's companies
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, shortlisted, in_progress, selected, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         description: Filter by student branch
 *       - in: query
 *         name: minCGPA
 *         schema:
 *           type: number
 *         description: Minimum CGPA filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: List of applications
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/applications', auth.protect, async (req, res) => {
  try {
    const {
      companyId,
      status,
      branch,
      minCGPA,
      page = 1,
      limit = 20
    } = req.query;

    // Build company filter
    let companyFilter = {};
    if (companyId) {
      // Verify access
      const company = await Company.findOne({ _id: companyId, userId: req.user.id });
      if (!company) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or company not found'
        });
      }
      companyFilter = { companyId };
    } else {
      const companies = await Company.find({ userId: req.user.id });
      companyFilter = { companyId: { $in: companies.map(c => c._id) } };
    }

    // Build application query
    const query = { ...companyFilter };
    if (status) query.status = status;

    // Get applications with populated data
    const applications = await Application.find(query)
      .populate('studentId', 'name rollNumber email branch batch cgpa backlogs phoneNumber personalEmail resumeLink')
      .populate('companyId', 'name location industry')
      .sort({ appliedAt: -1 });

    // Apply additional filters
    let filteredApplications = applications;
    if (branch) {
      filteredApplications = filteredApplications.filter(app =>
        app.studentId && app.studentId.branch === branch
      );
    }
    if (minCGPA) {
      filteredApplications = filteredApplications.filter(app =>
        app.studentId && (app.studentId.cgpa || 0) >= parseFloat(minCGPA)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

    // Format applications
    const formattedApplications = paginatedApplications.map(app => ({
      id: app._id,
      student: {
        id: app.studentId?._id,
        name: app.studentId?.name || 'N/A',
        rollNumber: app.studentId?.rollNumber || 'N/A',
        email: app.studentId?.email || 'N/A',
        personalEmail: app.studentId?.personalEmail || 'N/A',
        phoneNumber: app.studentId?.phoneNumber || 'N/A',
        branch: app.studentId?.branch || 'N/A',
        batch: app.studentId?.batch || 'N/A',
        cgpa: app.studentId?.cgpa || 'N/A',
        backlogs: app.studentId?.backlogs || 0,
        resumeLink: app.studentId?.resumeLink || 'N/A'
      },
      company: {
        id: app.companyId?._id,
        name: app.companyId?.name || 'N/A',
        location: app.companyId?.location || 'N/A',
        industry: app.companyId?.industry || 'N/A'
      },
      appliedAt: app.appliedAt,
      status: app.status,
      score: app.score,
      notes: app.notes
    }));

    res.json({
      success: true,
      data: {
        applications: formattedApplications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredApplications.length,
          pages: Math.ceil(filteredApplications.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching recruiter applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/recruiter/applications/{applicationId}/status:
 *   put:
 *     summary: Update application status
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, shortlisted, in_progress, selected, rejected]
 *               score:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put('/applications/:applicationId/status', auth.protect, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, score, notes } = req.body;

    if (!status || !['pending', 'shortlisted', 'in_progress', 'selected', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get application and verify access
    const application = await Application.findById(applicationId).populate('companyId');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify recruiter has access to this company
    const company = await Company.findOne({ _id: application.companyId._id, userId: req.user.id });
    if (!company) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update application
    const oldStatus = application.status;
    application.status = status;
    if (score !== undefined) application.score = score;
    if (notes !== undefined) application.notes = notes;

    await application.save();

    // Update student placement status if selected
    if (status === 'selected') {
      await Student.findByIdAndUpdate(application.studentId, {
        isPlaced: true,
        placedCompany: company.name
      });
    }

    // Create notification if status changed
    if (oldStatus !== status) {
      const Notification = require('../models/Notification');
      await Notification.createApplicationStatusNotification(
        applicationId,
        status,
        oldStatus
      );
    }

    res.json({
      success: true,
      data: {
        id: application._id,
        status: application.status,
        score: application.score,
        notes: application.notes,
        updatedAt: application.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/recruiter/applications/bulk-update:
 *   put:
 *     summary: Bulk update applications
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationIds
 *               - action
 *             properties:
 *               applicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of application IDs
 *               action:
 *                 type: string
 *                 enum: [shortlist, reject, select]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Applications updated successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/applications/bulk-update', auth.protect, async (req, res) => {
  try {
    const { applicationIds, action, notes } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application IDs'
      });
    }

    if (!action || !['shortlist', 'reject', 'select'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    // Map actions to statuses
    const statusMap = {
      shortlist: 'shortlisted',
      reject: 'rejected',
      select: 'selected'
    };

    const newStatus = statusMap[action];

    // Get applications and verify access
    const applications = await Application.find({ _id: { $in: applicationIds } })
      .populate('companyId');

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid applications found'
      });
    }

    // Verify all applications belong to recruiter's companies
    const companyIds = applications.map(app => app.companyId._id);
    const companies = await Company.find({ _id: { $in: companyIds }, userId: req.user.id });

    if (companies.length !== new Set(companyIds.map(id => id.toString())).size) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to some applications'
      });
    }

    // Update applications
    const updatePromises = applications.map(async (application) => {
      const oldStatus = application.status;
      application.status = newStatus;
      if (notes) application.notes = notes;

      await application.save();

      // Update student placement status if selected
      if (newStatus === 'selected') {
        await Student.findByIdAndUpdate(application.studentId, {
          isPlaced: true,
          placedCompany: application.companyId.name
        });
      }

      // Create notification if status changed
      if (oldStatus !== newStatus) {
        const Notification = require('../models/Notification');
        await Notification.createApplicationStatusNotification(
          application._id,
          newStatus,
          oldStatus
        );
      }

      return application._id;
    });

    const updatedIds = await Promise.all(updatePromises);

    res.json({
      success: true,
      data: {
        updatedCount: updatedIds.length,
        updatedIds,
        status: newStatus
      }
    });

  } catch (error) {
    console.error('Error in bulk application update:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;