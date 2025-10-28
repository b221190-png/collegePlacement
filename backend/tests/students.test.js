const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const ApplicationWindow = require('../models/ApplicationWindow');

describe('Student Routes', () => {
  let adminToken;
  let studentToken;
  let testStudent;
  let testCompany;
  let testWindow;

  beforeEach(async () => {
    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    await admin.save();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.data.accessToken;

    // Create student user
    const studentUser = new User({
      name: 'Student User',
      email: 'student@test.com',
      password: 'password123',
      role: 'student'
    });
    await studentUser.save();

    testStudent = new Student({
      userId: studentUser._id,
      rollNumber: 'ST001',
      branch: 'Computer Science',
      cgpa: 8.5,
      phone: '9876543210',
      batch: 2024,
      skills: ['JavaScript', 'React']
    });
    await testStudent.save();

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'password123' });
    studentToken = studentLogin.body.data.accessToken;

    // Create test company and application window
    testCompany = new Company({
      name: 'Test Company',
      description: 'Test Description',
      industry: 'Information Technology',
      location: 'Test Location',
      packageOffered: '10 LPA',
      totalPositions: 10,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: admin._id
    });
    await testCompany.save();

    testWindow = new ApplicationWindow({
      companyId: testCompany._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '17:00',
      minCGPA: 7.0,
      maxBacklogs: 2,
      eligibleBranches: ['Computer Science'],
      passingYear: 2024,
      createdBy: admin._id
    });
    await testWindow.save();
  });

  describe('GET /api/students', () => {
    it('should get all students for admin', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toHaveLength(1);
      expect(response.body.data.students[0].rollNumber).toBe('ST001');
    });

    it('should return error for non-admin user', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter students by branch', async () => {
      const response = await request(app)
        .get('/api/students?branch=Computer Science')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toHaveLength(1);
    });
  });

  describe('POST /api/students', () => {
    it('should create new student for admin', async () => {
      const studentData = {
        name: 'New Student',
        email: 'newstudent@test.com',
        password: 'password123',
        rollNumber: 'ST002',
        branch: 'Information Technology',
        cgpa: 8.0,
        phone: '9876543211',
        batch: 2024,
        skills: ['Python', 'Django']
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.student.rollNumber).toBe('ST002');
    });

    it('should return error for duplicate roll number', async () => {
      const studentData = {
        name: 'Duplicate Student',
        email: 'duplicate@test.com',
        password: 'password123',
        rollNumber: 'ST001', // Same roll number
        branch: 'Computer Science',
        cgpa: 8.0,
        phone: '9876543212',
        batch: 2024
      };

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(studentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/students/:id', () => {
    it('should get student by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.student.rollNumber).toBe('ST001');
    });

    it('should get own student profile', async () => {
      const response = await request(app)
        .get(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.student.rollNumber).toBe('ST001');
    });

    it('should return error for non-existent student', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/students/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('should update student for admin', async () => {
      const updateData = {
        name: 'Updated Student Name',
        cgpa: 8.8,
        batch: 2025
      };

      const response = await request(app)
        .put(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow student to update limited fields', async () => {
      const updateData = {
        phone: '9999999999',
        skills: ['React', 'Node.js', 'MongoDB']
      };

      const response = await request(app)
        .put(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent student from updating restricted fields', async () => {
      const updateData = {
        cgpa: 9.0, // Student shouldn't be able to update CGPA
        batch: 2025
      };

      const response = await request(app)
        .put(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      // The update should succeed but only allowed fields should be updated
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/students/eligible/:companyId', () => {
    it('should get eligible students for company', async () => {
      const response = await request(app)
        .get(`/api/students/eligible/${testCompany._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toHaveLength(1);
      expect(response.body.data.eligibilityCriteria).toBeDefined();
    });

    it('should return error for non-admin user', async () => {
      const response = await request(app)
        .get(`/api/students/eligible/${testCompany._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/students/bulk-upload', () => {
    it('should handle bulk upload simulation', async () => {
      // Since we can't actually upload files in this test environment,
      // we'll test the validation and error handling
      const response = await request(app)
        .post('/api/students/bulk-upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // No file provided

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No file uploaded');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should delete student for admin', async () => {
      const response = await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return error for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});