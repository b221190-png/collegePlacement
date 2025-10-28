const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Round:
 *       type: object
 *       required:
 *         - companyId
 *         - name
 *         - type
 *         - sequence
 *       properties:
 *         companyId:
 *           type: string
 *           description: Company ID this round belongs to
 *         name:
 *           type: string
 *           description: Name of the recruitment round
 *         type:
 *           type: string
 *           enum: [online_test, technical_interview, hr_interview, group_discussion, aptitude_test, case_study, coding_challenge, behavioral_interview, final_interview]
 *           description: Type of recruitment round
 *         description:
 *           type: string
 *           description: Description of what this round involves
 *         sequence:
 *           type: integer
 *           description: Order in which this round occurs
 *         duration:
 *           type: integer
 *           description: Duration in minutes
 *         maxScore:
 *           type: number
 *           description: Maximum score for this round
 *         passingScore:
 *           type: number
 *           description: Minimum score required to pass
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date and time for this round
 *         location:
 *           type: string
 *           description: Location of the round (physical or online link)
 *         instructions:
 *           type: string
 *           description: Special instructions for candidates
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this round is currently active
 *         requiredDocuments:
 *           type: array
 *           items:
 *             type: string
 *           description: List of required documents for this round
 *         evaluationCriteria:
 *           type: array
 *           items:
 *             type: object
 *           description: Evaluation criteria for this round
 */
const roundSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    required: true,
    enum: [
      'online_test',
      'technical_interview',
      'hr_interview',
      'group_discussion',
      'aptitude_test',
      'case_study',
      'coding_challenge',
      'behavioral_interview',
      'final_interview'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  sequence: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number,
    min: 1,
    max: 480 // Max 8 hours
  },
  maxScore: {
    type: Number,
    min: 0
  },
  passingScore: {
    type: Number,
    min: 0
  },
  scheduledDate: {
    type: Date,
    index: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  requiredDocuments: [{
    type: String,
    trim: true
  }],
  evaluationCriteria: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      trim: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
roundSchema.index({ companyId: 1, sequence: 1 });
roundSchema.index({ companyId: 1, isActive: 1 });
roundSchema.index({ companyId: 1, scheduledDate: 1 });

// Virtual for formatted date
roundSchema.virtual('formattedDate').get(function() {
  if (!this.scheduledDate) return null;
  return this.scheduledDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for status based on scheduled date
roundSchema.virtual('status').get(function() {
  if (!this.scheduledDate) return 'Not Scheduled';

  const now = new Date();
  if (this.scheduledDate > now) return 'Upcoming';
  if (this.scheduledDate.toDateString() === now.toDateString()) return 'Today';
  return 'Completed';
});

// Pre-save middleware to validate sequence uniqueness within company
roundSchema.pre('save', async function(next) {
  if (!this.isModified('sequence') && !this.isModified('companyId')) {
    return next();
  }

  try {
    const existingRound = await this.constructor.findOne({
      companyId: this.companyId,
      sequence: this.sequence,
      _id: { $ne: this._id }
    });

    if (existingRound) {
      const error = new Error(`Round with sequence ${this.sequence} already exists for this company`);
      error.name = 'ValidationError';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get rounds for a company in sequence
roundSchema.statics.getCompanyRounds = async function(companyId, includeInactive = false) {
  const query = { companyId };
  if (!includeInactive) {
    query.isActive = true;
  }

  return this.find(query)
    .sort({ sequence: 1 })
    .populate('createdBy', 'name email');
};

// Static method to get next available sequence for a company
roundSchema.statics.getNextSequence = async function(companyId) {
  const lastRound = await this.findOne({ companyId })
    .sort({ sequence: -1 })
    .select('sequence');

  return lastRound ? lastRound.sequence + 1 : 1;
};

// Instance method to get upcoming candidates for this round
roundSchema.methods.getUpcomingCandidates = async function() {
  const Application = mongoose.model('Application');

  // This would typically get candidates who passed the previous round
  // For now, return all applications for the company
  const applications = await Application.find({
    companyId: this.companyId,
    status: { $in: ['shortlisted', 'in_progress'] }
  }).populate('studentId', 'name email branch cgpa');

  return applications.map(app => ({
    applicationId: app._id,
    student: app.studentId,
    currentStatus: app.status
  }));
};

// Instance method to check if round is ready to start
roundSchema.methods.isReadyToStart = function() {
  if (!this.isActive) return false;
  if (!this.scheduledDate) return false;

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return this.scheduledDate <= oneHourFromNow && this.scheduledDate > now;
};

// Instance method to get formatted round info
roundSchema.methods.getFormattedInfo = function() {
  return {
    id: this._id,
    name: this.name,
    type: this.type,
    description: this.description,
    sequence: this.sequence,
    duration: this.duration,
    maxScore: this.maxScore,
    passingScore: this.passingScore,
    scheduledDate: this.scheduledDate,
    formattedDate: this.formattedDate,
    location: this.location,
    instructions: this.instructions,
    status: this.status,
    isActive: this.isActive,
    requiredDocuments: this.requiredDocuments,
    evaluationCriteria: this.evaluationCriteria,
    evaluationCriteriaTotal: this.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0)
  };
};

const Round = mongoose.model('Round', roundSchema);

module.exports = Round;