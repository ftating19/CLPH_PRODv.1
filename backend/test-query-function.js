// Test the exact query function that the API uses
const db = require('./dbconnection/mysql');
const { getTutorApplicationsByStatus } = require('./queries/tutorApplications');

async function testQueryFunction() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('🧪 Testing getTutorApplicationsByStatus function...');
    
    const applications = await getTutorApplicationsByStatus(pool, 'pending');
    
    console.log('📊 Function results:');
    console.log(JSON.stringify(applications, null, 2));
    
    if (applications.length > 0) {
      console.log('\n📋 Assessment field analysis:');
      applications.forEach((app, index) => {
        console.log(`Application ${index + 1}:`);
        console.log(`  - assessment_result_id: ${app.assessment_result_id}`);
        console.log(`  - assessment_score: ${app.assessment_score}`);
        console.log(`  - assessment_percentage: ${app.assessment_percentage}`);
        console.log(`  - assessment_passed: ${app.assessment_passed}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testQueryFunction();