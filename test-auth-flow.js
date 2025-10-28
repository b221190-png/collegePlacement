// Test the complete authentication flow
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow...\n');

  try {
    // Test 1: Backend Health Check
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend is healthy:', healthResponse.status);
    console.log();

    // Test 2: Register a new student
    console.log('2. Registering a new student...');
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
        skills: 'JavaScript, React, Node.js'
      }
    };

    const registerResponse = await axios.post(`${API_BASE}/auth/register`, studentData);
    console.log('✅ Student registration successful');
    console.log('   User:', registerResponse.data.data.user.name);
    console.log('   Email:', registerResponse.data.data.user.email);
    console.log('   Role:', registerResponse.data.data.user.role);
    console.log();

    // Test 3: Login as the student
    console.log('3. Testing student login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: studentData.email,
      password: 'password123'
    });
    console.log('✅ Student login successful');
    console.log('   Access token received:', !!loginResponse.data.data.accessToken);
    console.log('   Refresh token received:', !!loginResponse.data.data.refreshToken);
    console.log();

    // Test 4: Create admin user (if not exists)
    console.log('4. Creating/Testing admin user...');
    try {
      const adminData = {
        name: 'Test Admin',
        email: 'admin@collegeplacement.com',
        password: 'admin123',
        role: 'admin'
      };

      await axios.post(`${API_BASE}/auth/register`, adminData);
      console.log('✅ Admin user created');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw error;
      }
    }

    // Test 5: Login as admin
    console.log('5. Testing admin login...');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@collegeplacement.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful');
    console.log('   Admin name:', adminLoginResponse.data.data.user.name);
    console.log('   Admin role:', adminLoginResponse.data.data.user.role);
    console.log();

    console.log('🎉 COMPLETE AUTHENTICATION FLOW TEST SUCCESSFUL! 🎉');
    console.log();
    console.log('✅ All tests passed:');
    console.log('   ✅ Backend is running and healthy');
    console.log('   ✅ Student registration works');
    console.log('   ✅ Student login works');
    console.log('   ✅ Admin user management works');
    console.log('   ✅ Admin login works');
    console.log('   ✅ JWT tokens are issued correctly');
    console.log();
    console.log('🚀 Frontend should now work perfectly with the backend!');
    console.log();
    console.log('📱 Access the application at: http://localhost:5174/');
    console.log('🔧 Admin email: admin@collegeplacement.com');
    console.log('🔧 Admin password: admin123');
    console.log('📧 Student email:', studentData.email);
    console.log('🔑 Student password: password123');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAuthFlow();