// Pre-assessment related database queries

// Get all pre-assessments
const getAllPreAssessments = async (pool) => {
  try {
    console.log('🔍 Fetching all pre-assessments...');
    
    const query = `
      SELECT 
        pa.id,
        pa.title,
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        pa.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(DISTINCT q.id) as question_count
      FROM pre_assessments pa
      LEFT JOIN users u ON pa.created_by = u.user_id
      LEFT JOIN pre_assessment_questions q ON pa.id = q.pre_assessment_id
      GROUP BY pa.id, pa.title, pa.description, pa.created_by, 
               pa.program, pa.year_level, pa.duration, pa.duration_unit, 
               pa.difficulty, pa.status, pa.created_at, pa.updated_at,
               u.first_name, u.last_name
      ORDER BY pa.created_at DESC
    `;
    
    const [rows] = await pool.query(query);
    
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
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        pa.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM pre_assessments pa
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
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty 
    } = preAssessmentData;
    
    console.log(`📝 Creating pre-assessment: ${title}`);
    
    const query = `
      INSERT INTO pre_assessments (
        title, 
        description, 
        created_by, 
        program, 
        year_level, 
        duration, 
        duration_unit, 
        difficulty,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    
    const values = [
      title, 
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty
    ];
    
    const [result] = await pool.query(query, values);
    
    console.log(`✅ Pre-assessment created with ID: ${result.insertId}`);
    
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
        description = ?, 
        program = ?, 
        year_level = ?, 
        duration = ?, 
        duration_unit = ?, 
        difficulty = ?
      WHERE id = ?
    `, [title, description, program, year_level, duration, duration_unit, difficulty, id]);
    
    console.log(`✅ Pre-assessment updated: ${title}`);
    
    return {
      id,
      title,
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
    console.log(`🗑️ Deleting pre-assessment with ID: ${id}`);
    
    await pool.query('DELETE FROM pre_assessments WHERE id = ?', [id]);
    
    console.log(`✅ Pre-assessment deleted: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting pre-assessment:', error);
    throw error;
  }
};

// Update pre-assessment status
const updatePreAssessmentStatus = async (pool, id, status) => {
  try {
    console.log(`📝 Updating pre-assessment status for ID: ${id} to ${status}`);
    
    await pool.query('UPDATE pre_assessments SET status = ? WHERE id = ?', [status, id]);
    
    console.log(`✅ Pre-assessment status updated: ${id} -> ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating pre-assessment status:', error);
    throw error;
  }
};

module.exports = {
  getAllPreAssessments,
  getPreAssessmentById,
  createPreAssessment,
  updatePreAssessment,
  deletePreAssessment,
  updatePreAssessmentStatus
};