const db = require('./dbconnection/mysql');

async function fixYearLevels() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('=== FIXING YEAR LEVEL VALUES ===');
    
    // First, let's see current problematic entries
    console.log('\n1. Current problematic year_level values:');
    const [problematic] = await pool.query(`
      SELECT user_id, first_name, last_name, role, year_level 
      FROM users 
      WHERE year_level IS NULL 
         OR year_level = '' 
         OR year_level = '1st year'
         OR year_level NOT IN ('1st Year', '2nd Year', '3rd Year', '4th Year')
    `);
    console.table(problematic);
    
    // Fix the lowercase 'year' entries
    console.log('\n2. Fixing "1st year" to "1st Year":');
    const [result1] = await pool.query(`
      UPDATE users 
      SET year_level = '1st Year' 
      WHERE year_level = '1st year'
    `);
    console.log(`Updated ${result1.affectedRows} records from "1st year" to "1st Year"`);
    
    // Set default year level for Students who don't have one
    console.log('\n3. Setting default year level for Students without year_level:');
    const [result2] = await pool.query(`
      UPDATE users 
      SET year_level = '1st Year' 
      WHERE role = 'Student' 
        AND (year_level IS NULL OR year_level = '')
    `);
    console.log(`Updated ${result2.affectedRows} Student records to default "1st Year"`);
    
    // Set year_level to NULL for Faculty and Admin (they don't need year levels)
    console.log('\n4. Setting year_level to NULL for Faculty and Admin:');
    const [result3] = await pool.query(`
      UPDATE users 
      SET year_level = NULL 
      WHERE role IN ('Faculty', 'Admin')
    `);
    console.log(`Updated ${result3.affectedRows} Faculty/Admin records to NULL year_level`);
    
    // Show final statistics
    console.log('\n5. Final year_level statistics:');
    const [finalStats] = await pool.query(`
      SELECT 
        role,
        year_level,
        COUNT(*) as count 
      FROM users 
      GROUP BY role, year_level 
      ORDER BY role, year_level
    `);
    console.table(finalStats);
    
    await pool.end();
    console.log('\n✅ Year level fix completed!');
    
  } catch (error) {
    console.error('Error fixing year levels:', error);
  }
}

fixYearLevels();