const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  try {
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. User role ${req.user.role} is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Check if user can access company data (for recruiters)
const companyAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next(); // Admin can access all companies
    }

    if (req.user.role === 'recruiter') {
      // Check if the company belongs to this recruiter
      const companyId = req.params.companyId || req.params.id || req.body.companyId;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required.'
        });
      }

      if (req.user.companyId.toString() !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own company data.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Company access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authorization.'
    });
  }
};

// Check if user can access student data (for students themselves and admins)
const studentAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next(); // Admin can access all students
    }

    if (req.user.role === 'student') {
      // Get student ID from User model
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found.'
        });
      }

      const requestedStudentId = req.params.studentId || req.params.id || req.body.studentId;

      // Check if the requested student ID belongs to the authenticated user
      if (requestedStudentId && student._id.toString() !== requestedStudentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own data.'
        });
      }

      // Add student ID to request for further use
      req.studentId = student._id;
    }

    next();
  } catch (error) {
    console.error('Student access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authorization.'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  protect,
  authorize,
  companyAccess,
  studentAccess,
  optionalAuth
};