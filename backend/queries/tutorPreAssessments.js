// Tutor pre-assessment related database queries

// Get all tutor pre-assessments
const getAllTutorPreAssessments = async (pool, createdBy = null) => {
  try {
    console.log('🔍 Fetching tutor pre-assessments...');
    
    let query = `
      SELECT 
        tpa.id,
        tpa.title,
        tpa.description,
        tpa.created_by,
        tpa.program,
        tpa.year_level,
        tpa.duration,
        tpa.duration_unit,
        tpa.difficulty,
        tpa.status,
        tpa.assessment_type,
        tpa.subject_id,
        tpa.created_at,
        tpa.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(DISTINCT q.id) as question_count
      FROM tutor_pre_assessments tpa
      LEFT JOIN users u ON tpa.created_by = u.user_id
      LEFT JOIN tutor_pre_assessment_questions q ON tpa.id = q.pre_assessment_id
    `;
    
    let params = [];
    
    if (createdBy) {
      query += ' WHERE tpa.created_by = ?';
      params.push(createdBy);
    }
    
    query += `
      GROUP BY tpa.id, tpa.title, tpa.description, tpa.created_by, 
               tpa.program, tpa.year_level, tpa.duration, tpa.duration_unit, 
               tpa.difficulty, tpa.status, tpa.assessment_type, tpa.subject_id, tpa.created_at, tpa.updated_at,
               u.first_name, u.last_name
      ORDER BY tpa.created_at DESC
    `;
    
    const [rows] = await pool.query(query, params);
    
    console.log(`✅ Found ${rows.length} tutor pre-assessments`);
    return rows;
  } catch (error) {
    console.error('Error fetching tutor pre-assessments:', error);
    throw error;
  }
};

// Get tutor pre-assessment by ID
const getTutorPreAssessmentById = async (pool, id) => {
  try {
    console.log(`🔍 Fetching tutor pre-assessment ID: ${id}`);
    
    const [rows] = await pool.query(`
      SELECT 
        tpa.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM tutor_pre_assessments tpa
      LEFT JOIN users u ON tpa.created_by = u.user_id
      WHERE tpa.id = ?
    `, [id]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching tutor pre-assessment by ID:', error);
    throw error;
  }
};

// Create new tutor pre-assessment
const createTutorPreAssessment = async (pool, preAssessmentData) => {
  try {
    const { 
      title, 
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty,
      subject_id,
      assessment_type = 'tutor'
    } = preAssessmentData;
    
    console.log(`📝 Creating tutor pre-assessment: ${title}`);
    
    const query = `
      INSERT INTO tutor_pre_assessments (
        title, 
        description, 
        created_by, 
        program, 
        year_level, 
        duration, 
        duration_unit, 
        difficulty,
        subject_id,
        assessment_type,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    
    const values = [
      title, 
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty,
      subject_id,
      assessment_type
    ];
    
    const [result] = await pool.query(query, values);
    
    console.log(`✅ Tutor pre-assessment created with ID: ${result.insertId}`);
    
    return {
      id: result.insertId,
      title,
      description,
      created_by,
      program,
      year_level,
      duration,
      duration_unit,
      difficulty,
      subject_id,
      assessment_type,
      status: 'active'
    };
  } catch (error) {
    console.error('Error creating tutor pre-assessment:', error);
    throw error;
  }
};

// Update tutor pre-assessment
const updateTutorPreAssessment = async (pool, id, preAssessmentData) => {
  try {
    const { 
      title, 
      description, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty,
      subject_id 
    } = preAssessmentData;
    
    console.log(`📝 Updating tutor pre-assessment ID: ${id}`);
    
    const query = `
      UPDATE tutor_pre_assessments 
      SET title = ?, description = ?, program = ?, year_level = ?, 
          duration = ?, duration_unit = ?, difficulty = ?, subject_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const values = [
      title, 
      description, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty,
      subject_id, 
      id
    ];
    
    const [result] = await pool.query(query, values);
    
    console.log(`✅ Tutor pre-assessment updated: ${id}`);
    
    return {
      id,
      title,
      description,
      program,
      year_level,
      duration,
      duration_unit,
      difficulty,
      subject_id
    };
  } catch (error) {
    console.error('Error updating tutor pre-assessment:', error);
    throw error;
  }
};

// Delete tutor pre-assessment
const deleteTutorPreAssessment = async (pool, id) => {
  try {
    console.log(`🗑️ Deleting tutor pre-assessment ID: ${id}`);
    
    // Delete associated questions first (cascade should handle this, but let's be explicit)
    await pool.query('DELETE FROM tutor_pre_assessment_questions WHERE pre_assessment_id = ?', [id]);
    
    // Delete the pre-assessment
    const [result] = await pool.query('DELETE FROM tutor_pre_assessments WHERE id = ?', [id]);
    
    console.log(`✅ Tutor pre-assessment deleted: ${id}`);
    
    return { id, deleted: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error deleting tutor pre-assessment:', error);
    throw error;
  }
};

// Get tutor pre-assessments by program
const getTutorPreAssessmentsByProgram = async (pool, program) => {
  try {
    console.log(`🔍 Fetching tutor pre-assessments for program: ${program}`);
    
    const [rows] = await pool.query(`
      SELECT 
        tpa.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(DISTINCT q.id) as question_count
      FROM tutor_pre_assessments tpa
      LEFT JOIN users u ON tpa.created_by = u.user_id
      LEFT JOIN tutor_pre_assessment_questions q ON tpa.id = q.pre_assessment_id
      WHERE tpa.program = ? AND tpa.status = 'active'
      GROUP BY tpa.id, tpa.title, tpa.description, tpa.created_by, 
               tpa.program, tpa.year_level, tpa.duration, tpa.duration_unit, 
               tpa.difficulty, tpa.status, tpa.subject_id, tpa.created_at, tpa.updated_at,
               u.first_name, u.last_name
      ORDER BY tpa.created_at DESC
    `, [program]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching tutor pre-assessments by program:', error);
    throw error;
  }
};

// Get tutor pre-assessments by year level
const getTutorPreAssessmentsByYearLevel = async (pool, yearLevel) => {
  try {
    console.log(`🔍 Fetching tutor pre-assessments for year level: ${yearLevel}`);
    
    const [rows] = await pool.query(`
      SELECT 
        tpa.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(DISTINCT q.id) as question_count
      FROM tutor_pre_assessments tpa
      LEFT JOIN users u ON tpa.created_by = u.user_id
      LEFT JOIN tutor_pre_assessment_questions q ON tpa.id = q.pre_assessment_id
      WHERE tpa.year_level = ? AND tpa.status = 'active'
      GROUP BY tpa.id, tpa.title, tpa.description, tpa.created_by, 
               tpa.program, tpa.year_level, tpa.duration, tpa.duration_unit, 
               tpa.difficulty, tpa.status, tpa.subject_id, tpa.created_at, tpa.updated_at,
               u.first_name, u.last_name
      ORDER BY tpa.created_at DESC
    `, [yearLevel]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching tutor pre-assessments by year level:', error);
    throw error;
  }
};

module.exports = {
  getAllTutorPreAssessments,
  getTutorPreAssessmentById,
  createTutorPreAssessment,
  updateTutorPreAssessment,
  deleteTutorPreAssessment,
  getTutorPreAssessmentsByProgram,
  getTutorPreAssessmentsByYearLevel
};