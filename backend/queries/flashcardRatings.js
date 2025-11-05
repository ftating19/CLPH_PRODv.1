// Flashcard ratings database queries

// Get average rating for a flashcard
const getFlashcardAverageRating = async (pool, flashcardId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM flashcard_ratings
      WHERE flashcard_id = ?
    `, [flashcardId]);
    
    return {
      average_rating: parseFloat(parseFloat(rows[0].average_rating).toFixed(1)),
      total_ratings: rows[0].total_ratings
    };
  } catch (error) {
    console.error('Error fetching flashcard average rating:', error);
    throw error;
  }
};

// Get average rating for a flashcard set (by sub_id)
const getFlashcardSetAverageRating = async (pool, subId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(AVG(fr.rating), 0) as average_rating,
        COUNT(DISTINCT fr.user_id) as total_ratings
      FROM flashcard_ratings fr
      INNER JOIN flashcards f ON fr.flashcard_id = f.flashcard_id
      WHERE f.sub_id = ?
    `, [subId]);
    
    return {
      average_rating: parseFloat(parseFloat(rows[0].average_rating).toFixed(1)),
      total_ratings: rows[0].total_ratings
    };
  } catch (error) {
    console.error('Error fetching flashcard set average rating:', error);
    throw error;
  }
};

// Get user's rating for a flashcard
const getUserFlashcardRating = async (pool, flashcardId, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT rating, comment, created_at, updated_at
      FROM flashcard_ratings
      WHERE flashcard_id = ? AND user_id = ?
    `, [flashcardId, userId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching user flashcard rating:', error);
    throw error;
  }
};

// Get user's rating for a flashcard set (average of their ratings for cards in the set)
const getUserFlashcardSetRating = async (pool, subId, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        AVG(fr.rating) as user_average_rating,
        COUNT(*) as rated_cards_count
      FROM flashcard_ratings fr
      INNER JOIN flashcards f ON fr.flashcard_id = f.flashcard_id
      WHERE f.sub_id = ? AND fr.user_id = ?
    `, [subId, userId]);
    
    if (rows[0].user_average_rating === null) {
      return null;
    }
    
    return {
      rating: Math.round(rows[0].user_average_rating),
      rated_cards_count: rows[0].rated_cards_count
    };
  } catch (error) {
    console.error('Error fetching user flashcard set rating:', error);
    throw error;
  }
};

// Create or update flashcard rating
const upsertFlashcardRating = async (pool, flashcardId, userId, rating, comment = null) => {
  try {
    const [result] = await pool.query(`
      INSERT INTO flashcard_ratings (flashcard_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        rating = VALUES(rating),
        comment = VALUES(comment),
        updated_at = CURRENT_TIMESTAMP
    `, [flashcardId, userId, rating, comment]);
    
    return {
      rating_id: result.insertId || result.insertId,
      flashcard_id: flashcardId,
      user_id: userId,
      rating,
      comment
    };
  } catch (error) {
    console.error('Error creating/updating flashcard rating:', error);
    throw error;
  }
};

// Rate entire flashcard set (rate all cards in the set with same rating and comment)
const rateFlashcardSet = async (pool, subId, userId, rating, comment = null) => {
  try {
    // Get all flashcard IDs for this sub_id
    const [flashcards] = await pool.query(`
      SELECT flashcard_id FROM flashcards WHERE sub_id = ?
    `, [subId]);
    
    // Rate each flashcard
    const results = [];
    for (const flashcard of flashcards) {
      const result = await upsertFlashcardRating(pool, flashcard.flashcard_id, userId, rating, comment);
      results.push(result);
    }
    
    return {
      success: true,
      rated_count: results.length,
      sub_id: subId,
      rating,
      comment
    };
  } catch (error) {
    console.error('Error rating flashcard set:', error);
    throw error;
  }
};

// Delete flashcard rating
const deleteFlashcardRating = async (pool, flashcardId, userId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM flashcard_ratings
      WHERE flashcard_id = ? AND user_id = ?
    `, [flashcardId, userId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting flashcard rating:', error);
    throw error;
  }
};

// Get all ratings for a flashcard with user details
const getFlashcardRatings = async (pool, flashcardId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        fr.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM flashcard_ratings fr
      LEFT JOIN users u ON fr.user_id = u.user_id
      WHERE fr.flashcard_id = ?
      ORDER BY fr.created_at DESC
    `, [flashcardId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcard ratings:', error);
    throw error;
  }
};

module.exports = {
  getFlashcardAverageRating,
  getFlashcardSetAverageRating,
  getUserFlashcardRating,
  getUserFlashcardSetRating,
  upsertFlashcardRating,
  rateFlashcardSet,
  deleteFlashcardRating,
  getFlashcardRatings
};
