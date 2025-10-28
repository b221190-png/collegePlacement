const mongoose = require('mongoose');

const applicationWindowSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  minCGPA: {
    type: Number,
    min: 0,
    max: 10
  },
  maxBacklogs: {
    type: Number,
    min: 0,
    default: 0
  },
  eligibleBranches: [{
    type: String,
    enum: [
      'Computer Science',
      'Information Technology',
      'Electronics and Communication',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Biotechnology',
      'Other'
    ]
  }],
  passingYear: {
    type: Number,
    min: 2000,
    max: 2030
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Method to check if window is currently active
applicationWindowSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  const startDateTime = new Date(this.startDate);
  const endDateTime = new Date(this.endDate);

  // Set times on the dates
  const [startHour, startMinute] = this.startTime.split(':');
  const [endHour, endMinute] = this.endTime.split(':');

  startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
  endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 59, 999);

  return this.isActive && now >= startDateTime && now <= endDateTime;
};

// Method to get eligible students count
applicationWindowSchema.methods.getEligibleStudentsCount = async function() {
  const Student = mongoose.model('Student');

  const query = { placed: false };

  // Add CGPA filter
  if (this.minCGPA) {
    query.cgpa = { $gte: this.minCGPA };
  }

  // Add backlogs filter
  if (this.maxBacklogs !== undefined) {
    query.backlogs = { $lte: this.maxBacklogs };
  }

  // Add branch filter
  if (this.eligibleBranches && this.eligibleBranches.length > 0) {
    query.branch = { $in: this.eligibleBranches };
  }

  // Add passing year filter
  if (this.passingYear) {
    query.batch = this.passingYear;
  }

  return await Student.countDocuments(query);
};

// Method to check student eligibility
applicationWindowSchema.methods.checkStudentEligibility = async function(studentId) {
  const Student = mongoose.model('Student');

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return { eligible: false, reason: 'Student not found' };
    }

    if (student.placed) {
      return { eligible: false, reason: 'Student is already placed' };
    }

    // Check CGPA
    if (this.minCGPA && student.cgpa < this.minCGPA) {
      return { eligible: false, reason: `Minimum CGPA required is ${this.minCGPA}` };
    }

    // Check backlogs
    if (this.maxBacklogs !== undefined && student.backlogs > this.maxBacklogs) {
      return { eligible: false, reason: `Maximum backlogs allowed is ${this.maxBacklogs}` };
    }

    // Check branch
    if (this.eligibleBranches && this.eligibleBranches.length > 0) {
      if (!this.eligibleBranches.includes(student.branch)) {
        return { eligible: false, reason: 'Your branch is not eligible' };
      }
    }

    // Check passing year
    if (this.passingYear && student.batch !== this.passingYear) {
      return { eligible: false, reason: `Only ${this.passingYear} batch students are eligible` };
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error checking student eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

// Method to get application stats for this window
applicationWindowSchema.methods.getApplicationStats = async function() {
  const Application = mongoose.model('Application');

  const stats = await Application.aggregate([
    {
      $match: {
        companyId: this.companyId,
        submittedAt: {
          $gte: this.startDate,
          $lte: this.endDate
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }
    }
  ]);

  const result = {
    totalApplications: 0,
    submitted: 0,
    'under-review': 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0,
    avgScore: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.totalApplications += stat.count;
    if (stat.avgScore) {
      result.avgScore = stat.avgScore;
    }
  });

  return result;
};

// Static method to get currently active windows
applicationWindowSchema.statics.getActiveWindows = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('companyId', 'name logoUrl');
};

// Static method to get upcoming windows
applicationWindowSchema.statics.getUpcomingWindows = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $gt: now }
  })
    .populate('companyId', 'name logoUrl')
    .sort({ startDate: 1 })
    .limit(10);
};

// Pre-save validation
applicationWindowSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('Start date must be before end date'));
  }

  if (this.startTime >= this.endTime && this.startDate.getTime() === this.endDate.getTime()) {
    return next(new Error('Start time must be before end time'));
  }

  next();
});

// Indexes for faster queries
applicationWindowSchema.index({ companyId: 1 });
applicationWindowSchema.index({ startDate: 1 });
applicationWindowSchema.index({ endDate: 1 });
applicationWindowSchema.index({ isActive: 1 });
applicationWindowSchema.index({ createdBy: 1 });

module.exports = mongoose.model('ApplicationWindow', applicationWindowSchema);