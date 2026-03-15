const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const emailService = require('../utils/emailService');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

const router = express.Router();
const GOOGLE_SCOPES = ['openid', 'email', 'profile'];
const ALLOWED_GOOGLE_ROLES = ['admin', 'recruiter', 'student'];
const hasRequiredValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== '';
const hasAtMostTwoDecimals = (value) => {
  const [, decimalPart = ''] = String(value).split('.');
  return decimalPart.length <= 2;
};

const getGoogleRedirectBase = () =>
  process.env.GOOGLE_REDIRECT_FRONTEND_URL ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

const resolveFrontendOrigin = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return getGoogleRedirectBase();
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return getGoogleRedirectBase();
    }
    return parsed.origin;
  } catch {
    return getGoogleRedirectBase();
  }
};

const toFrontendErrorRedirect = (frontendOrigin, message) => {
  const redirectBase = resolveFrontendOrigin(frontendOrigin);
  const url = new URL('/auth', redirectBase);
  url.searchParams.set('googleError', message);
  return url.toString();
};

const serializeUser = (user, fullProfile) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId,
  isActive: user.isActive,
  mustChangePassword: Boolean(user.mustChangePassword),
  lastLogin: user.lastLogin,
  profile: fullProfile
});

const buildSerializedAuthPayload = (user, tokens, fullProfile) =>
  Buffer.from(JSON.stringify({
    user: serializeUser(user, fullProfile),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  })).toString('base64url');

const parseGoogleState = (encodedState) => {
  if (!encodedState) {
    return {};
  }

  try {
    return JSON.parse(Buffer.from(encodedState, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
};

const exchangeGoogleCodeForProfile = async (code) => {
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange Google authorization code');
  }

  const tokenPayload = await tokenResponse.json();
  const accessToken = tokenPayload.access_token;

  if (!accessToken) {
    throw new Error('Google access token missing from token response');
  }

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  return profileResponse.json();
};

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
    .withMessage('Student data is required for student role'),
  body('studentData.rollNumber')
    .if(body('role').equals('student'))
    .trim()
    .notEmpty()
    .withMessage('Roll number is required'),
  body('studentData.branch')
    .if(body('role').equals('student'))
    .isIn(['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Other'])
    .withMessage('Invalid branch'),
  body('studentData.cgpa')
    .if(body('role').equals('student'))
    .custom(hasRequiredValue)
    .withMessage('CGPA is required')
    .bail()
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10')
    .bail()
    .custom(hasAtMostTwoDecimals)
    .withMessage('CGPA can have at most 2 decimal places'),
  body('studentData.tenthPercentage')
    .if(body('role').equals('student'))
    .custom(hasRequiredValue)
    .withMessage('10th percentage is required')
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage('10th percentage must be between 0 and 100'),
  body('studentData.twelfthPercentage')
    .if(body('role').equals('student'))
    .custom(hasRequiredValue)
    .withMessage('12th percentage is required')
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage('12th percentage must be between 0 and 100'),
  body('studentData.phone')
    .if(body('role').equals('student'))
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number'),
  body('studentData.batch')
    .if(body('role').equals('student'))
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Batch must be a valid year between 2000 and 2030'),
  body('studentData.backlogs')
    .if(body('role').equals('student'))
    .custom(hasRequiredValue)
    .withMessage('Backlogs are required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('Backlogs must be a non-negative number')
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

    if (role === 'student') {
      const {
        rollNumber,
        branch,
        cgpa,
        tenthPercentage,
        twelfthPercentage,
        phone,
        batch,
        backlogs
      } = studentData || {};

      if (
        !hasRequiredValue(rollNumber) ||
        !hasRequiredValue(branch) ||
        !hasRequiredValue(cgpa) ||
        !hasRequiredValue(tenthPercentage) ||
        !hasRequiredValue(twelfthPercentage) ||
        !hasRequiredValue(phone) ||
        !hasRequiredValue(batch) ||
        !hasRequiredValue(backlogs)
      ) {
        return res.status(400).json({
          success: false,
          message: 'All student fields (rollNumber, branch, cgpa, tenthPercentage, twelfthPercentage, phone, batch, backlogs) are required'
        });
      }
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
        tenthPercentage,
        twelfthPercentage,
        phone,
        batch,
        backlogs = 0,
        skills = []
      } = studentData;

      const student = new Student({
        userId: user._id,
        rollNumber: rollNumber.toUpperCase(),
        branch,
        cgpa: Number(cgpa),
        tenthPercentage: Number(tenthPercentage),
        twelfthPercentage: Number(twelfthPercentage),
        phone,
        batch,
        skills,
        backlogs: Number(backlogs)
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
        user: serializeUser(user, role === 'student' ? await user.getFullProfile() : undefined),
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
        user: serializeUser(user, fullProfile),
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

// @route   GET /api/auth/google/start
// @desc    Start Google OAuth flow
// @access  Public
router.get('/google/start', async (req, res) => {
  try {
    const role = typeof req.query.role === 'string' ? req.query.role : '';
    const frontendOrigin =
      typeof req.query.frontendOrigin === 'string' ? req.query.frontendOrigin : '';

    if (!ALLOWED_GOOGLE_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'A valid role is required for Google sign in'
      });
    }

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_CALLBACK_URL
    ) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server'
      });
    }

    const state = Buffer.from(JSON.stringify({
      role,
      frontendOrigin: resolveFrontendOrigin(frontendOrigin)
    })).toString('base64url');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Google auth start error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to start Google sign in'
    });
  }
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const state = parseGoogleState(typeof req.query.state === 'string' ? req.query.state : '');
  const selectedRole = typeof state.role === 'string' ? state.role : '';
  const frontendOrigin =
    typeof state.frontendOrigin === 'string'
      ? resolveFrontendOrigin(state.frontendOrigin)
      : getGoogleRedirectBase();

  if (!code || typeof code !== 'string') {
    return res.redirect(toFrontendErrorRedirect(frontendOrigin, 'Missing Google authorization code'));
  }

  try {
    const googleProfile = await exchangeGoogleCodeForProfile(code);
    const email = typeof googleProfile.email === 'string' ? googleProfile.email.toLowerCase() : '';
    const googleId = typeof googleProfile.id === 'string' ? googleProfile.id : '';

    if (!email || !googleId) {
      return res.redirect(toFrontendErrorRedirect(frontendOrigin, 'Unable to read Google account profile'));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect(toFrontendErrorRedirect(
        frontendOrigin,
        'No account exists for this Google email. Use your existing placement account first.'
      ));
    }

    if (selectedRole && user.role !== selectedRole) {
      return res.redirect(toFrontendErrorRedirect(
        frontendOrigin,
        `This Google account is registered as ${user.role}, not ${selectedRole}`
      ));
    }

    if (!user.isActive) {
      return res.redirect(toFrontendErrorRedirect(frontendOrigin, 'Account is deactivated. Please contact administrator.'));
    }

    if (!user.googleId) {
      user.googleId = googleId;
    } else if (user.googleId !== googleId) {
      return res.redirect(toFrontendErrorRedirect(
        frontendOrigin,
        'This Google account is already linked to a different placement profile.'
      ));
    }

    await user.updateLastLogin();
    await user.save();

    const tokens = generateTokenPair({ id: user._id });
    const fullProfile = await user.getFullProfile();
    const serializedPayload = buildSerializedAuthPayload(user, tokens, fullProfile);
    const redirectUrl = new URL('/auth/google/callback', frontendOrigin);
    redirectUrl.hash = `auth=${serializedPayload}`;

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect(toFrontendErrorRedirect(frontendOrigin, 'Google sign in failed. Please try again.'));
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

// @route   POST /api/auth/forgot-password
// @desc    Issue a temporary password for password recovery / first-time access
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email }).select('+password');
    const genericMessage = 'If an account exists with that email, a temporary password has been prepared.';

    if (!user || !user.isActive) {
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    const temporaryPassword = user.generateTemporaryPassword();
    user.password = temporaryPassword;
    user.mustChangePassword = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    const emailResult = await emailService.sendTemporaryPasswordEmail({
      name: user.name,
      email: user.email,
      temporaryPassword,
      role: user.role
    });

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      console.error('Temporary password email failed:', emailResult.error);
      return res.status(502).json({
        success: false,
        message: 'Unable to deliver the temporary password right now. Please try again later.'
      });
    }

    let responseData;
    if (process.env.NODE_ENV !== 'production') {
      responseData = emailResult.success
        ? (emailResult.previewUrl ? { previewUrl: emailResult.previewUrl } : undefined)
        : {
            temporaryPassword,
            previewUrl: emailResult.previewUrl || null,
            emailError: emailResult.error || 'Email delivery failed'
          };
    }

    res.json({
      success: true,
      message: emailResult.success
        ? 'A temporary password has been sent to your email. Sign in with it and set a new password.'
        : 'Temporary password generated. Email delivery is unavailable in this environment, so use the development fallback below.',
      data: responseData
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing forgot password request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using reset token
// @access  Public
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.mustChangePassword = false;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokenPair({ id: user._id });
    const fullProfile = await user.getFullProfile();

    res.json({
      success: true,
      message: 'Password reset successful',
      data: {
        user: serializeUser(user, fullProfile),
        ...tokens
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password after login (used for first-time temporary password flow)
// @access  Private
router.post('/change-password', protect, [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('currentPassword')
    .optional()
    .isString()
    .withMessage('Current password must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      const passwordMatches = await user.comparePassword(currentPassword);
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    const fullProfile = await user.getFullProfile();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        user: serializeUser(user, fullProfile)
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
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
        user: serializeUser(req.user, fullProfile)
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
        user: serializeUser(updatedUser)
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
