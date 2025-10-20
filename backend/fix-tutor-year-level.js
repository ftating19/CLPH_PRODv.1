const db = require('./dbconnection/mysql');

async function checkTutorWithoutYearLevel() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('=== CHECKING TUTOR WITHOUT YEAR LEVEL ===');
    
    const [tutorWithoutYear] = await pool.query(`
      SELECT user_id, first_name, last_name, email, role, year_level 
      FROM users 
      WHERE role = 'Tutor' AND year_level IS NULL
    `);
    
    console.table(tutorWithoutYear);
    
    if (tutorWithoutYear.length > 0) {
      console.log('\nSetting default year level for tutor without year_level:');
      const [result] = await pool.query(`
        UPDATE users 
        SET year_level = '1st Year' 
        WHERE role = 'Tutor' AND year_level IS NULL
      `);
      console.log(`Updated ${result.affectedRows} Tutor records to default "1st Year"`);
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTutorWithoutYearLevel();