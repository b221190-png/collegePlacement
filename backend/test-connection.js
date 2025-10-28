const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server');

// Test the MongoDB connection and basic API functionality
async function runTests() {
  console.log('🚀 Starting Backend Tests...\n');

  try {
    // Test 1: Check MongoDB connection
    console.log('1. Testing MongoDB connection...');

    // Wait for connection to be established
    let attempts = 0;
    const maxAttempts = 10;
    while (mongoose.connection.readyState !== 1 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connected successfully\n');
    } else {
      console.log('❌ MongoDB not connected after waiting\n');
      console.log('   Connection state:', mongoose.connection.readyState);
      return;
    }

    // Test 2: Health endpoint
    console.log('2. Testing health endpoint...');
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200);
    console.log('✅ Health endpoint working:', healthResponse.body.message);
    console.log('   Response:', JSON.stringify(healthResponse.body, null, 2));
    console.log();

    // Test 3: User registration
    console.log('3. Testing user registration...');
    const userData = {
      name: 'Test Student',
      email: `test${Date.now()}@student.com`, // Unique email
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
      .send(userData)
      .expect(201);

    console.log('✅ User registration successful');
    console.log('   User registered:', registerResponse.body.data.user.name);
    console.log('   Role:', registerResponse.body.data.user.role);
    console.log();

    // Test 4: User login
    console.log('4. Testing user login...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'password123'
      })
      .expect(200);

    console.log('✅ User login successful');
    console.log('   Access token received:', !!loginResponse.body.data.accessToken);
    console.log('   Refresh token received:', !!loginResponse.body.data.refreshToken);
    console.log();

    // Test 5: Get user profile
    console.log('5. Testing profile access...');
    const token = loginResponse.body.data.accessToken;
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    console.log('✅ Profile access successful');
    console.log('   User profile:', profileResponse.body.data.user.name);
    console.log();

    // Test 6: Create a company (admin)
    console.log('6. Testing company creation...');

    // First create an admin user
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

    console.log('✅ Company creation successful');
    console.log('   Company:', companyResponse.body.data.company.name);
    console.log();

    // Test 7: Get companies
    console.log('7. Testing get companies endpoint...');
    const companiesResponse = await request(app)
      .get('/api/companies')
      .expect(200);

    console.log('✅ Get companies successful');
    console.log('   Companies found:', companiesResponse.body.data.companies.length);
    console.log();

    console.log('🎉 All tests passed! Backend is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📝 Database connection closed');
    }
  }
}

// Run the tests
runTests().catch(console.error);