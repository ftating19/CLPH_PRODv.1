// Test script for tutor applications API endpoint
const axios = require('axios');

const BASE_URL = 'https://api.cictpeerlearninghub.com/api';

async function testTutorApplicationsAPI() {
  console.log('🧪 Testing Tutor Applications API...\n');

  try {
    // Test 1: Get pending tutor applications
    console.log('1️⃣ Testing GET pending tutor applications...');
    const response = await axios.get(`${BASE_URL}/tutor-applications?status=pending`);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`✅ Found ${response.data.length} pending applications`);
      
      // Check if assessment data is included
      if (response.data.length > 0) {
        const firstApp = response.data[0];
        console.log('\nFirst application structure:');
        console.log('Has assessment_score:', firstApp.assessment_score !== undefined);
        console.log('Has assessment_percentage:', firstApp.assessment_percentage !== undefined);
        console.log('Has assessment_passed:', firstApp.assessment_passed !== undefined);
        console.log('Assessment score:', firstApp.assessment_score);
        console.log('Assessment percentage:', firstApp.assessment_percentage);
        console.log('Assessment passed:', firstApp.assessment_passed);
      }
    } else {
      console.log('❌ Unexpected response format');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n📝 Endpoint not found - API route may not be implemented');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n📝 Make sure the backend server is running on port 4000');
    }
  }
}

// Run test
testTutorApplicationsAPI();