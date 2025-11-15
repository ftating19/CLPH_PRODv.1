// Quiz attempts database queries

// Get all quiz attempts
const getAllQuizAttempts = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        qa.*,
        q.title as quiz_title,
        q.item_counts,
        u.first_name,
        u.last_name
      FROM quizattempts qa
      JOIN quizzes q ON qa.quizzes_id = q.quizzes_id
      JOIN users u ON qa.user_id = u.user_id
      ORDER BY qa.timestamp DESC
    `);
    
    return rows;
  } catch (error) {
    console.error('Error fetching all quiz attempts:', error);
    throw error;
  }
};

// Get quiz attempt by ID
const getQuizAttemptById = async (pool, attemptId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        qa.*,
        q.title as quiz_title,
        q.item_counts,
        u.first_name,
        u.last_name
      FROM quizattempts qa
      JOIN quizzes q ON qa.quizzes_id = q.quizzes_id
      JOIN users u ON qa.user_id = u.user_id
      WHERE qa.attempt_id = ?
    `, [attemptId]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching quiz attempt by ID:', error);
    throw error;
  }
};

// Get quiz attempts by user
const getQuizAttemptsByUser = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        qa.*,
        q.title as quiz_title,
        q.item_counts,
        q.subject_name
      FROM quizattempts qa
      JOIN quizzes q ON qa.quizzes_id = q.quizzes_id
      WHERE qa.user_id = ?
      ORDER BY qa.timestamp DESC
    `, [userId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching quiz attempts by user:', error);
    throw error;
  }
};

// Get quiz attempts by quiz
const getQuizAttemptsByQuiz = async (pool, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        qa.*,
        u.first_name,
        u.last_name
      FROM quizattempts qa
      JOIN users u ON qa.user_id = u.user_id
      WHERE qa.quizzes_id = ?
      ORDER BY qa.score DESC, qa.timestamp DESC
    `, [quizId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching quiz attempts by quiz:', error);
    throw error;
  }
};

// Create new quiz attempt
const createQuizAttempt = async (pool, attemptData) => {
  try {
    const {
      quizzes_id,
      user_id,
      name,
      score
    } = attemptData;
    
    const [result] = await pool.query(`
      INSERT INTO quizattempts (
        quizzes_id, user_id, name, score, timestamp
      ) VALUES (?, ?, ?, ?, NOW())
    `, [quizzes_id, user_id, name, score]);
    
    return {
      attempt_id: result.insertId,
      quizzes_id,
      user_id,
      name,
      score,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    throw error;
  }
};

// Update quiz attempt
const updateQuizAttempt = async (pool, attemptId, attemptData) => {
  try {
    const { score, answers } = attemptData;
    
    // Convert answers to JSON string if provided
    const answersJson = answers ? JSON.stringify(answers) : null;
    
    const [result] = await pool.query(`
      UPDATE quizattempts SET 
        score = ?, answers = ?
      WHERE attempt_id = ?
    `, [score, answersJson, attemptId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating quiz attempt:', error);
    throw error;
  }
};

// Delete quiz attempt
const deleteQuizAttempt = async (pool, attemptId) => {
  try {
    const [result] = await pool.query('DELETE FROM quizattempts WHERE attempt_id = ?', [attemptId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting quiz attempt:', error);
    throw error;
  }
};

// Get user's best score for a quiz
const getUserBestScore = async (pool, userId, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT MAX(score) as best_score, COUNT(*) as attempts_count
      FROM quizattempts 
      WHERE user_id = ? AND quizzes_id = ?
    `, [userId, quizId]);
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching user best score:', error);
    throw error;
  }
};

// Get quiz statistics
const getQuizStatistics = async (pool, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        COUNT(DISTINCT user_id) as unique_users
      FROM quizattempts 
      WHERE quizzes_id = ?
    `, [quizId]);
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching quiz statistics:', error);
    throw error;
  }
};

module.exports = {
  getAllQuizAttempts,
  getQuizAttemptById,
  getQuizAttemptsByUser,
  getQuizAttemptsByQuiz,
  createQuizAttempt,
  updateQuizAttempt,
  deleteQuizAttempt,
  getUserBestScore,
  getQuizStatistics,
  // Return top performers across all quizzes (by average score). Returns rows with
  // user_id, first_name, last_name, attempts, avg_score, best_score
  getTopQuizPerformers: async (pool, limit = 5) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          COUNT(*) AS attempts,
          AVG(qa.score) AS avg_score,
          MAX(qa.score) AS best_score,
          (
            SELECT q.title
            FROM quizattempts qa2
            JOIN quizzes q ON qa2.quizzes_id = q.quizzes_id
            WHERE qa2.user_id = qa.user_id
            ORDER BY qa2.score DESC, qa2.timestamp DESC
            LIMIT 1
          ) AS best_quiz_title
        FROM quizattempts qa
        JOIN users u ON qa.user_id = u.user_id
        GROUP BY qa.user_id
        HAVING COUNT(*) > 0
        ORDER BY avg_score DESC, best_score DESC
        LIMIT ?
      `, [limit]);

      return rows;
    } catch (error) {
      console.error('Error fetching top quiz performers:', error);
      throw error;
    }
  }
};
