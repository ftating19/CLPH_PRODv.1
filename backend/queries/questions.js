// Question-related database queries

// Get all questions for a quiz
const getQuestionsByQuizId = async (pool, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM questions 
      WHERE quizzes_id = ? 
      ORDER BY question_id
    `, [quizId]);
    
    // Parse choices from JSON string to array if it's stored as JSON
    return rows.map(question => ({
      ...question,
      choices: typeof question.choices === 'string' ? JSON.parse(question.choices) : question.choices
    }));
  } catch (error) {
    console.error('Error fetching questions by quiz ID:', error);
    throw error;
  }
};

// Get question by ID
const getQuestionById = async (pool, questionId) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM questions WHERE question_id = ?
    `, [questionId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const question = rows[0];
    return {
      ...question,
      choices: question.choices ? JSON.parse(question.choices) : []
    };
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    throw error;
  }
};

// Create new question
const createQuestion = async (pool, questionData) => {
  try {
    const {
      quizzes_id,
      choices,
      answer
    } = questionData;
    
    // Convert choices array to JSON string if needed
    const choicesData = Array.isArray(choices) ? JSON.stringify(choices) : choices;
    
    const [result] = await pool.query(`
      INSERT INTO questions (
        quizzes_id, choices, answer
      ) VALUES (?, ?, ?)
    `, [
      quizzes_id, choicesData, answer
    ]);
    
    return {
      question_id: result.insertId,
      quizzes_id,
      choices: Array.isArray(choices) ? choices : JSON.parse(choices || '[]'),
      answer
    };
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

// Update question
const updateQuestion = async (pool, questionId, questionData) => {
  try {
    const {
      choices,
      answer
    } = questionData;
    
    // Convert choices array to JSON string if needed
    const choicesData = Array.isArray(choices) ? JSON.stringify(choices) : choices;
    
    const [result] = await pool.query(`
      UPDATE questions SET 
        choices = ?, answer = ?
      WHERE question_id = ?
    `, [
      choicesData, answer, questionId
    ]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

// Delete question
const deleteQuestion = async (pool, questionId) => {
  try {
    const [result] = await pool.query('DELETE FROM questions WHERE question_id = ?', [questionId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Delete all questions for a quiz
const deleteQuestionsByQuizId = async (pool, quizId) => {
  try {
    const [result] = await pool.query('DELETE FROM questions WHERE quizzes_id = ?', [quizId]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error deleting questions by quiz ID:', error);
    throw error;
  }
};

module.exports = {
  getQuestionsByQuizId,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsByQuizId
};
