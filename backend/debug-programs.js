// Debug programs data in database
const db = require('./dbconnection/mysql');

async function debugPrograms() {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('🔍 Debugging programs data in subjects table...');
    
    const [rows] = await pool.query(`
      SELECT subject_id, subject_name, program, LENGTH(program) as program_length
      FROM subjects 
      WHERE program IS NOT NULL AND program != '' 
      LIMIT 5
    `);
    
    console.log(`Found ${rows.length} subjects with programs:`);
    rows.forEach(row => {
      console.log(`- Subject: ${row.subject_name}`);
      console.log(`  Program: "${row.program}" (length: ${row.program_length})`);
      console.log(`  Type: ${typeof row.program}`);
      console.log(`  Starts with [: ${row.program.startsWith('[')}`);
      
      // Try to parse as JSON
      try {
        if (row.program.startsWith('[')) {
          const parsed = JSON.parse(row.program);
          console.log(`  Parsed JSON:`, parsed);
          console.log(`  Is Array: ${Array.isArray(parsed)}`);
        }
      } catch (e) {
        console.log(`  JSON parse error: ${e.message}`);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error debugging programs:', error);
  } finally {
    process.exit(0);
  }
}

debugPrograms();