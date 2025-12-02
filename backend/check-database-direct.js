// Direct database check for assessment data
const db = require('./dbconnection/mysql');

async function checkDatabaseDirectly() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    // Check the actual data in the database
    console.log('🔍 Checking database directly for assessment data...');
    
    const [rows] = await pool.query(`
      SELECT 
        application_id,
        name,
        status,
        assessment_result_id,
        assessment_score,
        assessment_percentage,
        assessment_passed
      FROM tutorapplications 
      WHERE status = 'pending'
      ORDER BY application_date DESC
    `);
    
    console.log('📊 Raw database results:');
    console.log(JSON.stringify(rows, null, 2));
    
    if (rows.length > 0) {
      console.log('\n📋 Assessment field analysis:');
      rows.forEach((row, index) => {
        console.log(`Application ${index + 1}:`);
        console.log(`  - assessment_result_id: ${row.assessment_result_id}`);
        console.log(`  - assessment_score: ${row.assessment_score}`);
        console.log(`  - assessment_percentage: ${row.assessment_percentage}`);
        console.log(`  - assessment_passed: ${row.assessment_passed}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabaseDirectly();