// Flashcard Progress database queries

// Get all flashcard progress for a user
const getFlashcardProgressByUser = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        fp.progress_id,
        fp.flashcard_id,
        fp.user_id,
        fp.status,
        fp.completed_at,
        fp.created_at,
        fp.updated_at,
        f.question,
        f.answer,
        f.subject_id,
        s.subject_name
      FROM flashcardprogress fp
      LEFT JOIN flashcards f ON fp.flashcard_id = f.flashcard_id
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      WHERE fp.user_id = ?
      ORDER BY fp.updated_at DESC
    `, [userId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcard progress by user:', error);
    throw error;
  }
};

// Get flashcard progress for a specific flashcard and user
const getFlashcardProgress = async (pool, flashcardId, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        fp.progress_id,
        fp.flashcard_id,
        fp.user_id,
        fp.status,
        fp.completed_at,
        fp.created_at,
        fp.updated_at
      FROM flashcardprogress fp
      WHERE fp.flashcard_id = ? AND fp.user_id = ?
    `, [flashcardId, userId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching flashcard progress:', error);
    throw error;
  }
};

// Get all flashcards with progress for a user
const getFlashcardsWithProgress = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.flashcard_id,
        f.question,
        f.answer,
        f.subject_id,
        f.created_by,
        s.subject_name,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        fp.progress_id,
        fp.status,
        fp.completed_at,
        CASE 
          WHEN fp.status IS NULL THEN 'not_started'
          ELSE fp.status 
        END as progress_status
      FROM flashcards f
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      LEFT JOIN users u ON f.created_by = u.user_id
      LEFT JOIN flashcardprogress fp ON f.flashcard_id = fp.flashcard_id AND fp.user_id = ?
      ORDER BY f.flashcard_id DESC
    `, [userId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcards with progress:', error);
    throw error;
  }
};

// Create or update flashcard progress
const upsertFlashcardProgress = async (pool, progressData) => {
  try {
    const { flashcard_id, user_id, status } = progressData;
    const completed_at = status === 'completed' ? new Date() : null;

    const [result] = await pool.query(`
      INSERT INTO flashcardprogress (flashcard_id, user_id, status, completed_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        completed_at = VALUES(completed_at),
        updated_at = CURRENT_TIMESTAMP
    `, [flashcard_id, user_id, status, completed_at]);

    return {
      progress_id: result.insertId || result.insertId,
      flashcard_id,
      user_id,
      status,
      completed_at
    };
  } catch (error) {
    console.error('Error creating/updating flashcard progress:', error);
    throw error;
  }
};

// Mark flashcard as completed
const markFlashcardCompleted = async (pool, flashcardId, userId) => {
  try {
    return await upsertFlashcardProgress(pool, {
      flashcard_id: flashcardId,
      user_id: userId,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error marking flashcard as completed:', error);
    throw error;
  }
};

// Reset flashcard progress
const resetFlashcardProgress = async (pool, flashcardId, userId) => {
  try {
    return await upsertFlashcardProgress(pool, {
      flashcard_id: flashcardId,
      user_id: userId,
      status: 'not_started'
    });
  } catch (error) {
    console.error('Error resetting flashcard progress:', error);
    throw error;
  }
};

// Get flashcard progress statistics for a user
const getFlashcardProgressStats = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN fp.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN fp.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(f.flashcard_id) - COUNT(fp.progress_id) as not_started_count,
        COUNT(f.flashcard_id) as total_flashcards
      FROM flashcards f
      LEFT JOIN flashcardprogress fp ON f.flashcard_id = fp.flashcard_id AND fp.user_id = ?
    `, [userId]);
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching flashcard progress stats:', error);
    throw error;
  }
};

// Get flashcard progress statistics by subject for a user
const getFlashcardProgressStatsBySubject = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.subject_id,
        s.subject_name,
        COUNT(f.flashcard_id) as total_flashcards,
        COUNT(CASE WHEN fp.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN fp.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(f.flashcard_id) - COUNT(fp.progress_id) as not_started_count,
        ROUND(
          (COUNT(CASE WHEN fp.status = 'completed' THEN 1 END) / COUNT(f.flashcard_id)) * 100, 
          2
        ) as completion_percentage
      FROM subjects s
      LEFT JOIN flashcards f ON s.subject_id = f.subject_id
      LEFT JOIN flashcardprogress fp ON f.flashcard_id = fp.flashcard_id AND fp.user_id = ?
      GROUP BY s.subject_id, s.subject_name
      HAVING total_flashcards > 0
      ORDER BY completion_percentage DESC, s.subject_name
    `, [userId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcard progress stats by subject:', error);
    throw error;
  }
};

// Delete flashcard progress (when flashcard is deleted)
const deleteFlashcardProgress = async (pool, flashcardId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM flashcardprogress WHERE flashcard_id = ?
    `, [flashcardId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting flashcard progress:', error);
    throw error;
  }
};

module.exports = {
  getFlashcardProgressByUser,
  getFlashcardProgress,
  getFlashcardsWithProgress,
  upsertFlashcardProgress,
  markFlashcardCompleted,
  resetFlashcardProgress,
  getFlashcardProgressStats,
  getFlashcardProgressStatsBySubject,
  deleteFlashcardProgress
};
