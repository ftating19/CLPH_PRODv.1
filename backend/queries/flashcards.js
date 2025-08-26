// Flashcards database queries

// Get all flashcards
const getAllFlashcards = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.flashcard_id,
        f.question,
        f.answer,
        f.subject_id,
        f.created_by,
        s.subject_name,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name
      FROM flashcards f
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      LEFT JOIN users u ON f.created_by = u.user_id
      ORDER BY f.flashcard_id DESC
    `);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    throw error;
  }
};

// Get all flashcards with progress for a specific user
const getAllFlashcardsWithProgress = async (pool, userId) => {
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
        fp.status as progress_status,
        fp.completed_at,
        CASE 
          WHEN fp.status IS NULL THEN 'not_started'
          ELSE fp.status 
        END as status
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

// Get flashcard by ID
const getFlashcardById = async (pool, flashcardId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.flashcard_id,
        f.question,
        f.answer,
        f.subject_id,
        f.created_by,
        s.subject_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM flashcards f
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      LEFT JOIN users u ON f.created_by = u.user_id
      WHERE f.flashcard_id = ?
    `, [flashcardId]);
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching flashcard by ID:', error);
    throw error;
  }
};

// Get flashcards by subject
const getFlashcardsBySubject = async (pool, subjectId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.flashcard_id,
        f.question,
        f.answer,
        f.subject_id,
        f.created_by,
        s.subject_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM flashcards f
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      LEFT JOIN users u ON f.created_by = u.user_id
      WHERE f.subject_id = ?
      ORDER BY f.flashcard_id DESC
    `, [subjectId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcards by subject:', error);
    throw error;
  }
};

// Get flashcards by creator
const getFlashcardsByCreator = async (pool, createdBy) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.flashcard_id,
        f.question,
        f.answer,
        f.subject_id,
        f.created_by,
        s.subject_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM flashcards f
      LEFT JOIN subjects s ON f.subject_id = s.subject_id
      LEFT JOIN users u ON f.created_by = u.user_id
      WHERE f.created_by = ?
      ORDER BY f.flashcard_id DESC
    `, [createdBy]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching flashcards by creator:', error);
    throw error;
  }
};

// Create new flashcard
const createFlashcard = async (pool, flashcardData) => {
  try {
    const { question, answer, subject_id, created_by } = flashcardData;

    const [result] = await pool.query(`
      INSERT INTO flashcards (question, answer, subject_id, created_by)
      VALUES (?, ?, ?, ?)
    `, [question, answer, subject_id, created_by]);

    return {
      flashcard_id: result.insertId,
      question,
      answer,
      subject_id,
      created_by
    };
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
};

// Update flashcard
const updateFlashcard = async (pool, flashcardId, flashcardData) => {
  try {
    const { question, answer, subject_id } = flashcardData;

    const [result] = await pool.query(`
      UPDATE flashcards 
      SET question = ?, answer = ?, subject_id = ?
      WHERE flashcard_id = ?
    `, [question, answer, subject_id, flashcardId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
};

// Delete flashcard
const deleteFlashcard = async (pool, flashcardId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM flashcards WHERE flashcard_id = ?
    `, [flashcardId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
};

module.exports = {
  getAllFlashcards,
  getAllFlashcardsWithProgress,
  getFlashcardById,
  getFlashcardsBySubject,
  getFlashcardsByCreator,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard
};
