// Test script to verify profanity violation logging system
// Using native fetch (Node.js 18+)

async function testProfanityViolationLogging() {
  console.log('🧪 Testing Profanity Violation Logging System');
  console.log('=' .repeat(50));

  try {
    // Test logging a profanity violation
    const testViolation = {
      user_id: 1, // Assuming user ID 1 exists
      context_type: 'forum_post',
      context_id: 1,
      attempted_content: 'This is a test with bad words like shit and fuck',
      detected_words: ['shit', 'fuck'],
      severity: 'medium'
    };

    console.log('📝 Logging test violation...');
    const logResponse = await fetch('https://api.cictpeerlearninghub.com/api/profanity-violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testViolation)
    });

    const logResult = await logResponse.json();
    console.log('✅ Log Response:', logResult);

    if (logResult.success) {
      console.log(`✅ Successfully logged violation with ID: ${logResult.violation_id}`);
      
      // Test getting user violations
      console.log('\n📊 Fetching user violations...');
      const getUserResponse = await fetch(`https://api.cictpeerlearninghub.com/api/profanity-violations/user/1`);
      const userResult = await getUserResponse.json();
      console.log('✅ User Violations:', userResult);

      // Test getting violation count
      console.log('\n🔢 Getting violation count...');
      const countResponse = await fetch(`https://api.cictpeerlearninghub.com/api/profanity-violations/user/1/count`);
      const countResult = await countResponse.json();
      console.log('✅ Violation Count:', countResult);

    } else {
      console.error('❌ Failed to log violation:', logResult);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProfanityViolationLogging();