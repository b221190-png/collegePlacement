const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  logoUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
      'Information Technology',
      'Software Development',
      'Consulting',
      'Banking and Finance',
      'Manufacturing',
      'Healthcare',
      'Education',
      'E-commerce',
      'Telecommunications',
      'Automotive',
      'Other'
    ]
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  packageOffered: {
    type: String,
    required: [true, 'Package offered is required'],
    trim: true
  },
  totalPositions: {
    type: Number,
    required: [true, 'Total positions is required'],
    min: [1, 'Total positions must be at least 1']
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  requirements: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  jobDescription: {
    type: String,
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  eligibilityCriteria: {
    minCGPA: {
      type: Number,
      min: 0,
      max: 10
    },
    maxBacklogs: {
      type: Number,
      min: 0
    },
    eligibleBranches: [{
      type: String
    }],
    passingYear: {
      type: Number
    }
  },
  recruitmentProcess: [{
    roundName: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    duration: {
      type: String
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  contactEmail: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  }
}, {
  timestamps: true
});

// Method to check if application is still open
companySchema.methods.isApplicationOpen = function() {
  return this.status === 'active' && new Date() <= this.applicationDeadline;
};

// Method to get applications count by status
companySchema.methods.getApplicationStats = async function() {
  const Application = mongoose.model('Application');

  const stats = await Application.aggregate([
    { $match: { companyId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }
    }
  ]);

  const result = {
    total: 0,
    submitted: 0,
    'under-review': 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0,
    avgScore: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    if (stat.avgScore) {
      result.avgScore = stat.avgScore;
    }
  });

  return result;
};

// Method to get applications
companySchema.methods.getApplications = async function(filters = {}) {
  const Application = mongoose.model('Application');
  const query = { companyId: this._id, ...filters };

  return await Application.find(query)
    .populate('studentId', 'rollNumber branch cgpa phone')
    .populate('userId', 'name email')
    .sort({ submittedAt: -1 });
};

// Method to get recruitment rounds
companySchema.methods.getRecruitmentRounds = async function() {
  const RecruitmentRound = mongoose.model('RecruitmentRound');

  return await RecruitmentRound.find({ companyId: this._id })
    .sort({ roundNumber: 1, scheduledDate: 1 });
};

// Method to create default recruitment rounds
companySchema.methods.createDefaultRounds = async function() {
  const RecruitmentRound = mongoose.model('RecruitmentRound');

  const defaultRounds = [
    {
      name: 'Aptitude Test',
      description: 'Written test to assess analytical skills',
      roundNumber: 1,
      createdBy: this.createdBy
    },
    {
      name: 'Technical Interview',
      description: 'Technical skills assessment',
      roundNumber: 2,
      createdBy: this.createdBy
    },
    {
      name: 'HR Interview',
      description: 'Final interview with HR team',
      roundNumber: 3,
      createdBy: this.createdBy
    }
  ];

  const rounds = [];
  for (const roundData of defaultRounds) {
    const round = new RecruitmentRound({
      companyId: this._id,
      ...roundData,
      status: 'upcoming',
      scheduledDate: new Date(Date.now() + (roundData.roundNumber * 7 * 24 * 60 * 60 * 1000)) // Each round 1 week apart
    });
    await round.save();
    rounds.push(round);
  }

  return rounds;
};

// Pre-save middleware to create recruitment rounds if not exists
companySchema.pre('save', async function(next) {
  if (this.isNew) {
    // We'll create rounds after the company is saved
    this.once('postSave', async () => {
      await this.createDefaultRounds();
    });
  }
  next();
});

// Static method to get active companies
companySchema.statics.getActiveCompanies = function() {
  return this.find({
    status: 'active',
    applicationDeadline: { $gte: new Date() }
  }).sort({ applicationDeadline: 1 });
};

// Static method to search companies
companySchema.statics.searchCompanies = function(searchTerm, filters = {}) {
  const query = {
    ...filters,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { industry: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { skills: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };

  return this.find(query).sort({ createdAt: -1 });
};

// Indexes for faster queries
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ status: 1 });
companySchema.index({ applicationDeadline: 1 });
companySchema.index({ createdBy: 1 });
companySchema.index({ skills: 1 });

// Add post-save hook
companySchema.post('save', function() {
  this.emit('postSave');
});

module.exports = mongoose.model('Company', companySchema);