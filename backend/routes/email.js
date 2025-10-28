const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Company = require('../models/Company');
const emailService = require('../utils/emailService');

/**
 * @swagger
 * tags:
 *   name: Email
 *   description: Email management endpoints for communicating with eligible students
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailRequest:
 *       type: object
 *       required:
 *         - companyId
 *       properties:
 *         companyId:
 *           type: string
 *           description: Company ID to send emails for
 *         customMessage:
 *           type: string
 *           description: Custom message to include in emails
 *         subject:
 *           type: string
 *           description: Custom email subject line
 *         dryRun:
 *           type: boolean
 *           default: false
 *           description: If true, only validates eligibility without sending emails
 *         filters:
 *           type: object
 *           properties:
 *             branch:
 *               type: string
 *               description: Filter by branch
 *             batch:
 *               type: string
 *               description: Filter by batch
 *             minCGPA:
 *               type: number
 *               description: Filter by minimum CGPA
 *             maxBacklogs:
 *               type: integer
 *               description: Filter by maximum backlogs allowed
 *     EmailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             successful:
 *               type: integer
 *             failed:
 *               type: integer
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *             dryRun:
 *               type: boolean
 *             eligibleStudents:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/email/send-to-eligible:
 *   post:
 *     summary: Send emails to all eligible students for a company
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *     responses:
 *       200:
 *         description: Emails sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/send-to-eligible', auth.protect, auth.authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { companyId, customMessage, subject, dryRun = false, filters = {} } = req.body;

    // Validate required fields
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user has permission for this company (if recruiter)
    if (req.user.role === 'recruiter') {
      const hasPermission = company.recruiters.some(recruiterId =>
        recruiterId.toString() === req.user.id
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to send emails for this company'
        });
      }
    }

    // Build eligibility query
    const eligibilityQuery = {
      isPlaced: filters.isPlaced !== undefined ? filters.isPlaced : false,
      isActive: true
    };

    // Add eligibility criteria from company
    if (company.eligibilityCriteria) {
      if (company.eligibilityCriteria.minCGPA) {
        eligibilityQuery.cgpa = { $gte: company.eligibilityCriteria.minCGPA };
      }
      if (company.eligibilityCriteria.maxBacklogs !== undefined) {
        eligibilityQuery.backlogs = { $lte: company.eligibilityCriteria.maxBacklogs };
      }
      if (company.eligibilityCriteria.allowedBatches && company.eligibilityCriteria.allowedBatches.length > 0) {
        eligibilityQuery.batch = { $in: company.eligibilityCriteria.allowedBatches };
      }
      if (company.eligibilityCriteria.allowedBranches && company.eligibilityCriteria.allowedBranches.length > 0) {
        eligibilityQuery.branch = { $in: company.eligibilityCriteria.allowedBranches };
      }
    }

    // Apply additional filters
    if (filters.branch) {
      eligibilityQuery.branch = filters.branch;
    }
    if (filters.batch) {
      eligibilityQuery.batch = filters.batch;
    }
    if (filters.minCGPA) {
      eligibilityQuery.cgpa = { $gte: filters.minCGPA };
    }
    if (filters.maxBacklogs !== undefined) {
      eligibilityQuery.backlogs = { $lte: filters.maxBacklogs };
    }

    // Find eligible students
    const eligibleStudents = await Student.find(eligibilityQuery)
      .select('name email personalEmail branch batch cgpa backlogs')
      .lean();

    if (eligibleStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No eligible students found for the specified criteria',
        data: {
          total: 0,
          eligibleStudents: [],
          dryRun: dryRun
        }
      });
    }

    // If dry run, just return the eligible students without sending emails
    if (dryRun) {
      return res.status(200).json({
        success: true,
        message: `Found ${eligibleStudents.length} eligible students. This was a dry run - no emails were sent.`,
        data: {
          total: eligibleStudents.length,
          eligibleStudents: eligibleStudents.map(student => ({
            _id: student._id,
            name: student.name,
            email: student.email,
            branch: student.branch,
            batch: student.batch,
            cgpa: student.cgpa
          })),
          dryRun: true
        }
      });
    }

    // Send emails
    const emailResult = await emailService.sendEmailsToEligibleStudents(
      eligibleStudents,
      company,
      {
        customMessage,
        subject
      }
    );

    // Create notifications for all students about the email sent
    const { Notification } = require('../models/Notification');
    const notificationPromises = eligibleStudents.map(student => {
      return new Notification({
        recipientId: student._id,
        recipientType: 'student',
        type: 'system_update',
        message: `You've been notified about a new opportunity at ${company.name}. Check your email for details!`,
        metadata: {
          companyId: company._id,
          companyName: company.name,
          emailSent: true
        }
      }).save();
    });

    await Promise.all(notificationPromises);

    res.status(200).json({
      success: emailResult.success,
      message: emailResult.message,
      data: {
        ...emailResult.results,
        eligibleStudents: eligibleStudents.map(student => ({
          _id: student._id,
          name: student.name,
          email: student.email
        })),
        company: {
          _id: company._id,
          name: company.name
        }
      }
    });

  } catch (error) {
    console.error('Error sending emails to eligible students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/email/preview-eligible:
 *   post:
 *     summary: Preview eligible students for a company before sending emails
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Company ID to check eligibility for
 *               filters:
 *                 type: object
 *                 properties:
 *                   branch:
 *                     type: string
 *                     description: Filter by branch
 *                   batch:
 *                     type: string
 *                     description: Filter by batch
 *                   minCGPA:
 *                     type: number
 *                     description: Filter by minimum CGPA
 *                   maxBacklogs:
 *                     type: integer
 *                     description: Filter by maximum backlogs allowed
 *     responses:
 *       200:
 *         description: Preview of eligible students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           branch:
 *                             type: string
 *                           batch:
 *                             type: string
 *                           cgpa:
 *                             type: number
 *                           backlogs:
 *                             type: integer
 *                     company:
 *                       type: object
 *                     filters:
 *                       type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/preview-eligible', auth.protect, auth.authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { companyId, filters = {} } = req.body;

    // Validate required fields
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check permission for recruiters
    if (req.user.role === 'recruiter') {
      const hasPermission = company.recruiters.some(recruiterId =>
        recruiterId.toString() === req.user.id
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view eligible students for this company'
        });
      }
    }

    // Build the same eligibility query as the send endpoint
    const eligibilityQuery = {
      isPlaced: filters.isPlaced !== undefined ? filters.isPlaced : false,
      isActive: true
    };

    if (company.eligibilityCriteria) {
      if (company.eligibilityCriteria.minCGPA) {
        eligibilityQuery.cgpa = { $gte: company.eligibilityCriteria.minCGPA };
      }
      if (company.eligibilityCriteria.maxBacklogs !== undefined) {
        eligibilityQuery.backlogs = { $lte: company.eligibilityCriteria.maxBacklogs };
      }
      if (company.eligibilityCriteria.allowedBatches && company.eligibilityCriteria.allowedBatches.length > 0) {
        eligibilityQuery.batch = { $in: company.eligibilityCriteria.allowedBatches };
      }
      if (company.eligibilityCriteria.allowedBranches && company.eligibilityCriteria.allowedBranches.length > 0) {
        eligibilityQuery.branch = { $in: company.eligibilityCriteria.allowedBranches };
      }
    }

    // Apply additional filters
    if (filters.branch) {
      eligibilityQuery.branch = filters.branch;
    }
    if (filters.batch) {
      eligibilityQuery.batch = filters.batch;
    }
    if (filters.minCGPA) {
      eligibilityQuery.cgpa = { $gte: filters.minCGPA };
    }
    if (filters.maxBacklogs !== undefined) {
      eligibilityQuery.backlogs = { $lte: filters.maxBacklogs };
    }

    // Find eligible students
    const eligibleStudents = await Student.find(eligibilityQuery)
      .select('name email personalEmail branch batch cgpa backlogs')
      .sort({ name: 1 })
      .lean();

    // Get statistics
    const branchStats = {};
    const batchStats = {};

    eligibleStudents.forEach(student => {
      branchStats[student.branch] = (branchStats[student.branch] || 0) + 1;
      batchStats[student.batch] = (batchStats[student.batch] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      message: `Found ${eligibleStudents.length} eligible students`,
      data: {
        total: eligibleStudents.length,
        students: eligibleStudents,
        company: {
          _id: company._id,
          name: company.name,
          eligibilityCriteria: company.eligibilityCriteria
        },
        filters,
        statistics: {
          byBranch: branchStats,
          byBatch: batchStats,
          averageCGPA: eligibleStudents.length > 0
            ? (eligibleStudents.reduce((sum, s) => sum + s.cgpa, 0) / eligibleStudents.length).toFixed(2)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error previewing eligible students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/email/test-configuration:
 *   get:
 *     summary: Test email service configuration
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email configuration test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     configured:
 *                       type: boolean
 *                     environment:
 *                       type: string
 *                     emailProvider:
 *                       type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/test-configuration', auth.protect, auth.authorize('admin'), async (req, res) => {
  try {
    const isConfigured = await emailService.testEmailConfiguration();

    res.status(200).json({
      success: true,
      message: isConfigured
        ? 'Email configuration is working correctly'
        : 'Email configuration test failed',
      data: {
        configured: isConfigured,
        environment: process.env.NODE_ENV || 'development',
        emailProvider: process.env.NODE_ENV === 'production'
          ? process.env.EMAIL_HOST || 'Production Email Service'
          : 'Ethereal Email (Test Service)',
        hasCredentials: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS) ||
                        !!(process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS)
      }
    });

  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;