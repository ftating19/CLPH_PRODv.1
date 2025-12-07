const mysql = require('mysql2/promise')

async function checkSystemFeedbackTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'clph',
      port: process.env.DB_PORT || 3306,
    })

    console.log('Connected to MySQL database')
    
    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = 'clph' AND table_name = 'system_feedback'
    `)
    
    if (tables.length > 0) {
      console.log('✅ system_feedback table exists!')
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE system_feedback')
      console.log('\n📋 Table structure:')
      console.table(structure)
      
      // Show current data count
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM system_feedback')
      console.log(`\n📊 Current records: ${count[0].count}`)
      
    } else {
      console.log('❌ system_feedback table does not exist')
    }
    
    await connection.end()
    
  } catch (error) {
    console.error('❌ Error checking table:', error)
  }
}

checkSystemFeedbackTable()