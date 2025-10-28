const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Student = require('../models/Student');

describe('Authentication Routes', () => {
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
          phone: '9876543210',
          batch: 2024,
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
          phone: '9876543211',
          batch: 2024
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
          phone: '9876543212',
          batch: 2024
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
          phone: '9876543213',
          batch: 2024
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
        phone: '9876543214',
        batch: 2024
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
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
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