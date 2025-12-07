// backend/queries/sessions.js
const db = require('../dbconnection/mysql')

// Create a new session booking (supports date range and preferred time)
// Note: Students can book the same tutor multiple times for different time slots
async function createSession({ tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, booked_by = 'student', status = 'pending' }) {
  const pool = await db.getPool()
  try {
    // No restrictions on multiple bookings - students can book same tutor multiple times
    const [result] = await pool.query(
      `INSERT INTO bookings (tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, status, booked_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, status, booked_by]
    )
    return result.insertId
  } catch (err) {
    console.error('Booking insert failed:', err.message)
    console.error('Booking insert details:', {
      tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, booked_by, status
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
