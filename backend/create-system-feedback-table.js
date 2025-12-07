const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function createSystemFeedbackTable() {
  try {
    // Database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'clph',
      port: process.env.DB_PORT || 3306,
    })

    console.log('Connected to MySQL database')
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'database', 'create_system_feedback_table.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Split SQL content by statements (handle multiple statements)
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0)
    
    console.log('Executing SQL statements...')
    
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        console.log('Executing:', statement.substring(0, 50) + '...')
        await connection.execute(statement.trim())
      }
    }
    
    console.log('✅ System feedback table created successfully!')
    
    // Verify table creation
    const [rows] = await connection.execute('DESCRIBE system_feedback')
    console.log('\n📋 Table structure:')
    console.table(rows)
    
    await connection.end()
    console.log('Database connection closed')
    
  } catch (error) {
    console.error('❌ Error creating system feedback table:', error)
    process.exit(1)
  }
}

// Run the script
createSystemFeedbackTable()