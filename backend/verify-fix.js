const db = require('./dbconnection/mysql');

async function verifyFix() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('=== VERIFYING YEAR LEVEL FIX ===');
    
    // Check final state
    console.log('\nFinal year_level statistics by role:');
    const [stats] = await pool.query(`
      SELECT 
        role,
        year_level,
        COUNT(*) as count 
      FROM users 
      GROUP BY role, year_level 
      ORDER BY role, year_level
    `);
    console.table(stats);
    
    // Check if any users still have problematic year_level values
    console.log('\nUsers with problematic year_level values:');
    const [problematic] = await pool.query(`
      SELECT user_id, first_name, last_name, role, year_level 
      FROM users 
      WHERE (role IN ('Student', 'Tutor') AND (year_level IS NULL OR year_level = ''))
         OR year_level = '1st year'
      LIMIT 10
    `);
    
    if (problematic.length === 0) {
      console.log('✅ No problematic year_level values found!');
    } else {
      console.table(problematic);
    }
    
    // Show a few sample users from each role
    console.log('\nSample users by role:');
    const [samples] = await pool.query(`
      SELECT user_id, first_name, last_name, role, year_level 
      FROM users 
      ORDER BY role, user_id 
      LIMIT 15
    `);
    console.table(samples);
    
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyFix();