const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - recipientId
 *         - recipientType
 *         - type
 *         - message
 *         - timestamp
 *       properties:
 *         recipientId:
 *           type: string
 *           description: ID of the recipient (student or user)
 *         recipientType:
 *           type: string
 *           enum: [student, user]
 *           description: Type of recipient
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
const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType',
    index: true
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['student', 'user'],
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['application_status', 'new_company', 'deadline_reminder', 'system_update'],
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, recipientType: 1, timestamp: -1 });
notificationSchema.index({ recipientId: 1, recipientType: 1, read: 1, timestamp: -1 });
notificationSchema.index({ recipientId: 1, recipientType: 1, type: 1, timestamp: -1 });

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create notification for application status update
notificationSchema.statics.createApplicationStatusNotification = async function(applicationId, newStatus, oldStatus) {
  const Application = mongoose.model('Application');
  const Student = mongoose.model('Student');
  const Company = mongoose.model('Company');

  try {
    // Get application details
    const application = await Application.findById(applicationId)
      .populate('studentId', 'name email')
      .populate('companyId', 'name');

    if (!application) {
      throw new Error('Application not found');
    }

    // Create notification message
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
    const notification = new this({
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
    return notification;
  } catch (error) {
    console.error('Error creating application status notification:', error);
    throw error;
  }
};

// Static method to create notification for new company
notificationSchema.statics.createNewCompanyNotification = async function(companyId, eligibleStudents = []) {
  const Company = mongoose.model('Company');

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const message = `🏢 New company ${company.name} is now hiring! Check if you're eligible.`;

    const notifications = eligibleStudents.map(studentId => ({
      recipientId: studentId,
      recipientType: 'student',
      type: 'new_company',
      message,
      metadata: {
        companyId,
        companyName: company.name
      },
      read: false,
      timestamp: new Date()
    }));

    if (notifications.length > 0) {
      const result = await this.insertMany(notifications);
      return result;
    }

    return [];
  } catch (error) {
    console.error('Error creating new company notifications:', error);
    throw error;
  }
};

// Static method to create deadline reminder notifications
notificationSchema.statics.createDeadlineReminderNotifications = async function(applicationWindowId) {
  const ApplicationWindow = mongoose.model('ApplicationWindow');
  const Application = mongoose.model('Application');

  try {
    const applicationWindow = await ApplicationWindow.findById(applicationWindowId).populate('companyId');
    if (!applicationWindow) {
      throw new Error('Application window not found');
    }

    // Get students who haven't applied yet but are eligible
    const applications = await Application.find({
      companyId: applicationWindow.companyId._id,
      applicationWindowId: applicationWindowId
    }).select('studentId');

    const appliedStudentIds = applications.map(app => app.studentId);

    // This would need to be implemented based on your eligibility logic
    // For now, we'll create a generic deadline reminder
    const message = `⏰ Reminder: Application deadline for ${applicationWindow.companyId.name} is approaching! Apply before ${applicationWindow.endDate.toDateString()}.`;

    // This would typically target eligible students who haven't applied
    // For demo purposes, we'll just show the structure
    return { message, applicationWindow };
  } catch (error) {
    console.error('Error creating deadline reminder notifications:', error);
    throw error;
  }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Instance method to get formatted notification data
notificationSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    type: this.type,
    message: this.message,
    read: this.read,
    timestamp: this.timestamp,
    timeAgo: this.timeAgo,
    metadata: this.metadata || {}
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;