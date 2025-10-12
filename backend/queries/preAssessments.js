// Pre-assessment related database queries

// Get all pre-assessments
const getAllPreAssessments = async (pool) => {
  try {
    console.log('🔍 Fetching all pre-assessments...');
    
    const [rows] = await pool.query(`
      SELECT 
        pa.id,
        pa.title,
        pa.subject_id,
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT q.id) as question_count
      FROM pre_assessments pa
      LEFT JOIN subjects s ON pa.subject_id = s.subject_id
      LEFT JOIN users u ON pa.created_by = u.user_id
      LEFT JOIN pre_assessment_questions q ON pa.id = q.pre_assessment_id
      GROUP BY pa.id
      ORDER BY pa.created_at DESC
    `);
    
    console.log(`✅ Found ${rows.length} pre-assessments`);
    return rows;
  } catch (error) {
    console.error('Error fetching pre-assessments:', error);
    throw error;
  }
};

// Get pre-assessment by ID
const getPreAssessmentById = async (pool, id) => {
  try {
    console.log(`🔍 Fetching pre-assessment with ID: ${id}`);
    
    const [rows] = await pool.query(`
      SELECT 
        pa.id,
        pa.title,
        pa.subject_id,
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name
      FROM pre_assessments pa
      LEFT JOIN subjects s ON pa.subject_id = s.subject_id
      LEFT JOIN users u ON pa.created_by = u.user_id
      WHERE pa.id = ?
    `, [id]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching pre-assessment by ID:', error);
    throw error;
  }
};

// Create new pre-assessment
const createPreAssessment = async (pool, preAssessmentData) => {
  try {
    const { 
      title, 
      subject_id, 
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty 
    } = preAssessmentData;
    
    console.log(`📝 Creating pre-assessment: ${title}`);
    
    const [result] = await pool.query(`
      INSERT INTO pre_assessments (
        title, 
        subject_id, 
        description, 
        created_by, 
        program, 
        year_level, 
        duration, 
        duration_unit, 
        difficulty,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [title, subject_id, description, created_by, program, year_level, duration, duration_unit, difficulty]);
    
    console.log(`✅ Pre-assessment created with ID: ${result.insertId}`);
    
    return {
      id: result.insertId,
      title,
      subject_id,
      description,
      created_by,
      program,
      year_level,
      duration,
      duration_unit,
      difficulty,
      status: 'active'
    };
  } catch (error) {
    console.error('Error creating pre-assessment:', error);
    throw error;
  }
};

// Update pre-assessment
const updatePreAssessment = async (pool, id, preAssessmentData) => {
  try {
    const { 
      title, 
      subject_id, 
      description, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty 
    } = preAssessmentData;
    
    console.log(`📝 Updating pre-assessment ID: ${id}`);
    
    await pool.query(`
      UPDATE pre_assessments SET 
        title = ?, 
        subject_id = ?, 
        description = ?, 
        program = ?, 
        year_level = ?, 
        duration = ?, 
        duration_unit = ?, 
        difficulty = ?
      WHERE id = ?
    `, [title, subject_id, description, program, year_level, duration, duration_unit, difficulty, id]);
    
    console.log(`✅ Pre-assessment updated: ${title}`);
    
    return {
      id,
      title,
      subject_id,
      description,
      program,
      year_level,
      duration,
      duration_unit,
      difficulty
    };
  } catch (error) {
    console.error('Error updating pre-assessment:', error);
    throw error;
  }
};

// Delete pre-assessment
const deletePreAssessment = async (pool, id) => {
  try {
    console.log(`🗑️ Deleting pre-assessment ID: ${id}`);
    
    // First delete associated questions
    await pool.query('DELETE FROM pre_assessment_questions WHERE pre_assessment_id = ?', [id]);
    
    // Then delete the pre-assessment
    await pool.query('DELETE FROM pre_assessments WHERE id = ?', [id]);
    
    console.log(`✅ Pre-assessment deleted: ${id}`);
    
    return { id };
  } catch (error) {
    console.error('Error deleting pre-assessment:', error);
    throw error;
  }
};

// Get pre-assessments by program
const getPreAssessmentsByProgram = async (pool, program) => {
  try {
    console.log(`🔍 Fetching pre-assessments for program: ${program}`);
    
    const [rows] = await pool.query(`
      SELECT 
        pa.id,
        pa.title,
        pa.subject_id,
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        s.subject_name,
        s.subject_code,
        COUNT(DISTINCT q.id) as question_count
      FROM pre_assessments pa
      LEFT JOIN subjects s ON pa.subject_id = s.subject_id
      LEFT JOIN pre_assessment_questions q ON pa.id = q.pre_assessment_id
      WHERE pa.program = ? AND pa.status = 'active'
      GROUP BY pa.id
      ORDER BY pa.created_at DESC
    `, [program]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching pre-assessments by program:', error);
    throw error;
  }
};

// Get pre-assessments by year level
const getPreAssessmentsByYearLevel = async (pool, yearLevel) => {
  try {
    console.log(`🔍 Fetching pre-assessments for year level: ${yearLevel}`);
    
    const [rows] = await pool.query(`
      SELECT 
        pa.id,
        pa.title,
        pa.subject_id,
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        s.subject_name,
        s.subject_code,
        COUNT(DISTINCT q.id) as question_count
      FROM pre_assessments pa
      LEFT JOIN subjects s ON pa.subject_id = s.subject_id
      LEFT JOIN pre_assessment_questions q ON pa.id = q.pre_assessment_id
      WHERE pa.year_level = ? AND pa.status = 'active'
      GROUP BY pa.id
      ORDER BY pa.created_at DESC
    `, [yearLevel]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching pre-assessments by year level:', error);
    throw error;
  }
};

module.exports = {
  getAllPreAssessments,
  getPreAssessmentById,
  createPreAssessment,
  updatePreAssessment,
  deletePreAssessment,
  getPreAssessmentsByProgram,
  getPreAssessmentsByYearLevel
};