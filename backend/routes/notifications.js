const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Application = require('../models/Application');
const Company = require('../models/Company');
const Notification = require('../models/Notification');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - id
 *         - type
 *         - message
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: Unique notification ID
 *         type:
 *           type: string
 *           enum: [application_status, new_company, deadline_reminder, system_update]
 *           description: Type of notification
 *         message:
 *           type: string
 *           description: Notification message
 *         read:
 *           type: boolean
 *           default: false
 *           description: Whether notification has been read
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When notification was created
 *         metadata:
 *           type: object
 *           description: Additional notification data
 */

/**
 * @swagger
 * /api/notifications/student/{studentId}:
 *   get:
 *     summary: Get all notifications for a student
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
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
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId', auth.protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build query
    const query = { recipientId: studentId, recipientType: 'student' };
    if (unreadOnly) {
      query.read = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Notification.countDocuments(query);

    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id,
      type: notification.type,
      message: notification.message,
      read: notification.read,
      timestamp: notification.timestamp,
      metadata: notification.metadata || {}
    }));

    res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/notifications/student/{studentId}/mark-read:
 *   put:
 *     summary: Mark notifications as read for a student
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of notification IDs to mark as read. If empty, marks all as read.
 *               markAll:
 *                 type: boolean
 *                 default: false
 *                 description: Mark all notifications as read
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.put('/student/:studentId/mark-read', auth.protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { notificationIds, markAll } = req.body;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    let updateResult;

    if (markAll) {
      // Mark all notifications as read
      updateResult = await Notification.updateMany(
        { recipientId: studentId, recipientType: 'student', read: false },
        { read: true }
      );
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      updateResult = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipientId: studentId,
          recipientType: 'student'
        },
        { read: true }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either provide notificationIds or set markAll to true'
      });
    }

    res.json({
      success: true,
      data: {
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/notifications/student/{studentId}/count:
 *   get:
 *     summary: Get unread notification count for a student
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Unread notification count
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
 *                     unreadCount:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId/count', auth.protect, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get notification counts
    const [unreadCount, totalCount] = await Promise.all([
      Notification.countDocuments({
        recipientId: studentId,
        recipientType: 'student',
        read: false
      }),
      Notification.countDocuments({
        recipientId: studentId,
        recipientType: 'student'
      })
    ]);

    res.json({
      success: true,
      data: {
        unreadCount,
        totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification (system use)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - recipientType
 *               - type
 *               - message
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: ID of the recipient (student or user ID)
 *               recipientType:
 *                 type: string
 *                 enum: [student, user]
 *                 description: Type of recipient
 *               type:
 *                 type: string
 *                 enum: [application_status, new_company, deadline_reminder, system_update]
 *                 description: Type of notification
 *               message:
 *                 type: string
 *                 description: Notification message
 *               metadata:
 *                 type: object
 *                 description: Additional notification data
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', auth.protect, async (req, res) => {
  try {
    const { recipientId, recipientType, type, message, metadata } = req.body;

    // Validate required fields
    if (!recipientId || !recipientType || !type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipientId, recipientType, type, message'
      });
    }

    // Validate recipient type
    if (!['student', 'user'].includes(recipientType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipientType. Must be student or user'
      });
    }

    // Validate notification type
    const validTypes = ['application_status', 'new_company', 'deadline_reminder', 'system_update'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create notification
    const notification = new Notification({
      recipientId,
      recipientType,
      type,
      message,
      metadata: metadata || {},
      read: false,
      timestamp: new Date()
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: {
        id: notification._id,
        recipientId,
        recipientType,
        type,
        message,
        metadata: notification.metadata,
        read: notification.read,
        timestamp: notification.timestamp
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/notifications/generate-application-update:
 *   post:
 *     summary: Generate notifications for application status updates (system use)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - newStatus
 *             properties:
 *               applicationId:
 *                 type: string
 *                 description: Application ID that was updated
 *               newStatus:
 *                 type: string
 *                 description: New application status
 *               oldStatus:
 *                 type: string
 *                 description: Previous application status
 *     responses:
 *       200:
 *         description: Notifications generated successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.post('/generate-application-update', auth.protect, async (req, res) => {
  try {
    const { applicationId, newStatus, oldStatus } = req.body;

    if (!applicationId || !newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicationId, newStatus'
      });
    }

    // Get application with student and company details
    const application = await Application.findById(applicationId)
      .populate('studentId', 'name email')
      .populate('companyId', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Create notification message based on status change
    let message;
    if (newStatus === 'selected') {
      message = `🎉 Congratulations! You have been selected by ${application.companyId.name}!`;
    } else if (newStatus === 'rejected') {
      message = `Your application for ${application.companyId.name} has been rejected.`;
    } else if (newStatus === 'shortlisted') {
      message = `Your application for ${application.companyId.name} has been shortlisted for the next round.`;
    } else if (newStatus === 'in_progress') {
      message = `Your application status for ${application.companyId.name} has been updated to: In Progress`;
    } else {
      message = `Your application status for ${application.companyId.name} has been updated to: ${newStatus}`;
    }

    // Create notification
    const notification = new Notification({
      recipientId: application.studentId._id,
      recipientType: 'student',
      type: 'application_status',
      message,
      metadata: {
        applicationId,
        companyId: application.companyId._id,
        companyName: application.companyId.name,
        oldStatus,
        newStatus
      },
      read: false,
      timestamp: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      data: {
        message: 'Notification generated successfully',
        notification: {
          id: notification._id,
          recipientId: notification.recipientId,
          message: notification.message,
          type: notification.type,
          timestamp: notification.timestamp
        }
      }
    });
  } catch (error) {
    console.error('Error generating application update notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/notifications/student/{studentId}/cleanup:
 *   delete:
 *     summary: Clean up old read notifications for a student
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Delete notifications older than this many days
 *     responses:
 *       200:
 *         description: Old notifications cleaned up
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.delete('/student/:studentId/cleanup', auth.protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const daysOld = parseInt(req.query.daysOld) || 30;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Delete old read notifications
    const deleteResult = await Notification.deleteMany({
      recipientId: studentId,
      recipientType: 'student',
      read: true,
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      data: {
        deletedCount: deleteResult.deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;