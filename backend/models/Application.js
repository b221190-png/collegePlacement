const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentRound',
    default: null
  },
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'shortlisted', 'rejected', 'selected'],
    default: 'submitted'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  recruiterNotes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  resumeUrl: {
    type: String,
    default: null
  },
  formData: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      address: String
    },
    academicInfo: {
      tenthPercentage: Number,
      twelfthPercentage: Number,
      graduationCGPA: Number,
      currentBacklogs: Number,
      gapInEducation: Number
    },
    projectDetails: [{
      title: String,
      description: String,
      technologies: [String],
      duration: String
    }],
    experienceDetails: [{
      company: String,
      position: String,
      duration: String,
      description: String
    }],
    skills: [String],
    achievements: [String],
    additionalInfo: String
  },
  isApplicationWindowOpen: {
    type: Boolean,
    default: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ studentId: 1, companyId: 1 }, { unique: true });

// Method to update application status
applicationSchema.methods.updateStatus = async function(newStatus, reviewerId, notes = null) {
  const oldStatus = this.status;
  const oldScore = this.score;

  // Create review history entry
  const ApplicationReviewHistory = mongoose.model('ApplicationReviewHistory');
  const history = new ApplicationReviewHistory({
    applicationId: this._id,
    reviewerId,
    oldStatus,
    newStatus,
    oldScore,
    newScore: this.score,
    notes
  });

  await history.save();

  // Update application
  this.status = newStatus;
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  if (notes) {
    this.recruiterNotes = notes;
  }

  // If shortlisted, move to next round
  if (newStatus === 'shortlisted') {
    await this.moveToNextRound();
  }

  return await this.save();
};

// Method to update score
applicationSchema.methods.updateScore = async function(newScore, reviewerId, notes = null) {
  const oldScore = this.score;

  // Create review history entry
  const ApplicationReviewHistory = mongoose.model('ApplicationReviewHistory');
  const history = new ApplicationReviewHistory({
    applicationId: this._id,
    reviewerId,
    oldStatus: this.status,
    newStatus: this.status,
    oldScore,
    newScore,
    notes
  });

  await history.save();

  // Update application
  this.score = newScore;
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  if (notes) {
    this.recruiterNotes = notes;
  }

  return await this.save();
};

// Method to move to next round
applicationSchema.methods.moveToNextRound = async function() {
  const RecruitmentRound = mongoose.model('RecruitmentRound');

  // Get current round
  let currentRound = null;
  if (this.roundId) {
    currentRound = await RecruitmentRound.findById(this.roundId);
  }

  // Find next round
  const nextRound = await RecruitmentRound.findOne({
    companyId: this.companyId,
    roundNumber: currentRound ? currentRound.roundNumber + 1 : 1
  });

  if (nextRound) {
    this.roundId = nextRound._id;
  }
};

// Method to get review history
applicationSchema.methods.getReviewHistory = async function() {
  const ApplicationReviewHistory = mongoose.model('ApplicationReviewHistory');

  return await ApplicationReviewHistory.find({ applicationId: this._id })
    .populate('reviewerId', 'name email role')
    .sort({ reviewedAt: -1 });
};

// Method to check if application can be updated
applicationSchema.methods.canBeUpdated = function() {
  return this.status === 'submitted' || this.status === 'under-review';
};

// Static method to get applications by company
applicationSchema.statics.getByCompany = function(companyId, filters = {}) {
  const query = { companyId, ...filters };
  return this.find(query)
    .populate('studentId', 'rollNumber branch cgpa phone')
    .populate('userId', 'name email')
    .sort({ submittedAt: -1 });
};

// Static method to get applications by student
applicationSchema.statics.getByStudent = function(studentId, filters = {}) {
  const query = { studentId, ...filters };
  return this.find(query)
    .populate('companyId', 'name logoUrl description location packageOffered')
    .sort({ submittedAt: -1 });
};

// Static method to get dashboard stats
applicationSchema.statics.getDashboardStats = async function(companyId = null) {
  const matchStage = companyId ? { companyId } : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalApplications: { $sum: 1 },
        submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ['$status', 'under-review'] }, 1, 0] } },
        shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        selected: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } },
        avgScore: { $avg: '$score' }
      }
    }
  ]);

  return stats[0] || {
    totalApplications: 0,
    submitted: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0,
    avgScore: 0
  };
};

// Pre-save middleware to validate application window
applicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const ApplicationWindow = mongoose.model('ApplicationWindow');
    const Company = mongoose.model('Company');

    // Check if company exists and is active
    const company = await Company.findById(this.companyId);
    if (!company || company.status !== 'active') {
      return next(new Error('Company is not active or does not exist'));
    }

    // Check if application window is open
    const appWindow = await ApplicationWindow.findOne({
      companyId: this.companyId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!appWindow) {
      this.isApplicationWindowOpen = false;
      return next(new Error('Application window is not open for this company'));
    }
  }
  next();
});

// Indexes for faster queries
applicationSchema.index({ studentId: 1 });
applicationSchema.index({ companyId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ score: -1 });
applicationSchema.index({ roundId: 1 });

module.exports = mongoose.model('Application', applicationSchema);