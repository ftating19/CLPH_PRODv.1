// Quiz-related database queries

// Get all quizzes
const getAllQuizzes = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        q.*,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT qu.question_id) as question_count
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN users u ON q.created_by = u.user_id
      LEFT JOIN questions qu ON q.quizzes_id = qu.quizzes_id
      GROUP BY q.quizzes_id
      ORDER BY q.quizzes_id DESC
    `);
    
    return rows;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// Get quiz by ID with questions
const getQuizById = async (pool, quizId) => {
  try {
    // Get quiz details
    const [quizRows] = await pool.query(`
      SELECT 
        q.*,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN users u ON q.created_by = u.user_id
      WHERE q.quizzes_id = ?
    `, [quizId]);
    
    if (quizRows.length === 0) {
      return null;
    }
    
    const quiz = quizRows[0];
    
    // Get questions for this quiz
    const [questionRows] = await pool.query(`
      SELECT * FROM questions 
      WHERE quizzes_id = ? 
      ORDER BY question_id
    `, [quizId]);
    
    // Parse choices from JSON string to array
    const questions = questionRows.map(question => ({
      ...question,
      choices: question.choices ? JSON.parse(question.choices) : []
    }));
    
    return {
      ...quiz,
      questions
    };
  } catch (error) {
    console.error('Error fetching quiz by ID:', error);
    throw error;
  }
};

// Get quizzes by subject
const getQuizzesBySubject = async (pool, subjectId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        q.*,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT qu.question_id) as question_count
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN users u ON q.created_by = u.user_id
      LEFT JOIN questions qu ON q.quizzes_id = qu.quizzes_id
      WHERE q.subject_id = ?
      GROUP BY q.quizzes_id
      ORDER BY q.quizzes_id DESC
    `, [subjectId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching quizzes by subject:', error);
    throw error;
  }
};

// Create new quiz
const createQuiz = async (pool, quizData) => {
  try {
    const {
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type,
      duration,
      difficulty,
      item_counts
    } = quizData;
    
    const [result] = await pool.query(`
      INSERT INTO quizzes (
        title, subject_id, subject_name, description, 
        created_by, quiz_type, duration, difficulty, item_counts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, subject_id, subject_name, description,
      created_by, quiz_type, duration, difficulty, item_counts
    ]);
    
    return {
      quizzes_id: result.insertId,
      ...quizData
    };
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Update quiz
const updateQuiz = async (pool, quizId, quizData) => {
  try {
    const {
      title,
      subject_id,
      subject_name,
      description,
      quiz_type,
      duration,
      difficulty,
      item_counts
    } = quizData;
    
    const [result] = await pool.query(`
      UPDATE quizzes SET 
        title = ?, subject_id = ?, subject_name = ?, description = ?,
        quiz_type = ?, duration = ?, difficulty = ?, item_counts = ?
      WHERE quizzes_id = ?
    `, [
      title, subject_id, subject_name, description,
      quiz_type, duration, difficulty, item_counts, quizId
    ]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

// Delete quiz
const deleteQuiz = async (pool, quizId) => {
  try {
    // First delete all questions for this quiz
    await pool.query('DELETE FROM questions WHERE quizzes_id = ?', [quizId]);
    
    // Then delete all quiz attempts
    await pool.query('DELETE FROM quizattempts WHERE quizzes_id = ?', [quizId]);
    
    // Finally delete the quiz
    const [result] = await pool.query('DELETE FROM quizzes WHERE quizzes_id = ?', [quizId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

// Get user's quiz attempts
const getUserQuizAttempts = async (pool, userId, quizId = null) => {
  try {
    let query = `
      SELECT 
        qa.*,
        q.title as quiz_title,
        q.item_counts
      FROM quizattempts qa
      JOIN quizzes q ON qa.quizzes_id = q.quizzes_id
      WHERE qa.user_id = ?
    `;
    
    const params = [userId];
    
    if (quizId) {
      query += ' AND qa.quizzes_id = ?';
      params.push(quizId);
    }
    
    query += ' ORDER BY qa.timestamp DESC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching user quiz attempts:', error);
    throw error;
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  getQuizzesBySubject,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getUserQuizAttempts
};
