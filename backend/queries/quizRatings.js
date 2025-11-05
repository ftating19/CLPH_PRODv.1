// Quiz ratings database queries

// Get average rating for a quiz
const getQuizAverageRating = async (pool, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM quiz_ratings
      WHERE quiz_id = ?
    `, [quizId]);
    
    return {
      average_rating: parseFloat(parseFloat(rows[0].average_rating).toFixed(1)),
      total_ratings: rows[0].total_ratings
    };
  } catch (error) {
    console.error('Error fetching quiz average rating:', error);
    throw error;
  }
};

// Get user's rating for a quiz
const getUserQuizRating = async (pool, quizId, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT rating, comment, created_at, updated_at
      FROM quiz_ratings
      WHERE quiz_id = ? AND user_id = ?
    `, [quizId, userId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching user quiz rating:', error);
    throw error;
  }
};

// Create or update quiz rating
const upsertQuizRating = async (pool, quizId, userId, rating, comment = null) => {
  try {
    const [result] = await pool.query(`
      INSERT INTO quiz_ratings (quiz_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        rating = VALUES(rating),
        comment = VALUES(comment),
        updated_at = CURRENT_TIMESTAMP
    `, [quizId, userId, rating, comment]);
    
    return {
      rating_id: result.insertId || result.insertId,
      quiz_id: quizId,
      user_id: userId,
      rating,
      comment
    };
  } catch (error) {
    console.error('Error creating/updating quiz rating:', error);
    throw error;
  }
};

// Delete quiz rating
const deleteQuizRating = async (pool, quizId, userId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM quiz_ratings
      WHERE quiz_id = ? AND user_id = ?
    `, [quizId, userId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting quiz rating:', error);
    throw error;
  }
};

// Get all ratings for a quiz with user details
const getQuizRatings = async (pool, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        qr.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM quiz_ratings qr
      LEFT JOIN users u ON qr.user_id = u.user_id
      WHERE qr.quiz_id = ?
      ORDER BY qr.created_at DESC
    `, [quizId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching quiz ratings:', error);
    throw error;
  }
};

module.exports = {
  getQuizAverageRating,
  getUserQuizRating,
  upsertQuizRating,
  deleteQuizRating,
  getQuizRatings
};
