const db = require('./dbconnection/mysql');

(async () => {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    console.log('🔍 Checking database tables...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Check for tutor-related tables
    const tableNames = tables.map(t => Object.values(t)[0]);
    const tutorTables = tableNames.filter(name => name.includes('tutor'));
    console.log('Tutor-related tables:', tutorTables);
    
    // Check for application-related tables
    const appTables = tableNames.filter(name => name.includes('application'));
    console.log('Application-related tables:', appTables);
    
    // If tutor application table exists, show its structure
    for (const table of [...tutorTables, ...appTables]) {
      console.log(`\nStructure of ${table}:`);
      const [columns] = await pool.query(`DESCRIBE ${table}`);
      console.table(columns);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
