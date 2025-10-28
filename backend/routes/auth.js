const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with role-based validation
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *               role:
 *                 type: string
 *                 enum: [admin, recruiter, student]
 *                 description: User's role
 *               studentData:
 *                 type: object
 *                 description: Student-specific data (required for student role)
 *     responses:
 *       '201':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       '400':
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
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
  body('role')
    .isIn(['admin', 'recruiter', 'student'])
    .withMessage('Role must be admin, recruiter, or student'),
  body('companyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid company ID'),
  body('studentData')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Student data is required for student role')
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

    const { name, email, password, role, companyId, studentData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role-specific requirements
    if (role === 'recruiter' && !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required for recruiter role'
      });
    }

    if (role === 'student' && !studentData) {
      return res.status(400).json({
        success: false,
        message: 'Student data is required for student role'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      companyId: role === 'recruiter' ? companyId : undefined
    });

    await user.save();

    // Create student profile if role is student
    if (role === 'student') {
      const {
        rollNumber,
        branch,
        cgpa,
        phone,
        batch,
        skills = []
      } = studentData;

      // Validate required student fields
      if (!rollNumber || !branch || !cgpa || !phone || !batch) {
        await User.findByIdAndDelete(user._id); // Cleanup user if student data is invalid
        return res.status(400).json({
          success: false,
          message: 'All student fields (rollNumber, branch, cgpa, phone, batch) are required'
        });
      }

      const student = new Student({
        userId: user._id,
        rollNumber: rollNumber.toUpperCase(),
        branch,
        cgpa,
        phone,
        batch,
        skills
      });

      await student.save();
    }

    // Generate tokens
    const tokens = generateTokenPair({ id: user._id });

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       '401':
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      console.log(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`Invalid password attempt for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokens = generateTokenPair({ id: user._id });

    // Update last login
    await user.updateLastLogin();

    // Get full profile based on role
    const fullProfile = await user.getFullProfile();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          profile: fullProfile
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       '200':
 *         description: Token refreshed successfully
 *       '401':
 *         description: Invalid refresh token
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
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

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token or user not found'
      });
    }

    // Generate new access token
    const accessToken = require('../utils/jwt').generateToken({ id: user._id });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized
 */
router.get('/profile', protect, async (req, res) => {
  try {
    // Get full profile based on role
    const fullProfile = await req.user.getFullProfile();

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          companyId: req.user.companyId,
          isActive: req.user.isActive,
          lastLogin: req.user.lastLogin,
          profile: fullProfile
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update authenticated user's profile information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '401':
 *         description: Unauthorized
 */
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number')
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

    const { name, phone, skills } = req.body;
    const updates = {};

    // Update user fields
    if (name) updates.name = name;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    // Update student-specific fields if user is a student
    if (req.user.role === 'student') {
      const studentUpdates = {};
      if (phone) studentUpdates.phone = phone;
      if (skills) studentUpdates.skills = skills;

      if (Object.keys(studentUpdates).length > 0) {
        await Student.findOneAndUpdate(
          { userId: req.user._id },
          studentUpdates,
          { new: true, runValidators: true }
        );
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          companyId: updatedUser.companyId,
          isActive: updatedUser.isActive,
          lastLogin: updatedUser.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout successful
 */
router.post('/logout', protect, (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // The client should remove the tokens from storage
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
