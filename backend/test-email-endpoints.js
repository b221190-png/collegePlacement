const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials (you'll need to update these after login)
let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@collegeplacement.com',
      password: 'admin123'
    });

    authToken = response.data.data.accessToken;
    console.log('✅ Login successful');
    return response.data.data.accessToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testEmailConfiguration() {
  try {
    const response = await axios.get(`${BASE_URL}/api/email/test-configuration`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Email configuration test:', response.data.message);
    console.log('   Environment:', response.data.data.environment);
    console.log('   Email Provider:', response.data.data.emailProvider);
    console.log('   Configured:', response.data.data.configured);
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.response?.data?.message || error.message);
  }
}

async function testPreviewEligible() {
  try {
    // First get a list of companies to use a real company ID
    const companiesResponse = await axios.get(`${BASE_URL}/api/companies`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (companiesResponse.data.data.companies.length === 0) {
      console.log('⚠️  No companies found. Please create a company first.');
      return;
    }

    const companyId = companiesResponse.data.data.companies[0]._id;
    console.log(`📧 Testing preview eligible for company: ${companiesResponse.data.data.companies[0].name}`);

    const response = await axios.post(`${BASE_URL}/api/email/preview-eligible`, {
      companyId: companyId,
      filters: {
        batch: '2024'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Preview eligible test successful');
    console.log(`   Total eligible students: ${response.data.data.total}`);

    if (response.data.data.statistics) {
      console.log('   Statistics by branch:', response.data.data.statistics.byBranch);
      console.log('   Statistics by batch:', response.data.data.statistics.byBatch);
    }
  } catch (error) {
    console.error('❌ Preview eligible test failed:', error.response?.data?.message || error.message);
  }
}

async function testDryRunEmail() {
  try {
    // Get a company for testing
    const companiesResponse = await axios.get(`${BASE_URL}/api/companies`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (companiesResponse.data.data.companies.length === 0) {
      console.log('⚠️  No companies found. Please create a company first.');
      return;
    }

    const companyId = companiesResponse.data.data.companies[0]._id;
    console.log(`📧 Testing dry run email for company: ${companiesResponse.data.data.companies[0].name}`);

    const response = await axios.post(`${BASE_URL}/api/email/send-to-eligible`, {
      companyId: companyId,
      dryRun: true,
      customMessage: 'This is a test message for the dry run.',
      subject: '🧪 Test Email - Dry Run'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Dry run email test successful');
    console.log(`   Total students processed: ${response.data.data.total}`);
    console.log(`   This was a dry run - no emails were sent.`);
  } catch (error) {
    console.error('❌ Dry run email test failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  console.log('🚀 Testing Email Endpoints...\n');

  // Step 1: Login to get auth token
  const token = await login();
  if (!token) {
    console.log('❌ Cannot proceed without authentication. Exiting...');
    return;
  }

  console.log('\n');

  // Step 2: Test email configuration
  await testEmailConfiguration();
  console.log('\n');

  // Step 3: Test preview eligible
  await testPreviewEligible();
  console.log('\n');

  // Step 4: Test dry run email
  await testDryRunEmail();
  console.log('\n');

  console.log('✅ Email endpoint tests completed!');
  console.log('\n📋 Summary of Email Endpoints Created:');
  console.log('   1. POST /api/email/send-to-eligible - Send emails to eligible students');
  console.log('   2. POST /api/email/preview-eligible - Preview eligible students');
  console.log('   3. GET /api/email/test-configuration - Test email configuration');
  console.log('\n🎯 Features:');
  console.log('   • Intelligent eligibility checking');
  console.log('   • Professional HTML email templates');
  console.log('   • Batch email processing');
  console.log('   • Custom messaging support');
  console.log('   • Dry run capability');
  console.log('   • Detailed error tracking');
  console.log('   • Automatic student notifications');
}

// Run the tests
main().catch(console.error);