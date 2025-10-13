// backend/queries/postTestResults.js
const db = require('../dbconnection/mysql')

// Create a new post-test result
async function createPostTestResult(pool, { post_test_id, student_id, booking_id, answers, score, total_questions, correct_answers, time_taken, passed }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO post_test_results (post_test_id, student_id, booking_id, answers, score, total_questions, correct_answers, time_taken, passed, started_at, completed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        post_test_id,
        student_id,
        booking_id,
        JSON.stringify(answers),
        score,
        total_questions,
        correct_answers,
        time_taken,
        passed
      ]
    )
    
    // Update post-test status to completed
    await pool.query(
      'UPDATE post_tests SET status = "completed", completed_at = NOW() WHERE post_test_id = ?',
      [post_test_id]
    )
    
    return { result_id: result.insertId, ...arguments[1] }
  } catch (err) {
    console.error('Error creating post-test result:', err)
    throw err
  }
}

// Get all post-test results with optional filters
async function getAllPostTestResults(pool, filters = {}) {
  try {
    let query = `
      SELECT ptr.*, 
             pt.title as post_test_title, pt.subject_name, pt.passing_score,
             s.first_name as student_first_name, s.last_name as student_last_name,
             t.first_name as tutor_first_name, t.last_name as tutor_last_name
      FROM post_test_results ptr
      LEFT JOIN post_tests pt ON ptr.post_test_id = pt.post_test_id
      LEFT JOIN users s ON ptr.student_id = s.user_id
      LEFT JOIN users t ON pt.tutor_id = t.user_id
    `
    
    const conditions = []
    const params = []
    
    if (filters.student_id) {
      conditions.push('ptr.student_id = ?')
      params.push(filters.student_id)
    }
    
    if (filters.post_test_id) {
      conditions.push('ptr.post_test_id = ?')
      params.push(filters.post_test_id)
    }
    
    if (filters.booking_id) {
      conditions.push('ptr.booking_id = ?')
      params.push(filters.booking_id)
    }
    
    if (filters.tutor_id) {
      conditions.push('pt.tutor_id = ?')
      params.push(filters.tutor_id)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY ptr.completed_at DESC'
    
    const [rows] = await pool.query(query, params)
    
    // Parse JSON answers for each result
    return rows.map(row => ({
      ...row,
      answers: row.answers ? JSON.parse(row.answers) : null
    }))
  } catch (err) {
    console.error('Error fetching post-test results:', err)
    throw err
  }
}

// Get result by ID
async function getPostTestResultById(pool, result_id) {
  try {
    const [rows] = await pool.query(
      `SELECT ptr.*, 
             pt.title as post_test_title, pt.subject_name, pt.passing_score,
             s.first_name as student_first_name, s.last_name as student_last_name,
             t.first_name as tutor_first_name, t.last_name as tutor_last_name
       FROM post_test_results ptr
       LEFT JOIN post_tests pt ON ptr.post_test_id = pt.post_test_id
       LEFT JOIN users s ON ptr.student_id = s.user_id
       LEFT JOIN users t ON pt.tutor_id = t.user_id
       WHERE ptr.result_id = ?`,
      [result_id]
    )
    
    if (rows[0] && rows[0].answers) {
      rows[0].answers = JSON.parse(rows[0].answers)
    }
    
    return rows[0] || null
  } catch (err) {
    console.error('Error fetching post-test result by ID:', err)
    throw err
  }
}

// Get result by student and post-test
async function getResultByStudentAndPostTest(pool, student_id, post_test_id) {
  try {
    const [rows] = await pool.query(
      `SELECT ptr.*, 
             pt.title as post_test_title, pt.subject_name, pt.passing_score,
             s.first_name as student_first_name, s.last_name as student_last_name,
             t.first_name as tutor_first_name, t.last_name as tutor_last_name
       FROM post_test_results ptr
       LEFT JOIN post_tests pt ON ptr.post_test_id = pt.post_test_id
       LEFT JOIN users s ON ptr.student_id = s.user_id
       LEFT JOIN users t ON pt.tutor_id = t.user_id
       WHERE ptr.student_id = ? AND ptr.post_test_id = ?`,
      [student_id, post_test_id]
    )
    
    if (rows[0] && rows[0].answers) {
      rows[0].answers = JSON.parse(rows[0].answers)
    }
    
    return rows[0] || null
  } catch (err) {
    console.error('Error fetching result by student and post-test:', err)
    throw err
  }
}

// Delete post-test result
async function deletePostTestResult(pool, result_id) {
  try {
    const [result] = await pool.query('DELETE FROM post_test_results WHERE result_id = ?', [result_id])
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error deleting post-test result:', err)
    throw err
  }
}

// Get post-test statistics
async function getPostTestStatistics(pool, post_test_id) {
  try {
    const [rows] = await pool.query(
      `SELECT 
         COUNT(*) as total_attempts,
         AVG(score) as average_score,
         MIN(score) as lowest_score,
         MAX(score) as highest_score,
         SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count,
         AVG(time_taken) as average_time
       FROM post_test_results 
       WHERE post_test_id = ?`,
      [post_test_id]
    )
    
    return rows[0] || {
      total_attempts: 0,
      average_score: 0,
      lowest_score: 0,
      highest_score: 0,
      passed_count: 0,
      average_time: 0
    }
  } catch (err) {
    console.error('Error fetching post-test statistics:', err)
    throw err
  }
}

module.exports = {
  createPostTestResult,
  getAllPostTestResults,
  getPostTestResultById,
  getResultByStudentAndPostTest,
  deletePostTestResult,
  getPostTestStatistics
}