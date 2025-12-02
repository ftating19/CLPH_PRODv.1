// Simple test to check API response
const axios = require('axios');

async function checkAPI() {
  try {
    const response = await axios.get('http://localhost:4000/api/tutor-applications?status=pending');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.applications && response.data.applications.length > 0) {
      const firstApp = response.data.applications[0];
      console.log('\nAssessment fields check:');
      console.log('assessment_result_id:', firstApp.assessment_result_id);
      console.log('assessment_score:', firstApp.assessment_score);
      console.log('assessment_percentage:', firstApp.assessment_percentage);
      console.log('assessment_passed:', firstApp.assessment_passed);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAPI();