// Simple script to check existing users in the database
const db = require('./dbconnection/mysql');

async function checkUsers() {
  try {
    console.log('Checking existing users in the database...');
    
    await db.connect();
    const pool = await db.getPool();
    const [users] = await pool.query('SELECT user_id, first_name, last_name, email, role FROM users ORDER BY user_id LIMIT 10');
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.user_id}, Name: ${user.first_name} ${user.last_name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    if (users.length > 0) {
      console.log(`\nWe can use user_id: ${users[0].user_id} for testing`);
    } else {
      console.log('\n❌ No users found in the database. Please create a user first.');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();