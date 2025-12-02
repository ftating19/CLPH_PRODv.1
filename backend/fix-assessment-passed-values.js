// Fix assessment_passed values based on score
const db = require('./dbconnection/mysql');

async function fixAssessmentPassedValues() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('🔧 Fixing assessment_passed values based on scores...');
    
    // Update assessment_passed to 1 where score >= 70 and currently 0
    const updateQuery = `
      UPDATE tutorapplications 
      SET assessment_passed = CASE 
        WHEN CAST(assessment_score AS DECIMAL(5,2)) >= 70 THEN 1
        ELSE 0
      END
      WHERE assessment_result_id IS NOT NULL 
      AND assessment_score IS NOT NULL
    `;
    
    const [result] = await pool.query(updateQuery);
    
    console.log(`✅ Updated ${result.affectedRows} assessment records`);
    
    // Check the results
    const [updatedRows] = await pool.query(`
      SELECT 
        application_id,
        name,
        assessment_score,
        assessment_passed
      FROM tutorapplications 
      WHERE assessment_result_id IS NOT NULL 
      ORDER BY application_date DESC
    `);
    
    console.log('\n📊 Updated assessment records:');
    updatedRows.forEach(row => {
      console.log(`  ${row.name}: ${row.assessment_score} points → ${row.assessment_passed ? 'PASSED' : 'FAILED'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAssessmentPassedValues();