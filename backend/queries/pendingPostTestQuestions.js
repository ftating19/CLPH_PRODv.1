// backend/queries/pendingPostTestQuestions.js
// Pending Post-Test Questions database queries

// Create a new pending post-test question
const createPendingPostTestQuestion = async (pool, questionData) => {
  try {
    const {
      pending_post_test_id,
      question_text,
      question_type,
      options,
      correct_answer,
      points,
      explanation,
      order_number
    } = questionData;

    // Normalize question_type to match DB enum values (use underscores)
    const normalizedQuestionType = (question_type || 'multiple_choice').toString().replace(/-/g, '_').replace(/\s+/g, '_');

    const [result] = await pool.query(`
      INSERT INTO pending_post_test_questions (
        pending_post_test_id, question_text, question_type, 
        options, correct_answer, points, explanation, order_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pending_post_test_id,
      question_text,
      normalizedQuestionType,
      options ? JSON.stringify(options) : null,
      correct_answer,
      points || 1,
      explanation || null,
      order_number || 1
    ]);

    return {
      pending_question_id: result.insertId,
      id: result.insertId,
      ...questionData
    };
  } catch (error) {
    console.error('Error creating pending post-test question:', error);
    throw error;
  }
};

// Bulk create pending post-test questions
const createPendingPostTestQuestions = async (pool, pending_post_test_id, questions) => {
  try {
    const insertPromises = questions.map((question, index) => 
      createPendingPostTestQuestion(pool, {
        ...question,
        pending_post_test_id,
        order_number: question.order_number || (index + 1)
      })
    );
    
    const results = await Promise.all(insertPromises);
    return results;
  } catch (error) {
    console.error('Error creating pending post-test questions:', error);
    throw error;
  }
};

// Get all questions for a pending post-test
const getQuestionsByPendingPostTestId = async (pool, pending_post_test_id) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM pending_post_test_questions 
      WHERE pending_post_test_id = ? 
      ORDER BY order_number ASC
    `, [pending_post_test_id]);
    
    // Parse JSON options for each question
    return rows.map(row => ({
      ...row,
      id: row.pending_question_id, // Map pending_question_id to id for frontend compatibility
      options: row.options ? JSON.parse(row.options) : null
    }));
  } catch (error) {
    console.error('Error fetching pending post-test questions:', error);
    throw error;
  }
};

// Get pending post-test question by ID
const getPendingPostTestQuestionById = async (pool, pending_question_id) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM pending_post_test_questions 
      WHERE pending_question_id = ?
    `, [pending_question_id]);
    
    if (rows.length === 0) return null;
    
    const result = rows[0];
    result.id = result.pending_question_id; // Map pending_question_id to id for frontend compatibility
    if (result.options) {
      result.options = JSON.parse(result.options);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching pending post-test question by ID:', error);
    throw error;
  }
};

// Update pending post-test question
const updatePendingPostTestQuestion = async (pool, pending_question_id, questionData) => {
  try {
    const {
      question_text,
      question_type,
      options,
      correct_answer,
      points,
      explanation,
      order_number
    } = questionData;

    const updates = [];
    const params = [];
    
    if (question_text !== undefined) {
      updates.push('question_text = ?');
      params.push(question_text);
    }
    
    if (question_type !== undefined) {
      // Normalize to DB enum style
      const normalizedQuestionType = question_type.toString().replace(/-/g, '_').replace(/\s+/g, '_');
      updates.push('question_type = ?');
      params.push(normalizedQuestionType);
    }
    
    if (options !== undefined) {
      updates.push('options = ?');
      params.push(options ? JSON.stringify(options) : null);
    }
    
    if (correct_answer !== undefined) {
      updates.push('correct_answer = ?');
      params.push(correct_answer);
    }
    
    if (points !== undefined) {
      updates.push('points = ?');
      params.push(points);
    }
    
    if (explanation !== undefined) {
      updates.push('explanation = ?');
      params.push(explanation);
    }
    
    if (order_number !== undefined) {
      updates.push('order_number = ?');
      params.push(order_number);
    }
    
    if (updates.length === 0) {
      return false;
    }
    
    params.push(pending_question_id);
    
    const [result] = await pool.query(`
      UPDATE pending_post_test_questions 
      SET ${updates.join(', ')} 
      WHERE pending_question_id = ?
    `, params);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating pending post-test question:', error);
    throw error;
  }
};

// Delete pending post-test question
const deletePendingPostTestQuestion = async (pool, pending_question_id) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM pending_post_test_questions 
      WHERE pending_question_id = ?
    `, [pending_question_id]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting pending post-test question:', error);
    throw error;
  }
};

// Delete all questions for a pending post-test
const deleteQuestionsByPendingPostTestId = async (pool, pending_post_test_id) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM pending_post_test_questions 
      WHERE pending_post_test_id = ?
    `, [pending_post_test_id]);
    
    return result.affectedRows;
  } catch (error) {
    console.error('Error deleting pending post-test questions:', error);
    throw error;
  }
};

module.exports = {
  createPendingPostTestQuestion,
  createPendingPostTestQuestions,
  getQuestionsByPendingPostTestId,
  getPendingPostTestQuestionById,
  updatePendingPostTestQuestion,
  deletePendingPostTestQuestion,
  deleteQuestionsByPendingPostTestId
};
