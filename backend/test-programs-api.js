// Test programs API endpoint
const axios = require('axios');

async function testProgramsAPI() {
  try {
    console.log('🧪 Testing programs API endpoint...');
    
    const response = await axios.get('http://localhost:4000/api/programs');
    
    if (response.data.success) {
      console.log('✅ Programs API working successfully');
      console.log(`Found ${response.data.total} programs:`);
      response.data.programs.forEach((program, index) => {
        console.log(`  ${index + 1}. ${program}`);
      });
    } else {
      console.log('❌ API returned success: false');
    }
    
  } catch (error) {
    console.error('❌ Error testing programs API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testProgramsAPI();