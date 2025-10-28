const mongoose = require('mongoose');

const recruitmentRoundSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  name: {
    type: String,
    required: [true, 'Round name is required'],
    trim: true,
    maxlength: [100, 'Round name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  roundNumber: {
    type: Number,
    required: [true, 'Round number is required'],
    min: 1
  },
  duration: {
    type: String,
    trim: true,
    maxlength: [50, 'Duration cannot exceed 50 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid meeting URL']
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  maxCandidates: {
    type: Number,
    min: 1
  },
  currentCandidates: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Method to get candidates for this round
recruitmentRoundSchema.methods.getCandidates = async function() {
  const Application = mongoose.model('Application');

  return await Application.find({
    companyId: this.companyId,
    roundId: this._id,
    status: { $in: ['shortlisted', 'under-review'] }
  })
    .populate('studentId', 'rollNumber branch cgpa phone')
    .populate('userId', 'name email')
    .sort({ score: -1, submittedAt: -1 });
};

// Method to update round status
recruitmentRoundSchema.methods.updateStatus = async function(newStatus) {
  const oldStatus = this.status;
  this.status = newStatus;

  // If round is completed, move candidates to next round or mark as selected
  if (newStatus === 'completed') {
    await this.processRoundCompletion();
  }

  return await this.save();
};

// Method to process round completion
recruitmentRoundSchema.methods.processRoundCompletion = async function() {
  const Application = mongoose.model('Application');
  const RecruitmentRound = mongoose.model('RecruitmentRound');

  // Get all applications in this round
  const applications = await Application.find({
    companyId: this.companyId,
    roundId: this._id,
    status: 'shortlisted'
  });

  // Find next round
  const nextRound = await RecruitmentRound.findOne({
    companyId: this.companyId,
    roundNumber: this.roundNumber + 1,
    status: { $ne: 'cancelled' }
  });

  if (nextRound) {
    // Move candidates to next round
    for (const application of applications) {
      application.roundId = nextRound._id;
      application.status = 'submitted';
      await application.save();
    }
    nextRound.currentCandidates = applications.length;
    await nextRound.save();
  } else {
    // This is the final round, mark candidates as selected
    for (const application of applications) {
      application.status = 'selected';
      await application.save();

      // Update student placement status
      const Student = mongoose.model('Student');
      await Student.findByIdAndUpdate(application.studentId, {
        placed: true,
        placedCompany: this.companyId
      });
    }
  }
};

// Method to add candidate to round
recruitmentRoundSchema.methods.addCandidate = async function(applicationId) {
  const Application = mongoose.model('Application');

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  if (this.maxCandidates && this.currentCandidates >= this.maxCandidates) {
    throw new Error('Round is already full');
  }

  application.roundId = this._id;
  application.status = 'shortlisted';
  await application.save();

  this.currentCandidates += 1;
  await this.save();

  return application;
};

// Method to remove candidate from round
recruitmentRoundSchema.methods.removeCandidate = async function(applicationId) {
  const Application = mongoose.model('Application');

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  application.roundId = null;
  application.status = 'rejected';
  await application.save();

  this.currentCandidates = Math.max(0, this.currentCandidates - 1);
  await this.save();

  return application;
};

// Static method to get rounds by company
recruitmentRoundSchema.statics.getByCompany = function(companyId) {
  return this.find({ companyId })
    .sort({ roundNumber: 1, scheduledDate: 1 });
};

// Static method to get upcoming rounds
recruitmentRoundSchema.statics.getUpcomingRounds = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: 'upcoming',
    scheduledDate: { $gte: new Date(), $lte: futureDate }
  })
    .populate('companyId', 'name logoUrl')
    .sort({ scheduledDate: 1 });
};

// Static method to get rounds for a candidate
recruitmentRoundSchema.statics.getCandidateRounds = async function(studentId) {
  const Application = mongoose.model('Application');

  const applications = await Application.find({
    studentId,
    status: { $in: ['shortlisted', 'under-review', 'selected'] }
  }).distinct('roundId');

  return this.find({
    _id: { $in: applications }
  })
    .populate('companyId', 'name logoUrl')
    .sort({ scheduledDate: 1 });
};

// Pre-save validation
recruitmentRoundSchema.pre('save', function(next) {
  if (this.scheduledDate && this.scheduledDate < new Date()) {
    return next(new Error('Scheduled date cannot be in the past'));
  }

  if (this.currentCandidates && this.maxCandidates && this.currentCandidates > this.maxCandidates) {
    return next(new Error('Current candidates cannot exceed maximum candidates'));
  }

  next();
});

// Indexes for faster queries
recruitmentRoundSchema.index({ companyId: 1, roundNumber: 1 });
recruitmentRoundSchema.index({ status: 1 });
recruitmentRoundSchema.index({ scheduledDate: 1 });
recruitmentRoundSchema.index({ createdBy: 1 });

module.exports = mongoose.model('RecruitmentRound', recruitmentRoundSchema);