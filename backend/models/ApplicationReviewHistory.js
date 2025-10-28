const mongoose = require('mongoose');

const applicationReviewHistorySchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application ID is required']
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required']
  },
  oldStatus: {
    type: String,
    enum: ['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'],
    required: true
  },
  newStatus: {
    type: String,
    enum: ['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'],
    required: true
  },
  oldScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  newScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  },
  reviewType: {
    type: String,
    enum: ['status_change', 'score_update', 'both'],
    default: 'status_change'
  }
}, {
  timestamps: true
});

// Pre-save middleware to determine review type
applicationReviewHistorySchema.pre('save', function(next) {
  const statusChanged = this.oldStatus !== this.newStatus;
  const scoreChanged = this.oldScore !== this.newScore;

  if (statusChanged && scoreChanged) {
    this.reviewType = 'both';
  } else if (scoreChanged) {
    this.reviewType = 'score_update';
  } else {
    this.reviewType = 'status_change';
  }

  next();
});

// Static method to get review history for an application
applicationReviewHistorySchema.statics.getByApplication = function(applicationId) {
  return this.find({ applicationId })
    .populate('reviewerId', 'name email role')
    .sort({ reviewedAt: -1 });
};

// Static method to get review history by reviewer
applicationReviewHistorySchema.statics.getByReviewer = function(reviewerId, filters = {}) {
  const query = { reviewerId, ...filters };
  return this.find(query)
    .populate('applicationId')
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
    .sort({ reviewedAt: -1 });
};

// Indexes for faster queries
applicationReviewHistorySchema.index({ applicationId: 1 });
applicationReviewHistorySchema.index({ reviewerId: 1 });
applicationReviewHistorySchema.index({ reviewedAt: -1 });

module.exports = mongoose.model('ApplicationReviewHistory', applicationReviewHistorySchema);