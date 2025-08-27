// backend/queries/sessions.js
const db = require('../dbconnection/mysql')

// Create a new session booking (supports date range and preferred time)
async function createSession({ tutor_id, name, student_id, start_date, end_date, preferred_time }) {
  const pool = await db.getPool()
  try {
    const [result] = await pool.query(
      `INSERT INTO bookings (tutor_id, name, start_date, end_date, preferred_time, student_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [tutor_id, name, start_date, end_date, preferred_time, student_id]
    )
    return result.insertId
  } catch (err) {
    console.error('Booking insert failed:', err.message)
    console.error('Booking insert details:', {
      tutor_id, name, start_date, end_date, preferred_time, student_id
    })
    throw err
  }
}

// Get all sessions for a student or tutor
async function getSessions({ student_id, tutor_id }) {
  const pool = await db.getPool()
  let query = 'SELECT * FROM bookings'
  let params = []
  if (student_id) {
    query += ' WHERE student_id = ?'
    params = [student_id]
  } else if (tutor_id) {
    query += ' WHERE tutor_id = ?'
    params = [tutor_id]
  }
  const [rows] = await pool.query(query, params)
  return rows
}

module.exports = {
  createSession,
  getSessions
}
