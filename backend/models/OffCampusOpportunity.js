const mongoose = require('mongoose');

const offCampusOpportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Opportunity title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  companyLogoUrl: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['internship', 'full-time', 'freelance', 'remote', 'part-time'],
    required: [true, 'Opportunity type is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  duration: {
    type: String,
    trim: true,
    maxlength: [100, 'Duration cannot exceed 100 characters']
  },
  stipend: {
    type: String,
    trim: true,
    maxlength: [100, 'Stipend cannot exceed 100 characters']
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [100, 'Salary cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each requirement cannot exceed 500 characters']
  }],
  skills: [{
    type: String,
    trim: true
  }],
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  applicationLink: {
    type: String,
    required: [true, 'Application link is required'],
    match: [/^https?:\/\/.+/, 'Please enter a valid application URL']
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
      'Marketing',
      'Design',
      'Other'
    ]
  },
  experience: {
    type: String,
    enum: ['fresher', 'experienced', 'any'],
    default: 'fresher'
  },
  minExperience: {
    type: Number,
    min: 0,
    default: 0
  },
  maxExperience: {
    type: Number,
    min: 0
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
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual to check if opportunity is still active
offCampusOpportunitySchema.virtual('isStillActive').get(function() {
  return this.isActive && new Date() <= this.applicationDeadline;
});

// Method to increment view count
offCampusOpportunitySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment application count
offCampusOpportunitySchema.methods.incrementApplications = function() {
  this.applications += 1;
  return this.save();
};

// Method to search opportunities
offCampusOpportunitySchema.statics.searchOpportunities = function(searchTerm, filters = {}) {
  const query = {
    isActive: true,
    applicationDeadline: { $gte: new Date() },
    ...filters,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { company: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { industry: { $regex: searchTerm, $options: 'i' } },
      { skills: { $in: [new RegExp(searchTerm, 'i')] } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };

  return this.find(query)
    .sort({ postedDate: -1, views: -1 })
    .limit(50);
};

// Static method to get opportunities by type
offCampusOpportunitySchema.statics.getByType = function(type) {
  return this.find({
    type,
    isActive: true,
    applicationDeadline: { $gte: new Date() }
  }).sort({ postedDate: -1 });
};

// Static method to get featured opportunities
offCampusOpportunitySchema.statics.getFeaturedOpportunities = function(limit = 10) {
  return this.find({
    isActive: true,
    applicationDeadline: { $gte: new Date() }
  })
    .sort({ views: -1, applications: -1, postedDate: -1 })
    .limit(limit);
};

// Static method to get opportunities by skills
offCampusOpportunitySchema.statics.getBySkills = function(skillArray) {
  return this.find({
    isActive: true,
    applicationDeadline: { $gte: new Date() },
    skills: { $in: skillArray }
  }).sort({ postedDate: -1 });
};

// Static method to get opportunities by location
offCampusOpportunitySchema.statics.getByLocation = function(location) {
  return this.find({
    isActive: true,
    applicationDeadline: { $gte: new Date() },
    $or: [
      { location: { $regex: location, $options: 'i' } },
      { isRemote: true }
    ]
  }).sort({ postedDate: -1 });
};

// Static method to get opportunities by experience level
offCampusOpportunitySchema.statics.getByExperience = function(experienceLevel) {
  return this.find({
    experience: experienceLevel,
    isActive: true,
    applicationDeadline: { $gte: new Date() }
  }).sort({ postedDate: -1 });
};

// Pre-save validation
offCampusOpportunitySchema.pre('save', function(next) {
  if (this.minExperience && this.maxExperience && this.minExperience > this.maxExperience) {
    return next(new Error('Minimum experience cannot be greater than maximum experience'));
  }

  if (this.experience === 'experienced' && !this.minExperience) {
    this.minExperience = 1;
  }

  next();
});

// Indexes for faster queries
offCampusOpportunitySchema.index({ title: 'text', company: 'text', description: 'text' });
offCampusOpportunitySchema.index({ type: 1 });
offCampusOpportunitySchema.index({ industry: 1 });
offCampusOpportunitySchema.index({ experience: 1 });
offCampusOpportunitySchema.index({ applicationDeadline: 1 });
offCampusOpportunitySchema.index({ isActive: 1 });
offCampusOpportunitySchema.index({ postedDate: -1 });
offCampusOpportunitySchema.index({ skills: 1 });
offCampusOpportunitySchema.index({ location: 1 });
offCampusOpportunitySchema.index({ views: -1 });

module.exports = mongoose.model('OffCampusOpportunity', offCampusOpportunitySchema);