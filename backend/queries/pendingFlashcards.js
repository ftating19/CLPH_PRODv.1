// Pending Flashcards database queries

// Get all pending flashcards
const getAllPendingFlashcards = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pf.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        u.email as creator_email,
        u.role as creator_role,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.subject_code,
        s.subject_name
      FROM pending_flashcards pf
      LEFT JOIN users u ON pf.created_by = u.user_id
      LEFT JOIN users r ON pf.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pf.subject_id = s.subject_id
      ORDER BY pf.flashcard_id DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error fetching pending flashcards:', error);
    throw error;
  }
};

// Get pending flashcard by ID
const getPendingFlashcardById = async (pool, flashcardId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pf.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        u.email as creator_email,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name
      FROM pending_flashcards pf
      LEFT JOIN users u ON pf.created_by = u.user_id
      LEFT JOIN users r ON pf.reviewed_by = r.user_id
      WHERE pf.flashcard_id = ?
    `, [flashcardId]);
    
    if (rows.length === 0) return null;
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching pending flashcard:', error);
    throw error;
  }
};

// Create new pending flashcard
const createPendingFlashcard = async (pool, flashcardData) => {
  try {
    const {
      question,
      answer,
      subject_id,
      created_by,
      sub_id,
      program,
      flashcard_view
    } = flashcardData;

    const [result] = await pool.query(`
      INSERT INTO pending_flashcards (
        question, answer, subject_id, created_by, sub_id, program, flashcard_view, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      question,
      answer,
      subject_id,
      created_by,
      sub_id,
      program || '',
      flashcard_view || 'Personal'
    ]);

    return {
      flashcard_id: result.insertId,
      ...flashcardData,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error creating pending flashcard:', error);
    throw error;
  }
};

// Update pending flashcard status
const updatePendingFlashcardStatus = async (pool, flashcardId, status, reviewedBy = null) => {
  try {
    const [result] = await pool.query(`
      UPDATE pending_flashcards 
      SET status = ?, reviewed_by = ?, reviewed_at = NOW()
      WHERE flashcard_id = ?
    `, [status, reviewedBy, flashcardId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating pending flashcard status:', error);
    throw error;
  }
};

// Delete pending flashcard
const deletePendingFlashcard = async (pool, flashcardId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM pending_flashcards WHERE flashcard_id = ?
    `, [flashcardId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting pending flashcard:', error);
    throw error;
  }
};

// Get pending flashcards by status
const getPendingFlashcardsByStatus = async (pool, status) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pf.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        u.email as creator_email,
        u.role as creator_role,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.subject_code,
        s.subject_name
      FROM pending_flashcards pf
      LEFT JOIN users u ON pf.created_by = u.user_id
      LEFT JOIN users r ON pf.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pf.subject_id = s.subject_id
      WHERE pf.status = ?
      ORDER BY pf.flashcard_id DESC
    `, [status]);
    return rows;
  } catch (error) {
    console.error('Error fetching pending flashcards by status:', error);
    throw error;
  }
};

// Transfer approved flashcard to flashcards table
const transferToFlashcards = async (pool, pendingFlashcard) => {
  try {
    const {
      question,
      answer,
      subject_id,
      created_by,
      sub_id,
      program,
      flashcard_view
    } = pendingFlashcard;

    const [result] = await pool.query(`
      INSERT INTO flashcards (
        question, answer, subject_id, created_by, sub_id, program, flashcard_view
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      question,
      answer,
      subject_id,
      created_by,
      sub_id,
      program || '',
      flashcard_view || 'Personal'
    ]);

    return {
      flashcard_id: result.insertId,
      question,
      answer,
      subject_id,
      created_by,
      sub_id,
      program,
      flashcard_view
    };
  } catch (error) {
    console.error('Error transferring to flashcards:', error);
    throw error;
  }
};

// Get pending flashcards by sub_id (for grouped flashcards)
const getPendingFlashcardsBySubId = async (pool, subId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pf.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        u.role as creator_role,
        s.subject_name
      FROM pending_flashcards pf
      LEFT JOIN users u ON pf.created_by = u.user_id
      LEFT JOIN subjects s ON pf.subject_id = s.subject_id
      WHERE pf.sub_id = ? AND pf.status = 'pending'
      ORDER BY pf.flashcard_id ASC
    `, [subId]);
    return rows;
  } catch (error) {
    console.error('Error fetching pending flashcards by sub_id:', error);
    throw error;
  }
};

// Get pending flashcards by user
const getPendingFlashcardsByUser = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pf.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        u.email as creator_email,
        u.role as creator_role,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.subject_code,
        s.subject_name
      FROM pending_flashcards pf
      LEFT JOIN users u ON pf.created_by = u.user_id
      LEFT JOIN users r ON pf.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pf.subject_id = s.subject_id
      WHERE pf.created_by = ?
      ORDER BY pf.flashcard_id DESC
    `, [userId]);
    return rows;
  } catch (error) {
    console.error('Error fetching pending flashcards by user:', error);
    throw error;
  }
};

module.exports = {
  getAllPendingFlashcards,
  getPendingFlashcardById,
  createPendingFlashcard,
  updatePendingFlashcardStatus,
  deletePendingFlashcard,
  getPendingFlashcardsByStatus,
  transferToFlashcards,
  getPendingFlashcardsBySubId,
  getPendingFlashcardsByUser
};
