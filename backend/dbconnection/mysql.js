const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
dotenv.config()

let pool

async function connect() {
  if (pool) return pool

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD != null ? String(process.env.DB_PASSWORD) : '',
    database: process.env.DB_NAME || 'clph',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }

  pool = mysql.createPool(config)
  // quick test
  await pool.query('SELECT 1')
  console.log('MySQL: connected')
  return pool
}

function getPool() {
  if (!pool) throw new Error('Database not connected — call connect() first')
  return pool
}

module.exports = { connect, getPool }
