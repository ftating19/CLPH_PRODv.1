const db = require('./dbconnection/mysql');

async function checkYearLevel() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    // Check table structure
    console.log('=== USERS TABLE STRUCTURE ===');
    const [structure] = await pool.query('DESCRIBE users');
    console.table(structure);
    
    // Check sample user data with year_level
    console.log('\n=== SAMPLE USER DATA (with year_level) ===');
    const [users] = await pool.query('SELECT user_id, first_name, last_name, email, role, year_level FROM users LIMIT 5');
    console.table(users);
    
    // Check how many users have NULL year_level
    console.log('\n=== YEAR_LEVEL DATA ANALYSIS ===');
    const [stats] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN year_level IS NULL THEN 1 ELSE 0 END) as null_count, SUM(CASE WHEN year_level = "" THEN 1 ELSE 0 END) as empty_count FROM users');
    console.table(stats);
    
    // Show distinct year_level values
    console.log('\n=== DISTINCT YEAR_LEVEL VALUES ===');
    const [distinct] = await pool.query('SELECT DISTINCT year_level, COUNT(*) as count FROM users GROUP BY year_level ORDER BY year_level');
    console.table(distinct);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkYearLevel();