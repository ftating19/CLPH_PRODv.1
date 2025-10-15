// backend/queries/pendingPostTests.js
// Pending Post-Tests database queries for faculty approval workflow

// Get all pending post-tests
const getAllPendingPostTests = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ppt.*,
        CONCAT(t.first_name, ' ', t.last_name) as tutor_name,
        t.email as tutor_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        sub.subject_code,
        sub.subject_name as full_subject_name,
        b.start_date,
        b.end_date,
        b.preferred_time
      FROM pending_post_tests ppt
      LEFT JOIN users t ON ppt.tutor_id = t.user_id
      LEFT JOIN users s ON ppt.student_id = s.user_id
      LEFT JOIN users r ON ppt.reviewed_by = r.user_id
      LEFT JOIN subjects sub ON ppt.subject_id = sub.subject_id
      LEFT JOIN bookings b ON ppt.booking_id = b.booking_id
      ORDER BY ppt.created_at DESC
    `);
    
    // Map pending_post_test_id to id for frontend compatibility
    return rows.map(row => ({
      ...row,
      id: row.pending_post_test_id
    }));
  } catch (error) {
    console.error('Error fetching pending post-tests:', error);
    throw error;
  }
};

// Get pending post-test by ID
const getPendingPostTestById = async (pool, pendingPostTestId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ppt.*,
        CONCAT(t.first_name, ' ', t.last_name) as tutor_name,
        t.email as tutor_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        sub.subject_code,
        sub.subject_name as full_subject_name,
        b.start_date,
        b.end_date,
        b.preferred_time
      FROM pending_post_tests ppt
      LEFT JOIN users t ON ppt.tutor_id = t.user_id
      LEFT JOIN users s ON ppt.student_id = s.user_id
      LEFT JOIN users r ON ppt.reviewed_by = r.user_id
      LEFT JOIN subjects sub ON ppt.subject_id = sub.subject_id
      LEFT JOIN bookings b ON ppt.booking_id = b.booking_id
      WHERE ppt.pending_post_test_id = ?
    `, [pendingPostTestId]);
    
    if (rows.length === 0) return null;
    
    const result = rows[0];
    result.id = result.pending_post_test_id; // Map pending_post_test_id to id for frontend compatibility
    return result;
  } catch (error) {
    console.error('Error fetching pending post-test:', error);
    throw error;
  }
};

// Create new pending post-test
const createPendingPostTest = async (pool, postTestData) => {
  try {
    const {
      booking_id,
      tutor_id,
      student_id,
      title,
      description,
      subject_id,
      subject_name,
      time_limit,
      passing_score
    } = postTestData;

    const [result] = await pool.query(`
      INSERT INTO pending_post_tests (
        booking_id, tutor_id, student_id, title, description, 
        subject_id, subject_name, time_limit, passing_score, 
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      booking_id,
      tutor_id,
      student_id,
      title,
      description || null,
      subject_id,
      subject_name,
      time_limit || 30,
      passing_score || 70
    ]);

    return {
      pending_post_test_id: result.insertId,
      id: result.insertId,
      ...postTestData,
      status: 'pending',
      total_questions: 0
    };
  } catch (error) {
    console.error('Error creating pending post-test:', error);
    throw error;
  }
};

// Update pending post-test status (approve/reject)
const updatePendingPostTestStatus = async (pool, pendingPostTestId, status, reviewedBy = null, comment = null) => {
  try {
    const [result] = await pool.query(`
      UPDATE pending_post_tests 
      SET status = ?, reviewed_by = ?, reviewed_at = NOW(), comment = ?
      WHERE pending_post_test_id = ?
    `, [status, reviewedBy, comment, pendingPostTestId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating pending post-test status:', error);
    throw error;
  }
};

// Update total questions count
const updatePendingPostTestQuestionCount = async (pool, pendingPostTestId) => {
  try {
    const [result] = await pool.query(`
      UPDATE pending_post_tests 
      SET total_questions = (
        SELECT COUNT(*) FROM pending_post_test_questions 
        WHERE pending_post_test_id = ?
      )
      WHERE pending_post_test_id = ?
    `, [pendingPostTestId, pendingPostTestId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating pending post-test question count:', error);
    throw error;
  }
};

// Delete pending post-test
const deletePendingPostTest = async (pool, pendingPostTestId) => {
  try {
    // Questions will be cascade deleted due to foreign key constraint
    const [result] = await pool.query(`
      DELETE FROM pending_post_tests WHERE pending_post_test_id = ?
    `, [pendingPostTestId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting pending post-test:', error);
    throw error;
  }
};

// Get pending post-tests by status
const getPendingPostTestsByStatus = async (pool, status) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ppt.*,
        CONCAT(t.first_name, ' ', t.last_name) as tutor_name,
        t.email as tutor_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        sub.subject_code,
        sub.subject_name as full_subject_name,
        b.start_date,
        b.end_date,
        b.preferred_time
      FROM pending_post_tests ppt
      LEFT JOIN users t ON ppt.tutor_id = t.user_id
      LEFT JOIN users s ON ppt.student_id = s.user_id
      LEFT JOIN users r ON ppt.reviewed_by = r.user_id
      LEFT JOIN subjects sub ON ppt.subject_id = sub.subject_id
      LEFT JOIN bookings b ON ppt.booking_id = b.booking_id
      WHERE ppt.status = ?
      ORDER BY ppt.created_at DESC
    `, [status]);
    
    return rows.map(row => ({
      ...row,
      id: row.pending_post_test_id
    }));
  } catch (error) {
    console.error('Error fetching pending post-tests by status:', error);
    throw error;
  }
};

// Get pending post-tests by subject (for faculty assigned to specific subject)
const getPendingPostTestsBySubject = async (pool, subjectId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ppt.*,
        CONCAT(t.first_name, ' ', t.last_name) as tutor_name,
        t.email as tutor_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        sub.subject_code,
        sub.subject_name as full_subject_name,
        b.start_date,
        b.end_date,
        b.preferred_time
      FROM pending_post_tests ppt
      LEFT JOIN users t ON ppt.tutor_id = t.user_id
      LEFT JOIN users s ON ppt.student_id = s.user_id
      LEFT JOIN users r ON ppt.reviewed_by = r.user_id
      LEFT JOIN subjects sub ON ppt.subject_id = sub.subject_id
      LEFT JOIN bookings b ON ppt.booking_id = b.booking_id
      WHERE ppt.subject_id = ? AND ppt.status = 'pending'
      ORDER BY ppt.created_at DESC
    `, [subjectId]);
    
    return rows.map(row => ({
      ...row,
      id: row.pending_post_test_id
    }));
  } catch (error) {
    console.error('Error fetching pending post-tests by subject:', error);
    throw error;
  }
};

// Transfer approved post-test to post_tests table
const transferToPostTests = async (pool, pendingPostTest) => {
  try {
    const {
      booking_id,
      tutor_id,
      student_id,
      title,
      description,
      subject_id,
      subject_name,
      time_limit,
      passing_score,
      total_questions
    } = pendingPostTest;

    console.log('=== TRANSFER TO POST_TESTS DEBUG ===');
    console.log('Pending Post-Test:', pendingPostTest);
    console.log('=====================================');

    // Insert into post_tests
    const [result] = await pool.query(`
      INSERT INTO post_tests (
        booking_id, tutor_id, student_id, title, description, 
        subject_id, subject_name, time_limit, passing_score, 
        total_questions, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())
    `, [
      booking_id,
      tutor_id,
      student_id,
      title,
      description,
      subject_id,
      subject_name,
      time_limit,
      passing_score,
      total_questions
    ]);

    const newPostTestId = result.insertId;

    // Transfer questions from pending_post_test_questions to post_test_questions
    await pool.query(`
      INSERT INTO post_test_questions (
        post_test_id, question_text, question_type, options, 
        correct_answer, points, explanation, order_number
      )
      SELECT 
        ? as post_test_id, question_text, question_type, options, 
        correct_answer, points, explanation, order_number
      FROM pending_post_test_questions
      WHERE pending_post_test_id = ?
      ORDER BY order_number
    `, [newPostTestId, pendingPostTest.pending_post_test_id]);

    return {
      post_test_id: newPostTestId,
      ...pendingPostTest,
      status: 'draft'
    };
  } catch (error) {
    console.error('Error transferring to post_tests:', error);
    throw error;
  }
};

module.exports = {
  getAllPendingPostTests,
  getPendingPostTestById,
  createPendingPostTest,
  updatePendingPostTestStatus,
  updatePendingPostTestQuestionCount,
  deletePendingPostTest,
  getPendingPostTestsByStatus,
  getPendingPostTestsBySubject,
  transferToPostTests
};
