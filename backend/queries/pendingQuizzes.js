// Pending Quizzes database queries

// Get all pending quizzes
const getAllPendingQuizzes = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pq.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        u.email as creator_email,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.subject_code,
        s.subject_name
      FROM pending_quizzes pq
      LEFT JOIN users u ON pq.created_by = u.user_id
      LEFT JOIN users r ON pq.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pq.subject_id = s.subject_id
      ORDER BY pq.quizzes_id DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error fetching pending quizzes:', error);
    throw error;
  }
};

// Get pending quiz by ID
const getPendingQuizById = async (pool, quizId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pq.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        u.email as creator_email,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name
      FROM pending_quizzes pq
      LEFT JOIN users u ON pq.created_by = u.user_id
      LEFT JOIN users r ON pq.reviewed_by = r.user_id
      WHERE pq.quizzes_id = ?
    `, [quizId]);
    
    if (rows.length === 0) return null;
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching pending quiz:', error);
    throw error;
  }
};

// Create new pending quiz
const createPendingQuiz = async (pool, quizData) => {
  try {
    const {
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type,
      duration,
      duration_unit,
      difficulty,
      item_counts,
      program,
      quiz_view
    } = quizData;

    const [result] = await pool.query(`
      INSERT INTO pending_quizzes (
        title, subject_id, subject_name, description, 
        created_by, quiz_type, duration, duration_unit, 
        difficulty, item_counts, program, quiz_view, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type || 'practice',
      duration,
      duration_unit || 'minutes',
      difficulty,
      item_counts || 0,
      program || '',
      quiz_view || 'Personal'
    ]);

    return {
      quizzes_id: result.insertId,
      ...quizData,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error creating pending quiz:', error);
    throw error;
  }
};

// Update pending quiz status
const updatePendingQuizStatus = async (pool, quizId, status, reviewedBy = null, comment = null) => {
  try {
    const [result] = await pool.query(`
      UPDATE pending_quizzes 
      SET status = ?, reviewed_by = ?, reviewed_at = NOW(), comment = ?
      WHERE quizzes_id = ?
    `, [status, reviewedBy, comment, quizId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating pending quiz status:', error);
    throw error;
  }
};

// Delete pending quiz
const deletePendingQuiz = async (pool, quizId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM pending_quizzes WHERE quizzes_id = ?
    `, [quizId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting pending quiz:', error);
    throw error;
  }
};

// Get pending quizzes by status
const getPendingQuizzesByStatus = async (pool, status) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pq.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        u.email as creator_email,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.subject_code,
        s.subject_name
      FROM pending_quizzes pq
      LEFT JOIN users u ON pq.created_by = u.user_id
      LEFT JOIN users r ON pq.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pq.subject_id = s.subject_id
      WHERE pq.status = ?
      ORDER BY pq.quizzes_id DESC
    `, [status]);
    return rows;
  } catch (error) {
    console.error('Error fetching pending quizzes by status:', error);
    throw error;
  }
};

// Get pending quizzes by user
const getPendingQuizzesByUser = async (pool, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pq.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        u.email as creator_email,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.subject_code,
        s.subject_name
      FROM pending_quizzes pq
      LEFT JOIN users u ON pq.created_by = u.user_id
      LEFT JOIN users r ON pq.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pq.subject_id = s.subject_id
      WHERE pq.created_by = ?
      ORDER BY pq.quizzes_id DESC
    `, [userId]);
    return rows;
  } catch (error) {
    console.error('Error fetching pending quizzes by user:', error);
    throw error;
  }
};

// Transfer approved quiz to quizzes table
const transferToQuizzes = async (pool, pendingQuiz) => {
  try {
    const {
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type,
      duration,
      duration_unit,
      difficulty,
      item_counts,
      program,
      quiz_view
    } = pendingQuiz;

    const [result] = await pool.query(`
      INSERT INTO quizzes (
        title, subject_id, subject_name, description, 
        created_by, quiz_type, duration, duration_unit, 
        difficulty, item_counts, program, quiz_view
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type || 'practice',
      duration,
      duration_unit || 'minutes',
      difficulty,
      item_counts || 0,
      program || '',
      quiz_view || 'Personal'
    ]);

    return {
      quizzes_id: result.insertId,
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type,
      duration,
      duration_unit,
      difficulty,
      item_counts,
      program,
      quiz_view
    };
  } catch (error) {
    console.error('Error transferring to quizzes:', error);
    throw error;
  }
};

module.exports = {
  getAllPendingQuizzes,
  getPendingQuizById,
  createPendingQuiz,
  updatePendingQuizStatus,
  deletePendingQuiz,
  getPendingQuizzesByStatus,
  getPendingQuizzesByUser,
  transferToQuizzes
};
