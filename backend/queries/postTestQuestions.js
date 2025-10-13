// backend/queries/postTestQuestions.js
const db = require('../dbconnection/mysql')

// Create a new post-test question
async function createPostTestQuestion(pool, { post_test_id, question_text, question_type, options, correct_answer, points, explanation, order_number }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO post_test_questions (post_test_id, question_text, question_type, options, correct_answer, points, explanation, order_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post_test_id, 
        question_text, 
        question_type, 
        options ? JSON.stringify(options) : null,
        correct_answer, 
        points || 1, 
        explanation, 
        order_number || 1
      ]
    )
    return { question_id: result.insertId, ...arguments[1] }
  } catch (err) {
    console.error('Error creating post-test question:', err)
    throw err
  }
}

// Bulk create post-test questions
async function createPostTestQuestions(pool, post_test_id, questions) {
  try {
    const insertPromises = questions.map((question, index) => 
      createPostTestQuestion(pool, {
        ...question,
        post_test_id,
        order_number: question.order_number || (index + 1)
      })
    )
    
    const results = await Promise.all(insertPromises)
    return results
  } catch (err) {
    console.error('Error creating post-test questions:', err)
    throw err
  }
}

// Get all questions for a post-test
async function getQuestionsByPostTestId(pool, post_test_id) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM post_test_questions WHERE post_test_id = ? ORDER BY order_number ASC',
      [post_test_id]
    )
    
    // Parse JSON options for each question
    return rows.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : null
    }))
  } catch (err) {
    console.error('Error fetching post-test questions:', err)
    throw err
  }
}

// Get post-test question by ID
async function getPostTestQuestionById(pool, question_id) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM post_test_questions WHERE question_id = ?',
      [question_id]
    )
    
    if (rows[0] && rows[0].options) {
      rows[0].options = JSON.parse(rows[0].options)
    }
    
    return rows[0] || null
  } catch (err) {
    console.error('Error fetching post-test question by ID:', err)
    throw err
  }
}

// Update post-test question
async function updatePostTestQuestion(pool, question_id, { question_text, question_type, options, correct_answer, points, explanation, order_number }) {
  try {
    const updates = []
    const params = []
    
    if (question_text !== undefined) {
      updates.push('question_text = ?')
      params.push(question_text)
    }
    
    if (question_type !== undefined) {
      updates.push('question_type = ?')
      params.push(question_type)
    }
    
    if (options !== undefined) {
      updates.push('options = ?')
      params.push(options ? JSON.stringify(options) : null)
    }
    
    if (correct_answer !== undefined) {
      updates.push('correct_answer = ?')
      params.push(correct_answer)
    }
    
    if (points !== undefined) {
      updates.push('points = ?')
      params.push(points)
    }
    
    if (explanation !== undefined) {
      updates.push('explanation = ?')
      params.push(explanation)
    }
    
    if (order_number !== undefined) {
      updates.push('order_number = ?')
      params.push(order_number)
    }
    
    if (updates.length === 0) {
      return false
    }
    
    params.push(question_id)
    
    const [result] = await pool.query(
      `UPDATE post_test_questions SET ${updates.join(', ')} WHERE question_id = ?`,
      params
    )
    
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error updating post-test question:', err)
    throw err
  }
}

// Delete post-test question
async function deletePostTestQuestion(pool, question_id) {
  try {
    const [result] = await pool.query('DELETE FROM post_test_questions WHERE question_id = ?', [question_id])
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error deleting post-test question:', err)
    throw err
  }
}

// Delete all questions for a post-test
async function deleteQuestionsByPostTestId(pool, post_test_id) {
  try {
    const [result] = await pool.query('DELETE FROM post_test_questions WHERE post_test_id = ?', [post_test_id])
    return result.affectedRows
  } catch (err) {
    console.error('Error deleting post-test questions:', err)
    throw err
  }
}

module.exports = {
  createPostTestQuestion,
  createPostTestQuestions,
  getQuestionsByPostTestId,
  getPostTestQuestionById,
  updatePostTestQuestion,
  deletePostTestQuestion,
  deleteQuestionsByPostTestId
}