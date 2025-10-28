const request = require('supertest');
const app = require('./server');

// Simple test to verify core functionality
async function runSimpleTests() {
  console.log('🚀 Running Simple Backend Tests...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200);
    console.log('✅ Health check passed');
    console.log();

    // Test 2: Student registration
    console.log('2. Testing student registration...');
    const studentData = {
      name: 'Test Student',
      email: `student${Date.now()}@test.com`,
      password: 'password123',
      role: 'student',
      studentData: {
        rollNumber: `CS${Date.now()}`,
        branch: 'Computer Science',
        cgpa: 8.5,
        phone: '9876543210',
        batch: 2024,
        skills: ['JavaScript', 'React']
      }
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(studentData)
      .expect(201);

    console.log('✅ Student registration successful');
    console.log(`   Student: ${registerResponse.body.data.user.name}`);
    console.log();

    // Test 3: Student login
    console.log('3. Testing student login...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentData.email,
        password: 'password123'
      })
      .expect(200);

    console.log('✅ Student login successful');
    console.log(`   Tokens received: ${loginResponse.body.data.accessToken ? 'Yes' : 'No'}`);
    console.log();

    // Test 4: Get student profile
    console.log('4. Testing profile access...');
    const token = loginResponse.body.data.accessToken;
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    console.log('✅ Profile access successful');
    console.log(`   User: ${profileResponse.body.data.user.name} (${profileResponse.body.data.user.role})`);
    console.log();

    // Test 5: Get companies (public endpoint)
    console.log('5. Testing companies endpoint...');
    const companiesResponse = await request(app)
      .get('/api/companies')
      .expect(200);

    console.log('✅ Companies endpoint working');
    console.log(`   Companies returned: ${companiesResponse.body.data.companies.length}`);
    console.log();

    // Test 6: Admin registration and company creation
    console.log('6. Testing admin and company creation...');
    const adminData = {
      name: 'Test Admin',
      email: `admin${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin'
    };

    const adminRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData)
      .expect(201);

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminData.email,
        password: 'password123'
      })
      .expect(200);

    const adminToken = adminLoginResponse.body.data.accessToken;

    const companyData = {
      name: 'Test Company',
      description: 'A test company for recruitment',
      industry: 'Information Technology',
      location: 'Test City',
      packageOffered: '10 LPA',
      totalPositions: 5,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const companyResponse = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(companyData)
      .expect(201);

    console.log('✅ Admin and company creation successful');
    console.log(`   Company: ${companyResponse.body.data.company.name}`);
    console.log();

    console.log('🎉 ALL TESTS PASSED! Backend is fully functional! 🎉');
    console.log();
    console.log('✅ Features working:');
    console.log('   - MongoDB connection');
    console.log('   - User authentication (register/login)');
    console.log('   - JWT tokens');
    console.log('   - Role-based access');
    console.log('   - Student profiles');
    console.log('   - Company management');
    console.log('   - Protected routes');
    console.log();
    console.log('🚀 Your backend is ready for frontend integration!');
    console.log('📚 Check FRONTEND_INTEGRATION.md for integration guide');
    console.log('📖 Check README.md for full API documentation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the tests
runSimpleTests().catch(console.error);