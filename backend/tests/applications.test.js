const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const ApplicationWindow = require('../models/ApplicationWindow');

describe('Application Routes', () => {
  let adminToken;
  let recruiterToken;
  let studentToken;
  let testStudent;
  let testCompany;
  let testWindow;
  let testApplication;

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

    // Create test company
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

    // Create recruiter for the company
    const recruiter = new User({
      name: 'Recruiter User',
      email: 'recruiter@test.com',
      password: 'password123',
      role: 'recruiter',
      companyId: testCompany._id
    });
    await recruiter.save();

    const recruiterLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter@test.com', password: 'password123' });
    recruiterToken = recruiterLogin.body.data.accessToken;

    // Create application window
    testWindow = new ApplicationWindow({
      companyId: testCompany._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '17:00',
      minCGPA: 7.0,
      eligibleBranches: ['Computer Science'],
      passingYear: 2024,
      createdBy: admin._id
    });
    await testWindow.save();

    // Create test application
    testApplication = new Application({
      studentId: testStudent._id,
      companyId: testCompany._id,
      formData: {
        personalInfo: {
          name: 'Student User',
          email: 'student@test.com',
          phone: '9876543210'
        },
        academicInfo: {
          tenthPercentage: 90,
          twelfthPercentage: 85,
          graduationCGPA: 8.5
        },
        skills: ['JavaScript', 'React']
      }
    });
    await testApplication.save();
  });

  describe('GET /api/applications', () => {
    it('should get all applications for admin', async () => {
      const response = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });

    it('should get company applications for recruiter', async () => {
      const response = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });

    it('should return error for student accessing applications', async () => {
      const response = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter applications by status', async () => {
      const response = await request(app)
        .get('/api/applications?status=submitted')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });
  });

  describe('GET /api/applications/:id', () => {
    it('should get application by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/applications/${testApplication._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application._id).toBe(testApplication._id.toString());
    });

    it('should allow student to get their own application', async () => {
      const response = await request(app)
        .get(`/api/applications/${testApplication._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow recruiter to get company application', async () => {
      const response = await request(app)
        .get(`/api/applications/${testApplication._id}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return error for non-existent application', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/applications/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/applications', () => {
    it('should submit new application for student', async () => {
      // Create a new company for this test
      const newCompany = new Company({
        name: 'New Company',
        description: 'New Description',
        industry: 'Software Development',
        location: 'New Location',
        packageOffered: '12 LPA',
        totalPositions: 5,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: admin._id
      });
      await newCompany.save();

      const applicationData = {
        companyId: newCompany._id,
        formData: {
          personalInfo: {
            name: 'Student User',
            email: 'student@test.com',
            phone: '9876543210'
          },
          academicInfo: {
            tenthPercentage: 90,
            twelfthPercentage: 85,
            graduationCGPA: 8.5
          },
          skills: ['JavaScript', 'React']
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.companyId).toBe(newCompany._id.toString());
    });

    it('should return error for duplicate application', async () => {
      const applicationData = {
        companyId: testCompany._id,
        formData: {
          personalInfo: {
            name: 'Student User',
            email: 'student@test.com'
          }
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already applied');
    });

    it('should return error for non-student user', async () => {
      const applicationData = {
        companyId: testCompany._id,
        formData: {
          personalInfo: { name: 'Test User' }
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(applicationData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/applications/:id/status', () => {
    it('should update application status for admin', async () => {
      const updateData = {
        status: 'under-review',
        notes: 'Application under review'
      };

      const response = await request(app)
        .put(`/api/applications/${testApplication._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.status).toBe('under-review');
    });

    it('should allow recruiter to update application status', async () => {
      const updateData = {
        status: 'shortlisted',
        notes: 'Good candidate'
      };

      const response = await request(app)
        .put(`/api/applications/${testApplication._id}/status`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.status).toBe('shortlisted');
    });

    it('should return error for student updating status', async () => {
      const updateData = {
        status: 'shortlisted'
      };

      const response = await request(app)
        .put(`/api/applications/${testApplication._id}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/applications/:id/score', () => {
    it('should update application score for admin', async () => {
      const updateData = {
        score: 85,
        notes: 'Good performance'
      };

      const response = await request(app)
        .put(`/api/applications/${testApplication._id}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.score).toBe(85);
    });

    it('should allow recruiter to update application score', async () => {
      const updateData = {
        score: 90
      };

      const response = await request(app)
        .put(`/api/applications/${testApplication._id}/score`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.score).toBe(90);
    });

    it('should return error for invalid score', async () => {
      const updateData = {
        score: 150 // Invalid score > 100
      };

      const response = await request(app)
        .put(`/api/applications/${testApplication._id}/score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/applications/bulk-update', () => {
    it('should bulk update applications for admin', async () => {
      // Create another application
      const student2User = new User({
        name: 'Student 2',
        email: 'student2@test.com',
        password: 'password123',
        role: 'student'
      });
      await student2User.save();

      const student2 = new Student({
        userId: student2User._id,
        rollNumber: 'ST002',
        branch: 'Computer Science',
        cgpa: 8.0,
        phone: '9876543211',
        batch: 2024
      });
      await student2.save();

      const application2 = new Application({
        studentId: student2._id,
        companyId: testCompany._id,
        formData: { personalInfo: { name: 'Student 2' } }
      });
      await application2.save();

      const bulkData = {
        applicationIds: [testApplication._id, application2._id],
        status: 'under-review',
        notes: 'Bulk update'
      };

      const response = await request(app)
        .post('/api/applications/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 applications');
    });

    it('should allow recruiter to bulk update company applications', async () => {
      const bulkData = {
        applicationIds: [testApplication._id],
        status: 'rejected'
      };

      const response = await request(app)
        .post('/api/applications/bulk-update')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return error for empty application IDs', async () => {
      const bulkData = {
        applicationIds: [],
        status: 'under-review'
      };

      const response = await request(app)
        .post('/api/applications/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/applications/student/:studentId', () => {
    it('should get applications for student', async () => {
      const response = await request(app)
        .get(`/api/applications/student/${testStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });

    it('should allow admin to get student applications', async () => {
      const response = await request(app)
        .get(`/api/applications/student/${testStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });

    it('should prevent student from accessing other student applications', async () => {
      const student2User = new User({
        name: 'Student 2',
        email: 'student2@test.com',
        password: 'password123',
        role: 'student'
      });
      await student2User.save();

      const student2 = new Student({
        userId: student2User._id,
        rollNumber: 'ST002',
        branch: 'Computer Science',
        cgpa: 8.0,
        phone: '9876543211',
        batch: 2024
      });
      await student2.save();

      const student2Login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student2@test.com', password: 'password123' });
      const student2Token = student2Login.body.data.accessToken;

      const response = await request(app)
        .get(`/api/applications/student/${testStudent._id}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/applications/company/:companyId', () => {
    it('should get applications for company', async () => {
      const response = await request(app)
        .get(`/api/applications/company/${testCompany._id}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });

    it('should allow admin to get company applications', async () => {
      const response = await request(app)
        .get(`/api/applications/company/${testCompany._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
    });
  });

  describe('GET /api/applications/stats', () => {
    it('should get application statistics for admin', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should get application statistics for recruiter', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return error for student accessing stats', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});