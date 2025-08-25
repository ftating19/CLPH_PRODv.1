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
      choices: typeof question.choices === 'string' ? JSON.parse(question.choices) : question.choices,
      points: question.points || 1,
      explanation: question.explanation || null
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
      choices: question.choices ? JSON.parse(question.choices) : [],
      points: question.points || 1,
      explanation: question.explanation || null
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
      quiz_id,
      quizzes_id,
      question_text,
      question_type,
      choices,
      correct_answer,
      answer,
      explanation,
      points
    } = questionData;
    
    // Use quiz_id if provided, otherwise use quizzes_id for backward compatibility
    const finalQuizId = quiz_id || quizzes_id;
    // Use correct_answer if provided, otherwise use answer for backward compatibility
    const finalAnswer = correct_answer || answer;
    
    // Convert choices array to JSON string if needed
    const choicesData = Array.isArray(choices) ? JSON.stringify(choices) : choices;
    
    // Check if we have the additional fields and include them if the table supports them
    // Using the correct column name 'question' instead of 'question_text'
    const [result] = await pool.query(`
      INSERT INTO questions (
        quizzes_id, question, choices, answer, points, explanation
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      finalQuizId, 
      question_text || '', 
      choicesData, 
      finalAnswer, 
      points || 1, 
      explanation || null
    ]);
    
    return {
      question_id: result.insertId,
      quizzes_id: finalQuizId,
      question: question_text || '',
      choices: Array.isArray(choices) ? choices : JSON.parse(choices || '[]'),
      answer: finalAnswer,
      points: points || 1,
      explanation: explanation || null
    };
  } catch (error) {
    console.error('Error creating question:', error);
    console.error('Question data received:', questionData);
    throw error;
  }
};

// Update question
const updateQuestion = async (pool, questionId, questionData) => {
  try {
    const {
      question_text,
      choices,
      answer,
      correct_answer,
      points,
      explanation
    } = questionData;
    
    // Use correct_answer if provided, otherwise use answer for backward compatibility
    const finalAnswer = correct_answer || answer;
    
    // Convert choices array to JSON string if needed
    const choicesData = Array.isArray(choices) ? JSON.stringify(choices) : choices;
    
    const [result] = await pool.query(`
      UPDATE questions SET 
        question = ?, choices = ?, answer = ?, points = ?, explanation = ?
      WHERE question_id = ?
    `, [
      question_text || '', choicesData, finalAnswer, points || 1, explanation || null, questionId
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
