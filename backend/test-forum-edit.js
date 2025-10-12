// Test script to verify forum edit tracking is working
// Run with: node backend/test-forum-edit.js

const db = require('./dbconnection/mysql');

async function testForumEditTracking() {
  try {
    console.log('🔍 Testing Forum Edit Tracking...\n');
    
    await db.connect();
    const pool = await db.getPool();
    
    // Step 1: Check if updated_at column exists
    console.log('Step 1: Checking if updated_at column exists...');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'forums'
        AND COLUMN_NAME = 'updated_at'
    `);
    
    if (columns.length === 0) {
      console.log('❌ ERROR: updated_at column does NOT exist!');
      console.log('📝 Please run the migration script:');
      console.log('   mysql -u username -p database < backend/migrations/add_updated_at_to_forums.sql\n');
      process.exit(1);
    } else {
      console.log('✅ updated_at column exists');
      console.log('   Data type:', columns[0].DATA_TYPE);
      console.log('   Nullable:', columns[0].IS_NULLABLE);
      console.log('');
    }
    
    // Step 2: Check current forums data
    console.log('Step 2: Checking current forums data...');
    const [forums] = await pool.query(`
      SELECT 
        forum_id,
        title,
        created_at,
        updated_at,
        CASE 
          WHEN updated_at IS NOT NULL AND updated_at > created_at THEN 1
          ELSE 0
        END AS is_edited
      FROM forums
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${forums.length} forums (showing up to 5):\n`);
    forums.forEach((forum, index) => {
      console.log(`Forum #${index + 1}:`);
      console.log('  ID:', forum.forum_id);
      console.log('  Title:', forum.title);
      console.log('  Created:', forum.created_at);
      console.log('  Updated:', forum.updated_at || 'NULL');
      console.log('  Is Edited:', forum.is_edited ? 'YES ✏️' : 'NO');
      console.log('');
    });
    
    // Step 3: Test the query used by getAllForums
    console.log('Step 3: Testing getAllForums query...');
    const [testQuery] = await pool.query(`
      SELECT f.*, 
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
        s.subject_name,
        (
          SELECT COUNT(*) FROM comments c WHERE c.forum_id = f.forum_id
        ) AS comment_count,
        f.updated_at,
        CASE 
          WHEN f.updated_at IS NOT NULL AND f.updated_at > f.created_at THEN 1
          ELSE 0
        END AS is_edited
      FROM forums f
      LEFT JOIN users u ON f.created_by = u.user_id
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      ORDER BY f.created_at DESC
      LIMIT 1
    `);
    
    if (testQuery.length > 0) {
      const sample = testQuery[0];
      console.log('✅ Query works! Sample result:');
      console.log('  forum_id:', sample.forum_id);
      console.log('  title:', sample.title);
      console.log('  created_by_name:', sample.created_by_name);
      console.log('  subject_name:', sample.subject_name);
      console.log('  created_at:', sample.created_at);
      console.log('  updated_at:', sample.updated_at);
      console.log('  is_edited:', sample.is_edited, '(type:', typeof sample.is_edited + ')');
      console.log('  comment_count:', sample.comment_count);
    }
    
    console.log('\n✅ All checks passed! Forum edit tracking is properly configured.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Edit a forum post');
    console.log('   3. Check the browser console and terminal logs');
    console.log('   4. The "Edited" badge should appear\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

testForumEditTracking();
