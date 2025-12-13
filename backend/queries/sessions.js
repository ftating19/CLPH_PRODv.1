// backend/queries/sessions.js
const db = require('../dbconnection/mysql')

// Create a new session booking (supports date range and preferred time)
// Note: Students can book the same tutor multiple times for different time slots
async function createSession({ tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, subject_id = null, subject_name = null, booked_by = 'student', status = 'pending' }) {
  const pool = await db.getPool()
  try {
    // Normalize preferred_time to avoid minor formatting duplicates
    const normalizedTime = (preferred_time || '').trim()

    // Prevent duplicate bookings for the same tutor/student/date/time when status is still pending
    // This covers cases where the frontend may send the same request multiple times
    try {
      const [existing] = await pool.query(
        `SELECT booking_id FROM bookings WHERE tutor_id = ? AND student_id = ? AND start_date = ? AND preferred_time = ? AND status IN ('pending','pending_student_approval') LIMIT 1`,
        [tutor_id, student_id, start_date, normalizedTime]
      )

      if (existing && existing.length > 0) {
        // Return existing booking id instead of creating a duplicate
        return existing[0].booking_id
      }
    } catch (checkErr) {
      // If the duplicate-check query fails for any reason, log and continue to attempt insert
      console.error('Duplicate check failed for booking:', checkErr.message)
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, subject_id, subject_name, status, booked_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [tutor_id, tutor_name, student_id, student_name, start_date, end_date, normalizedTime, subject_id, subject_name, status, booked_by]
    )
    return result.insertId
  } catch (err) {
    console.error('Booking insert failed:', err.message)
    console.error('Booking insert details:', {
      tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, subject_id, subject_name, booked_by, status
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
