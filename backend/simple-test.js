// Simple test to check if backend is running
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test a simple endpoint first
    const response = await axios.get('http://localhost:4000/api/tutor-pre-assessments');
    console.log('✅ Backend connection successful');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Backend connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testConnection();