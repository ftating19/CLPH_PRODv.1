const db = require('./dbconnection/mysql');

async function finalCheck() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    // Check for truly problematic entries
    const [problematic] = await pool.query(`
      SELECT user_id, first_name, last_name, role, year_level 
      FROM users 
      WHERE (role IN ('Student', 'Tutor') AND (year_level IS NULL OR year_level = '')) 
         OR year_level = '1st year'
    `);
    
    console.log('Problematic entries:', problematic.length);
    if (problematic.length > 0) {
      console.table(problematic);
    } else {
      console.log('✅ No problematic year_level values found!');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

finalCheck();