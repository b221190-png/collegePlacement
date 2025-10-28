const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]+$/, 'Roll number should contain only alphanumeric characters']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
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
  },
  cgpa: {
    type: Number,
    required: [true, 'CGPA is required'],
    min: [0, 'CGPA cannot be less than 0'],
    max: [10, 'CGPA cannot be more than 10']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  skills: [{
    type: String,
    trim: true
  }],
  resumeUrl: {
    type: String,
    default: null
  },
  resumeOriginalName: {
    type: String,
    default: null
  },
  resumeFileSize: {
    type: Number,
    default: null
  },
  backlogs: {
    type: Number,
    default: 0,
    min: [0, 'Backlogs cannot be negative']
  },
  batch: {
    type: Number,
    required: [true, 'Batch/Year is required'],
    min: [2000, 'Invalid batch year'],
    max: [2030, 'Invalid batch year']
  },
  placed: {
    type: Boolean,
    default: false
  },
  placedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  package: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Method to check eligibility for a company
studentSchema.methods.checkEligibility = async function(companyId) {
  const ApplicationWindow = mongoose.model('ApplicationWindow');
  const Company = mongoose.model('Company');

  try {
    // Get application window for the company
    const appWindow = await ApplicationWindow.findOne({
      companyId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!appWindow) {
      return { eligible: false, reason: 'Application window is not open' };
    }

    // Check CGPA requirement
    if (appWindow.minCGPA && this.cgpa < appWindow.minCGPA) {
      return { eligible: false, reason: `Minimum CGPA required is ${appWindow.minCGPA}` };
    }

    // Check backlogs requirement
    if (appWindow.maxBacklogs !== undefined && this.backlogs > appWindow.maxBacklogs) {
      return { eligible: false, reason: `Maximum backlogs allowed is ${appWindow.maxBacklogs}` };
    }

    // Check branch eligibility
    if (appWindow.eligibleBranches && appWindow.eligibleBranches.length > 0) {
      if (!appWindow.eligibleBranches.includes(this.branch)) {
        return { eligible: false, reason: 'Your branch is not eligible for this company' };
      }
    }

    // Check if already applied
    const Application = mongoose.model('Application');
    const existingApplication = await Application.findOne({
      studentId: this._id,
      companyId
    });

    if (existingApplication) {
      return { eligible: false, reason: 'You have already applied to this company' };
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

// Method to get applications
studentSchema.methods.getApplications = async function() {
  const Application = mongoose.model('Application');
  return await Application.find({ studentId: this._id })
    .populate('companyId', 'name logoUrl description')
    .sort({ submittedAt: -1 });
};

// Static method to upload multiple students
studentSchema.statics.bulkUpload = async function(studentsData) {
  const results = {
    success: [],
    errors: [],
    duplicates: []
  };

  for (let i = 0; i < studentsData.length; i++) {
    try {
      const studentData = studentsData[i];

      // Check for duplicate roll number or email
      const existingStudent = await this.findOne({
        $or: [
          { rollNumber: studentData.rollNumber },
          { 'userId.email': studentData.email }
        ]
      }).populate('userId');

      if (existingStudent) {
        if (existingStudent.rollNumber === studentData.rollNumber) {
          results.duplicates.push({
            row: i + 1,
            data: studentData,
            reason: 'Roll number already exists'
          });
        } else {
          results.duplicates.push({
            row: i + 1,
            data: studentData,
            reason: 'Email already exists'
          });
        }
        continue;
      }

      // Create user first
      const User = mongoose.model('User');
      const user = new User({
        name: studentData.name,
        email: studentData.email,
        password: studentData.password || 'tempPassword123',
        role: 'student'
      });

      await user.save();

      // Create student
      const student = new this({
        userId: user._id,
        rollNumber: studentData.rollNumber,
        branch: studentData.branch,
        cgpa: studentData.cgpa,
        phone: studentData.phone,
        skills: studentData.skills || [],
        batch: studentData.batch
      });

      await student.save();
      results.success.push(student);
    } catch (error) {
      results.errors.push({
        row: i + 1,
        data: studentsData[i],
        error: error.message
      });
    }
  }

  return results;
};

// Indexes for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ rollNumber: 1 }, { unique: true });
studentSchema.index({ branch: 1 });
studentSchema.index({ cgpa: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ placed: 1 });

module.exports = mongoose.model('Student', studentSchema);