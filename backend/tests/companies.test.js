const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Company = require('../models/Company');
const RecruitmentRound = require('../models/RecruitmentRound');

describe('Company Routes', () => {
  let adminToken;
  let recruiterToken;
  let testAdmin;
  let testRecruiter;
  let testCompany;

  beforeEach(async () => {
    // Create admin user
    testAdmin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    await testAdmin.save();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.data.accessToken;

    // Create test company first
    testCompany = new Company({
      name: 'Test Company',
      description: 'Test Description',
      industry: 'Information Technology',
      location: 'Test Location',
      packageOffered: '10 LPA',
      totalPositions: 10,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: testAdmin._id
    });
    await testCompany.save();

    // Create recruiter user
    testRecruiter = new User({
      name: 'Recruiter User',
      email: 'recruiter@test.com',
      password: 'password123',
      role: 'recruiter',
      companyId: testCompany._id
    });
    await testRecruiter.save();

    const recruiterLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter@test.com', password: 'password123' });
    recruiterToken = recruiterLogin.body.data.accessToken;
  });

  describe('GET /api/companies', () => {
    it('should get all companies publicly', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companies).toHaveLength(1);
      expect(response.body.data.companies[0].name).toBe('Test Company');
    });

    it('should filter companies by status', async () => {
      const response = await request(app)
        .get('/api/companies?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companies).toHaveLength(1);
    });

    it('should search companies by name', async () => {
      const response = await request(app)
        .get('/api/companies?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companies).toHaveLength(1);
    });
  });

  describe('GET /api/companies/active', () => {
    it('should get active companies', async () => {
      const response = await request(app)
        .get('/api/companies/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companies).toHaveLength(1);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should get company by ID', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.name).toBe('Test Company');
      expect(response.body.data.company.applicationStats).toBeDefined();
    });

    it('should return error for non-existent company', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/companies/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/companies', () => {
    it('should create new company for admin', async () => {
      const companyData = {
        name: 'New Company',
        description: 'New Description',
        industry: 'Software Development',
        location: 'New Location',
        packageOffered: '12 LPA',
        totalPositions: 15,
        applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: ['Requirement 1', 'Requirement 2'],
        skills: ['JavaScript', 'React']
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.name).toBe('New Company');
    });

    it('should return error for duplicate company name', async () => {
      const companyData = {
        name: 'Test Company', // Same name
        description: 'Duplicate Description',
        industry: 'Consulting',
        location: 'Duplicate Location',
        packageOffered: '8 LPA',
        totalPositions: 5,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(companyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return error for non-admin user', async () => {
      const companyData = {
        name: 'Unauthorized Company',
        description: 'Description',
        industry: 'Other',
        location: 'Location',
        packageOffered: '5 LPA',
        totalPositions: 5,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(companyData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update company for admin', async () => {
      const updateData = {
        name: 'Updated Company Name',
        totalPositions: 20
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow recruiter to update their own company', async () => {
      const updateData = {
        description: 'Updated by recruiter'
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return error for invalid company ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/companies/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should delete company for admin', async () => {
      const response = await request(app)
        .delete(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return error for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/companies/:id/rounds', () => {
    it('should create recruitment round for admin', async () => {
      const roundData = {
        name: 'Technical Interview',
        description: 'Technical skills assessment',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        roundNumber: 1,
        duration: '1 hour',
        location: 'Online'
      };

      const response = await request(app)
        .post(`/api/companies/${testCompany._id}/rounds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roundData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.round.name).toBe('Technical Interview');
    });

    it('should allow recruiter to create round for their company', async () => {
      const roundData = {
        name: 'HR Interview',
        description: 'Final interview round',
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        roundNumber: 2
      };

      const response = await request(app)
        .post(`/api/companies/${testCompany._id}/rounds`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(roundData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return error for duplicate round number', async () => {
      const roundData = {
        name: 'Duplicate Round',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        roundNumber: 1 // Same number as default round
      };

      const response = await request(app)
        .post(`/api/companies/${testCompany._id}/rounds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/companies/:id/rounds', () => {
    it('should get recruitment rounds for admin', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany._id}/rounds`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rounds).toBeDefined();
    });

    it('should allow recruiter to get their company rounds', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany._id}/rounds`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/companies/search', () => {
    it('should search companies', async () => {
      const response = await request(app)
        .get('/api/companies/search?q=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companies).toHaveLength(1);
    });

    it('should return error for empty search query', async () => {
      const response = await request(app)
        .get('/api/companies/search?q=')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/companies/stats', () => {
    it('should get company statistics for admin', async () => {
      const response = await request(app)
        .get('/api/companies/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCompanies).toBe(1);
      expect(response.body.data.activeCompanies).toBe(1);
    });

    it('should return error for non-admin user', async () => {
      const response = await request(app)
        .get('/api/companies/stats')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});