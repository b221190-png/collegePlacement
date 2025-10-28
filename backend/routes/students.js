const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Student = require('../models/Student');
const User = require('../models/User');
const Application = require('../models/Application');
const { protect, authorize, studentAccess } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow resumes (PDF, DOC, DOCX) and CSV files
  const allowedTypes = {
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'text/csv': true,
    'application/vnd.ms-excel': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// @route   GET /api/students
// @desc    Get all students (admin only)
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('branch')
    .optional()
    .isIn(['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Other'])
    .withMessage('Invalid branch'),
  query('placed')
    .optional()
    .isBoolean()
    .withMessage('placed must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      branch,
      placed,
      minCGPA,
      maxCGPA,
      batch,
      search
    } = req.query;

    // Build query
    const query = {};
    if (branch) query.branch = branch;
    if (placed !== undefined) query.placed = placed === 'true';
    if (batch) query.batch = parseInt(batch);
    if (minCGPA) query.cgpa = { $gte: parseFloat(minCGPA) };
    if (maxCGPA) {
      if (query.cgpa) {
        query.cgpa.$lte = parseFloat(maxCGPA);
      } else {
        query.cgpa = { $lte: parseFloat(maxCGPA) };
      }
    }
    if (search) {
      query.$or = [
        { rollNumber: { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } },
        { 'userId.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get students with user data
    const students = await Student.find(query)
      .populate({
        path: 'userId',
        match: search ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        } : {}
      })
      .populate('placedCompany', 'name logoUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out students where user match failed (due to search)
    const filteredStudents = students.filter(student => student.userId);

    // Get total count
    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: {
        students: filteredStudents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', protect, studentAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate('userId', 'name email role isActive lastLogin')
      .populate('placedCompany', 'name logoUrl description');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization (handled by middleware)
    if (req.user.role === 'student' && req.studentId && req.studentId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.'
      });
    }

    // Get applications if student is viewing their own profile or admin
    let applications = [];
    if (req.user.role === 'admin' || (req.user.role === 'student' && req.studentId && req.studentId.toString() === id)) {
      applications = await student.getApplications();
    }

    res.json({
      success: true,
      data: {
        student,
        applications
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student'
    });
  }
});

// @route   POST /api/students
// @desc    Create new student (admin only)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('rollNumber')
    .trim()
    .notEmpty()
    .withMessage('Roll number is required')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Roll number should contain only alphanumeric characters'),
  body('branch')
    .isIn(['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Other'])
    .withMessage('Invalid branch'),
  body('cgpa')
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number'),
  body('batch')
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Batch must be a valid year between 2000 and 2030'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      password,
      rollNumber,
      branch,
      cgpa,
      phone,
      batch,
      skills = [],
      backlogs = 0
    } = req.body;

    // Check if roll number already exists
    const existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'student'
    });

    await user.save();

    // Create student
    const student = new Student({
      userId: user._id,
      rollNumber: rollNumber.toUpperCase(),
      branch,
      cgpa,
      phone,
      batch,
      skills,
      backlogs
    });

    await student.save();

    // Populate user data for response
    await student.populate('userId', 'name email role isActive');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating student'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student (admin only or own profile for limited fields)
// @access  Private
router.put('/:id', protect, [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('cgpa')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      name,
      rollNumber,
      branch,
      cgpa,
      phone,
      batch,
      skills,
      backlogs,
      placed,
      placedCompany,
      package: salaryPackage
    } = req.body;

    const student = await Student.findById(id).populate('userId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check permissions
    const isOwnProfile = req.user.role === 'student' && student.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build update objects
    const userUpdates = {};
    const studentUpdates = {};

    // Fields students can update themselves
    if (name) userUpdates.name = name;
    if (phone) studentUpdates.phone = phone;
    if (skills) studentUpdates.skills = skills;

    // Fields only admins can update
    if (isAdmin) {
      if (rollNumber) {
        // Check if roll number is already taken by another student
        const existingStudent = await Student.findOne({
          rollNumber: rollNumber.toUpperCase(),
          _id: { $ne: id }
        });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Roll number already exists'
          });
        }
        studentUpdates.rollNumber = rollNumber.toUpperCase();
      }
      if (branch) studentUpdates.branch = branch;
      if (cgpa) studentUpdates.cgpa = cgpa;
      if (batch) studentUpdates.batch = batch;
      if (backlogs !== undefined) studentUpdates.backlogs = backlogs;
      if (placed !== undefined) studentUpdates.placed = placed;
      if (placedCompany) studentUpdates.placedCompany = placedCompany;
      if (salaryPackage) studentUpdates.package = salaryPackage;
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      studentUpdates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email role isActive lastLogin')
      .populate('placedCompany', 'name logoUrl');

    // Update user if needed
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(student.userId._id, userUpdates);
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { student: updatedStudent }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating student'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student (admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete student's applications
    await Application.deleteMany({ studentId: id });

    // Delete student
    await Student.findByIdAndDelete(id);

    // Delete associated user
    await User.findByIdAndDelete(student.userId);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting student'
    });
  }
});

// @route   POST /api/students/bulk-upload
// @desc    Bulk upload students via CSV (admin only)
// @access  Private (Admin only)
router.post('/bulk-upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if file is CSV
    if (!req.file.mimetype.includes('csv')) {
      return res.status(400).json({
        success: false,
        message: 'Only CSV files are allowed for bulk upload'
      });
    }

    const results = [];
    const fileBuffer = req.file.buffer;
    const readableStream = Readable.from(fileBuffer.toString());

    readableStream
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        if (data.name && data.email && data.rollNumber && data.branch && data.cgpa && data.phone && data.batch) {
          results.push({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password || 'tempPassword123',
            rollNumber: data.rollNumber.trim().toUpperCase(),
            branch: data.branch.trim(),
            cgpa: parseFloat(data.cgpa),
            phone: data.phone.trim(),
            batch: parseInt(data.batch),
            skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
            backlogs: parseInt(data.backlogs) || 0
          });
        }
      })
      .on('end', async () => {
        try {
          const uploadResults = await Student.bulkUpload(results);

          res.json({
            success: true,
            message: 'Bulk upload completed',
            data: uploadResults
          });
        } catch (error) {
          console.error('Bulk upload processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing bulk upload'
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({
          success: false,
          message: 'Error parsing CSV file'
        });
      });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk upload'
    });
  }
});

// @route   POST /api/students/:id/upload-resume
// @desc    Upload student resume
// @access  Private
router.post('/:id/upload-resume', protect, upload.single('resume'), async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate('userId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check permissions
    const isOwnProfile = req.user.role === 'student' && student.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }

    // Update student with resume info
    student.resumeUrl = `/uploads/${req.file.filename}`;
    student.resumeOriginalName = req.file.originalname;
    student.resumeFileSize = req.file.size;

    await student.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeUrl: student.resumeUrl,
        resumeOriginalName: student.resumeOriginalName,
        resumeFileSize: student.resumeFileSize
      }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading resume'
    });
  }
});

// @route   GET /api/students/eligible/:companyId
// @desc    Get eligible students for a company (admin only)
// @access  Private (Admin only)
router.get('/eligible/:companyId', protect, authorize('admin'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const ApplicationWindow = require('../models/ApplicationWindow');
    const Company = require('../models/Company');

    // Get active application window for the company
    const appWindow = await ApplicationWindow.findOne({
      companyId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!appWindow) {
      return res.status(404).json({
        success: false,
        message: 'No active application window found for this company'
      });
    }

    // Build eligibility query
    const query = { placed: false };

    if (appWindow.minCGPA) {
      query.cgpa = { $gte: appWindow.minCGPA };
    }

    if (appWindow.maxBacklogs !== undefined) {
      query.backlogs = { $lte: appWindow.maxBacklogs };
    }

    if (appWindow.eligibleBranches && appWindow.eligibleBranches.length > 0) {
      query.branch = { $in: appWindow.eligibleBranches };
    }

    if (appWindow.passingYear) {
      query.batch = appWindow.passingYear;
    }

    // Get eligible students
    const skip = (page - 1) * limit;
    const students = await Student.find(query)
      .populate('userId', 'name email')
      .sort({ cgpa: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);
    const eligibleCount = await appWindow.getEligibleStudentsCount();

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        eligibilityCriteria: {
          minCGPA: appWindow.minCGPA,
          maxBacklogs: appWindow.maxBacklogs,
          eligibleBranches: appWindow.eligibleBranches,
          passingYear: appWindow.passingYear,
          totalEligible: eligibleCount
        }
      }
    });
  } catch (error) {
    console.error('Get eligible students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching eligible students'
    });
  }
});

module.exports = router;