const db = require('./dbconnection/mysql');

(async () => {
  try {
    await db.connect();
    const pool = await db.getPool();
    
    // Check all post-tests for booking 51
    const [rows] = await pool.query('SELECT * FROM post_tests WHERE booking_id = ?', [51]);
    console.log('All post-tests for booking 51:');
    console.table(rows);
    
    // Check if any are published
    const [published] = await pool.query('SELECT * FROM post_tests WHERE booking_id = ? AND status = ?', [51, 'published']);
    console.log('\nPublished post-tests for booking 51:');
    console.table(published);
    
    // Check all post-tests regardless of booking
    const [all] = await pool.query('SELECT post_test_id, booking_id, title, status FROM post_tests ORDER BY post_test_id DESC LIMIT 5');
    console.log('\nRecent post-tests (last 5):');
    console.table(all);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();