const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing post-tests API...');
    
    const response = await fetch('http://localhost:4000/api/post-tests?booking_id=51&status=published');
    const data = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.postTests && data.postTests.length > 0) {
      console.log('\n✅ API is working correctly');
      console.log('Post-test found with ID:', data.postTests[0].id);
    } else {
      console.log('\n❌ API returned no post-tests');
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();