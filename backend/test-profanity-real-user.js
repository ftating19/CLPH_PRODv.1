// Test script to find existing users and test profanity violation logging
const db = require('./dbconnection/mysql');

async function testWithRealUser() {
  console.log('🔍 Finding existing users...');
  
  try {
    // Connect to database first
    await db.connect();
    const pool = await db.getPool();
    
    // Get first user from database
    const [userRows] = await pool.query('SELECT user_id, email, first_name, last_name FROM users LIMIT 1');
    
    if (userRows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const user = userRows[0];
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (ID: ${user.user_id})`);
    
    // Test logging a profanity violation with real user
    const testViolation = {
      user_id: user.user_id,
      context_type: 'forum_post',
      context_id: null,
      attempted_content: 'This is a test with bad words like shit and fuck',
      detected_words: ['shit', 'fuck'],
      severity: 'medium'
    };

    console.log('\n📝 Testing profanity violation logging...');
    const response = await fetch('http://localhost:4000/api/profanity-violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testViolation)
    });

    const result = await response.json();
    console.log('✅ API Response:', result);

    if (result.success) {
      console.log(`✅ Successfully logged violation with ID: ${result.violation_id}`);
      
      // Test getting user violations
      console.log('\n📊 Fetching user violations...');
      const getUserResponse = await fetch(`http://localhost:4000/api/profanity-violations/user/${user.user_id}`);
      const userResult = await getUserResponse.json();
      console.log('✅ User Violations Response:', userResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWithRealUser();