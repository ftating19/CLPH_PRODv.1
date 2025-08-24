// Subjects Query Functions

// Get all subjects
const getAllSubjects = async (pool) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY subject_name ASC');
    return rows;
  } catch (error) {
    console.error('Error getting all subjects:', error);
    throw error;
  }
};

// Get subject by ID
const getSubjectById = async (pool, subjectId) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects WHERE subject_id = ?', [subjectId]);
    return rows[0];
  } catch (error) {
    console.error('Error getting subject by ID:', error);
    throw error;
  }
};

// Create new subject
const createSubject = async (pool, subjectData) => {
  try {
    const { subject_name, description, subject_code } = subjectData;
    
    const [result] = await pool.query(
      'INSERT INTO subjects (subject_name, description, subject_code) VALUES (?, ?, ?)',
      [subject_name, description, subject_code]
    );
    
    return {
      subject_id: result.insertId,
      subject_name,
      description,
      subject_code
    };
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
};

// Update subject
const updateSubject = async (pool, subjectId, subjectData) => {
  try {
    const { subject_name, description, subject_code } = subjectData;
    
    await pool.query(
      'UPDATE subjects SET subject_name = ?, description = ?, subject_code = ? WHERE subject_id = ?',
      [subject_name, description, subject_code, subjectId]
    );
    
    return {
      subject_id: subjectId,
      subject_name,
      description,
      subject_code
    };
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

// Delete subject
const deleteSubject = async (pool, subjectId) => {
  try {
    await pool.query('DELETE FROM subjects WHERE subject_id = ?', [subjectId]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
