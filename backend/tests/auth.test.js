const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Student = require('../models/Student');
const emailService = require('../utils/emailService');

const originalFetch = global.fetch;

jest.mock('../utils/emailService', () => ({
  sendTemporaryPasswordEmail: jest.fn(),
}));

describe('Authentication Routes', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5001/api/auth/google/callback';
    emailService.sendTemporaryPasswordEmail.mockResolvedValue({
      success: true,
      previewUrl: 'http://preview.test/message'
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const userData = {
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student',
        studentData: {
          rollNumber: 'CS001',
          branch: 'Computer Science',
          cgpa: 8.5,
          tenthPercentage: 91,
          twelfthPercentage: 88,
          phone: '9876543210',
          batch: 2024,
          backlogs: 0,
          skills: ['JavaScript', 'React']
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('student');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);

      // Verify student profile was created
      const student = await Student.findOne({ userId: user._id });
      expect(student).toBeTruthy();
      expect(student.rollNumber).toBe(userData.studentData.rollNumber);
    });

    it('should register a new admin successfully', async () => {
      const userData = {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should register a new recruiter successfully', async () => {
      // First create a company to reference
      const Company = require('../models/Company');
      const company = new Company({
        name: 'Test Company',
        description: 'Test Description',
        industry: 'Information Technology',
        location: 'Test Location',
        packageOffered: '10 LPA',
        totalPositions: 10,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: new mongoose.Types.ObjectId()
      });
      await company.save();

      const userData = {
        name: 'Test Recruiter',
        email: 'recruiter@test.com',
        password: 'password123',
        role: 'recruiter',
        companyId: company._id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('recruiter');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@test.com',
        password: 'password123',
        role: 'student',
        studentData: {
          rollNumber: 'CS002',
          branch: 'Computer Science',
          cgpa: 8.0,
          tenthPercentage: 90,
          twelfthPercentage: 87,
          phone: '9876543211',
          batch: 2024,
          backlogs: 0
        }
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
    });

    it('should return error for invalid email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'student',
        studentData: {
          rollNumber: 'CS003',
          branch: 'Computer Science',
          cgpa: 8.0,
          tenthPercentage: 90,
          twelfthPercentage: 87,
          phone: '9876543212',
          batch: 2024,
          backlogs: 0
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return error for short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@test.com',
        password: '123',
        role: 'student',
        studentData: {
          rollNumber: 'CS004',
          branch: 'Computer Science',
          cgpa: 8.0,
          tenthPercentage: 90,
          twelfthPercentage: 87,
          phone: '9876543213',
          batch: 2024,
          backlogs: 0
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = new User({
        name: 'Test User',
        email: 'login@test.com',
        password: 'password123',
        role: 'student'
      });
      await testUser.save();

      // Create student profile
      const student = new Student({
        userId: testUser._id,
        rollNumber: 'CS005',
        branch: 'Computer Science',
        cgpa: 8.5,
        tenthPercentage: 90,
        twelfthPercentage: 88,
        phone: '9876543214',
        batch: 2024,
        backlogs: 0
      });
      await student.save();
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.mustChangePassword).toBe(false);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should surface mustChangePassword for first-time accounts', async () => {
      testUser.mustChangePassword = true;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.data.user.mustChangePassword).toBe(true);
    });

    it('should return error for incorrect password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return error for inactive user', async () => {
      // Deactivate the user
      testUser.isActive = false;
      await testUser.save();

      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/auth/google/start', () => {
    it('should redirect to Google OAuth for a valid role', async () => {
      const response = await request(app)
        .get('/api/auth/google/start')
        .query({
          role: 'student',
          frontendOrigin: 'http://localhost:5175'
        })
        .expect(302);

      expect(response.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(response.headers.location).toContain('client_id=test-google-client-id');
      expect(response.headers.location).toContain(
        encodeURIComponent('http://localhost:5001/api/auth/google/callback')
      );
    });

    it('should reject invalid roles', async () => {
      const response = await request(app)
        .get('/api/auth/google/start')
        .query({ role: 'guest' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should authenticate an existing linked email and redirect to frontend callback', async () => {
      const user = new User({
        name: 'Google Student',
        email: 'google.student@test.com',
        password: 'password123',
        role: 'student'
      });
      await user.save();

      const student = new Student({
        userId: user._id,
        rollNumber: 'GOOGLE01',
        branch: 'Computer Science',
        cgpa: 8.2,
        tenthPercentage: 89,
        twelfthPercentage: 86,
        phone: '9876543219',
        batch: 2024,
        backlogs: 0
      });
      await student.save();

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'google-access-token'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'google-user-123',
            email: 'google.student@test.com',
            name: 'Google Student'
          })
        });

      const state = Buffer.from(JSON.stringify({
        role: 'student',
        frontendOrigin: 'http://localhost:5175'
      })).toString('base64url');

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({
          code: 'google-auth-code',
          state
        })
        .expect(302);

      expect(response.headers.location).toContain('http://localhost:5175/auth/google/callback#auth=');

      const refreshedUser = await User.findById(user._id);
      expect(refreshedUser.googleId).toBe('google-user-123');
    });

    it('should redirect back with an error when no account matches the Google email', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'google-access-token'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'google-user-456',
            email: 'missing@test.com',
            name: 'Missing User'
          })
        });

      const state = Buffer.from(JSON.stringify({
        role: 'student',
        frontendOrigin: 'http://localhost:5175'
      })).toString('base64url');

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({
          code: 'google-auth-code',
          state
        })
        .expect(302);

      expect(response.headers.location).toContain('/auth?googleError=');
      const normalizedLocation = decodeURIComponent(
        response.headers.location.replace(/\+/g, ' ')
      );
      expect(normalizedLocation).toContain('No account exists');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;
    let testUser;

    beforeEach(async () => {
      // Create and login a test user
      testUser = new User({
        name: 'Profile Test User',
        email: 'profile@test.com',
        password: 'password123',
        role: 'student'
      });
      await testUser.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile@test.com',
          password: 'password123'
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('profile@test.com');
      expect(response.body.data.user.name).toBe('Profile Test User');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create and login a test user
      const user = new User({
        name: 'Refresh Test User',
        email: 'refresh@test.com',
        password: 'password123',
        role: 'student'
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'password123'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return error with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalidtoken' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return error without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      const user = new User({
        name: 'Forgot Password User',
        email: 'forgot@test.com',
        password: 'password123',
        role: 'student'
      });
      await user.save();
    });

    it('should issue a temporary password for an existing account', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('temporary password has been sent');
      expect(response.body.data?.temporaryPassword).toBeUndefined();
      expect(emailService.sendTemporaryPasswordEmail).toHaveBeenCalled();

      const updatedUser = await User.findOne({ email: 'forgot@test.com' })
        .select('+password');

      expect(updatedUser.mustChangePassword).toBe(true);
      await expect(updatedUser.comparePassword('password123')).resolves.toBe(false);
    });

    it('should return the temporary password in development only when email delivery fails', async () => {
      emailService.sendTemporaryPasswordEmail.mockResolvedValueOnce({
        success: false,
        error: 'SMTP auth failed'
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.temporaryPassword).toBeDefined();
      expect(response.body.data.emailError).toBe('SMTP auth failed');

      const updatedUser = await User.findOne({ email: 'forgot@test.com' })
        .select('+password');

      await expect(
        updatedUser.comparePassword(response.body.data.temporaryPassword)
      ).resolves.toBe(true);
    });

    it('should return success even when account does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'missing@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      const user = new User({
        name: 'Reset Password User',
        email: 'reset@test.com',
        password: 'password123',
        role: 'student'
      });
      await user.save();

      resetToken = user.generatePasswordResetToken();
      await user.save({ validateBeforeSave: false });
    });

    it('should reset password with a valid token', async () => {
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newPassword123'
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.data.accessToken).toBeDefined();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'reset@test.com',
          password: 'newPassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return error for invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      const user = new User({
        name: 'Temporary Password User',
        email: 'temp-pass@test.com',
        password: 'TempPass123',
        role: 'student',
        mustChangePassword: true
      });
      await user.save();

      const student = new Student({
        userId: user._id,
        rollNumber: 'TEMP001',
        branch: 'Computer Science',
        cgpa: 8.1,
        tenthPercentage: 92,
        twelfthPercentage: 90,
        phone: '9876543220',
        batch: 2024,
        backlogs: 0
      });
      await student.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'temp-pass@test.com',
          password: 'TempPass123'
        })
        .expect(200);

      authToken = loginResponse.body.data.accessToken;
    });

    it('should allow a temporary-password user to set a permanent password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPassword: 'Permanent123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.mustChangePassword).toBe(false);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'temp-pass@test.com',
          password: 'Permanent123'
        })
        .expect(200);

      expect(loginResponse.body.data.user.mustChangePassword).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;
    let testUser;

    beforeEach(async () => {
      // Create and login a test user
      testUser = new User({
        name: 'Update Test User',
        email: 'update@test.com',
        password: 'password123',
        role: 'student'
      });
      await testUser.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'update@test.com',
          password: 'password123'
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '9999999999',
        skills: ['Node.js', 'MongoDB']
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
    });

    it('should return error with invalid phone number', async () => {
      const updateData = {
        phone: '123'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
