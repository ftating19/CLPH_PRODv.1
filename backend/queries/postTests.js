// backend/queries/postTests.js
const db = require('../dbconnection/mysql')

// Create a new post-test
async function createPostTest(pool, { booking_id, tutor_id, student_id, title, description, subject_id, subject_name, time_limit, passing_score }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO post_tests (booking_id, tutor_id, student_id, title, description, subject_id, subject_name, time_limit, passing_score, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [booking_id, tutor_id, student_id, title, description, subject_id, subject_name, time_limit || 30, passing_score || 70]
    )
    return { post_test_id: result.insertId, ...arguments[1] }
  } catch (err) {
    console.error('Error creating post-test:', err)
    throw err
  }
}

// Get all post-tests with optional filters
async function getAllPostTests(pool, filters = {}) {
  try {
    let query = `
      SELECT pt.*, 
             t.first_name as tutor_first_name, t.last_name as tutor_last_name,
             s.first_name as student_first_name, s.last_name as student_last_name,
             b.tutor_name, b.student_name,
             sub.subject_name as full_subject_name
      FROM post_tests pt
      LEFT JOIN users t ON pt.tutor_id = t.user_id
      LEFT JOIN users s ON pt.student_id = s.user_id
      LEFT JOIN bookings b ON pt.booking_id = b.booking_id
      LEFT JOIN subjects sub ON pt.subject_id = sub.subject_id
    `
    
    const conditions = []
    const params = []
    
    if (filters.tutor_id) {
      conditions.push('pt.tutor_id = ?')
      params.push(filters.tutor_id)
    }
    
    if (filters.student_id) {
      conditions.push('pt.student_id = ?')
      params.push(filters.student_id)
    }
    
    if (filters.booking_id) {
      conditions.push('pt.booking_id = ?')
      params.push(filters.booking_id)
    }
    
    if (filters.status) {
      conditions.push('pt.status = ?')
      params.push(filters.status)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY pt.created_at DESC'
    
    const [rows] = await pool.query(query, params)
    return rows
  } catch (err) {
    console.error('Error fetching post-tests:', err)
    throw err
  }
}

// Get post-test by ID
async function getPostTestById(pool, post_test_id) {
  try {
    const [rows] = await pool.query(
      `SELECT pt.*, 
             t.first_name as tutor_first_name, t.last_name as tutor_last_name,
             s.first_name as student_first_name, s.last_name as student_last_name,
             b.tutor_name, b.student_name,
             sub.subject_name as full_subject_name
       FROM post_tests pt
       LEFT JOIN users t ON pt.tutor_id = t.user_id
       LEFT JOIN users s ON pt.student_id = s.user_id
       LEFT JOIN bookings b ON pt.booking_id = b.booking_id
       LEFT JOIN subjects sub ON pt.subject_id = sub.subject_id
       WHERE pt.post_test_id = ?`,
      [post_test_id]
    )
    return rows[0] || null
  } catch (err) {
    console.error('Error fetching post-test by ID:', err)
    throw err
  }
}

// Update post-test
async function updatePostTest(pool, post_test_id, { title, description, time_limit, passing_score, status }) {
  try {
    const updates = []
    const params = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    
    if (time_limit !== undefined) {
      updates.push('time_limit = ?')
      params.push(time_limit)
    }
    
    if (passing_score !== undefined) {
      updates.push('passing_score = ?')
      params.push(passing_score)
    }
    
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
      
      if (status === 'published') {
        updates.push('published_at = NOW()')
      } else if (status === 'completed') {
        updates.push('completed_at = NOW()')
      }
    }
    
    if (updates.length === 0) {
      return false
    }
    
    params.push(post_test_id)
    
    const [result] = await pool.query(
      `UPDATE post_tests SET ${updates.join(', ')} WHERE post_test_id = ?`,
      params
    )
    
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error updating post-test:', err)
    throw err
  }
}

// Delete post-test
async function deletePostTest(pool, post_test_id) {
  try {
    const [result] = await pool.query('DELETE FROM post_tests WHERE post_test_id = ?', [post_test_id])
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error deleting post-test:', err)
    throw err
  }
}

// Publish post-test (make it available to student)
async function publishPostTest(pool, post_test_id) {
  try {
    // First check if there are questions
    const [questionRows] = await pool.query(
      'SELECT COUNT(*) as count FROM post_test_questions WHERE post_test_id = ?',
      [post_test_id]
    )
    
    if (questionRows[0].count === 0) {
      throw new Error('Cannot publish post-test without questions')
    }
    
    // Update total questions and publish
    const [result] = await pool.query(
      `UPDATE post_tests SET 
       status = 'published', 
       published_at = NOW(), 
       total_questions = (SELECT COUNT(*) FROM post_test_questions WHERE post_test_id = ?)
       WHERE post_test_id = ?`,
      [post_test_id, post_test_id]
    )
    
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error publishing post-test:', err)
    throw err
  }
}

module.exports = {
  createPostTest,
  getAllPostTests,
  getPostTestById,
  updatePostTest,
  deletePostTest,
  publishPostTest
}