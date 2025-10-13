// Pre-assessment results related database queries

// Create new pre-assessment result
const createPreAssessmentResult = async (pool, resultData) => {
  try {
    const { 
      user_id, 
      pre_assessment_id, 
      score, 
      total_points, 
      percentage, 
      correct_answers, 
      total_questions, 
      time_taken_seconds,
      started_at,
      answers 
    } = resultData;
    
    console.log(`📝 Creating pre-assessment result for user ${user_id} on assessment ${pre_assessment_id}`);
    
    const query = `
      INSERT INTO pre_assessment_results (
        user_id, 
        pre_assessment_id, 
        score, 
        total_points, 
        percentage, 
        correct_answers, 
        total_questions, 
        time_taken_seconds,
        started_at,
        answers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      user_id, 
      pre_assessment_id, 
      score, 
      total_points, 
      percentage, 
      correct_answers, 
      total_questions, 
      time_taken_seconds,
      started_at,
      JSON.stringify(answers)
    ];
    
    const [result] = await pool.query(query, values);
    
    console.log(`✅ Pre-assessment result created with ID: ${result.insertId}`);
    
    return {
      id: result.insertId,
      user_id,
      pre_assessment_id,
      score,
      total_points,
      percentage,
      correct_answers,
      total_questions,
      time_taken_seconds,
      started_at,
      answers
    };
  } catch (error) {
    console.error('Error creating pre-assessment result:', error);
    throw error;
  }
};

// Get pre-assessment results by user ID
const getResultsByUserId = async (pool, userId) => {
  try {
    console.log(`🔍 Fetching pre-assessment results for user: ${userId}`);
    
    const query = `
      SELECT 
        par.id,
        par.user_id,
        par.pre_assessment_id,
        par.score,
        par.total_points,
        par.percentage,
        par.correct_answers,
        par.total_questions,
        par.time_taken_seconds,
        par.started_at,
        par.completed_at,
        par.answers,
        pa.title as assessment_title,
        pa.description as assessment_description,
        pa.program,
        pa.year_level,
        pa.difficulty,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        (
          SELECT GROUP_CONCAT(
            DISTINCT CONCAT(
              s.subject_id, ':', 
              REPLACE(REPLACE(s.subject_name, '"', ''), ',', ''), ':', 
              REPLACE(REPLACE(s.subject_code, '"', ''), ',', '')
            ) SEPARATOR '||'
          )
          FROM pre_assessment_questions paq
          INNER JOIN subjects s ON paq.subject_id = s.subject_id
          WHERE paq.pre_assessment_id = par.pre_assessment_id
        ) as subjects_covered
      FROM pre_assessment_results par
      LEFT JOIN pre_assessments pa ON par.pre_assessment_id = pa.id
      LEFT JOIN users u ON par.user_id = u.user_id
      WHERE par.user_id = ?
      ORDER BY par.completed_at DESC
    `;
    
    const [rows] = await pool.query(query, [userId]);
    
    // Parse subjects_covered from GROUP_CONCAT to JSON array
    rows.forEach(row => {
      if (row.subjects_covered) {
        try {
          // Format: "id:name:code||id:name:code"
          const subjectsArray = row.subjects_covered.split('||').map((item) => {
            const [subject_id, subject_name, subject_code] = item.split(':');
            return {
              subject_id: parseInt(subject_id),
              subject_name: subject_name || '',
              subject_code: subject_code || ''
            };
          });
          row.subjects_covered = subjectsArray;
        } catch (e) {
          console.warn('Failed to parse subjects_covered:', e, 'Raw value:', row.subjects_covered);
          row.subjects_covered = [];
        }
      } else {
        row.subjects_covered = [];
      }
    });
    
    console.log(`✅ Found ${rows.length} pre-assessment results for user ${userId}`);
    return rows;
  } catch (error) {
    console.error('Error fetching pre-assessment results by user ID:', error);
    throw error;
  }
};

// Get pre-assessment results by assessment ID
const getResultsByAssessmentId = async (pool, assessmentId) => {
  try {
    console.log(`🔍 Fetching results for pre-assessment: ${assessmentId}`);
    
    const query = `
      SELECT 
        par.id,
        par.user_id,
        par.pre_assessment_id,
        par.score,
        par.total_points,
        par.percentage,
        par.correct_answers,
        par.total_questions,
        par.time_taken_seconds,
        par.started_at,
        par.completed_at,
        pa.title as assessment_title,
        pa.description as assessment_description,
        pa.program,
        pa.year_level,
        pa.difficulty,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.program as user_program
      FROM pre_assessment_results par
      LEFT JOIN pre_assessments pa ON par.pre_assessment_id = pa.id
      LEFT JOIN users u ON par.user_id = u.user_id
      WHERE par.pre_assessment_id = ?
      ORDER BY par.percentage DESC, par.completed_at DESC
    `;
    
    const [rows] = await pool.query(query, [assessmentId]);
    
    console.log(`✅ Found ${rows.length} results for pre-assessment ${assessmentId}`);
    return rows;
  } catch (error) {
    console.error('Error fetching pre-assessment results by assessment ID:', error);
    throw error;
  }
};

// Get specific result by user and assessment
const getResultByUserAndAssessment = async (pool, userId, assessmentId) => {
  try {
    console.log(`🔍 Fetching result for user ${userId} on assessment ${assessmentId}`);
    
    const query = `
      SELECT 
        par.id,
        par.user_id,
        par.pre_assessment_id,
        par.score,
        par.total_points,
        par.percentage,
        par.correct_answers,
        par.total_questions,
        par.time_taken_seconds,
        par.started_at,
        par.completed_at,
        par.answers,
        pa.title as assessment_title,
        pa.description as assessment_description,
        pa.program,
        pa.year_level,
        pa.difficulty,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM pre_assessment_results par
      LEFT JOIN pre_assessments pa ON par.pre_assessment_id = pa.id
      LEFT JOIN users u ON par.user_id = u.user_id
      WHERE par.user_id = ? AND par.pre_assessment_id = ?
      ORDER BY par.completed_at DESC
      LIMIT 1
    `;
    
    const [rows] = await pool.query(query, [userId, assessmentId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching result by user and assessment:', error);
    throw error;
  }
};

// Get all pre-assessment results (admin view)
const getAllResults = async (pool) => {
  try {
    console.log('🔍 Fetching all pre-assessment results...');
    
    const query = `
      SELECT 
        par.id,
        par.user_id,
        par.pre_assessment_id,
        par.score,
        par.total_points,
        par.percentage,
        par.correct_answers,
        par.total_questions,
        par.time_taken_seconds,
        par.started_at,
        par.completed_at,
        pa.title as assessment_title,
        pa.description as assessment_description,
        pa.program,
        pa.year_level,
        pa.difficulty,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.program as user_program
      FROM pre_assessment_results par
      LEFT JOIN pre_assessments pa ON par.pre_assessment_id = pa.id
      LEFT JOIN users u ON par.user_id = u.user_id
      ORDER BY par.completed_at DESC
    `;
    
    const [rows] = await pool.query(query);
    
    console.log(`✅ Found ${rows.length} pre-assessment results`);
    return rows;
  } catch (error) {
    console.error('Error fetching all pre-assessment results:', error);
    throw error;
  }
};

// Delete pre-assessment result
const deleteResult = async (pool, resultId) => {
  try {
    console.log(`🗑️ Deleting pre-assessment result with ID: ${resultId}`);
    
    await pool.query('DELETE FROM pre_assessment_results WHERE id = ?', [resultId]);
    
    console.log(`✅ Pre-assessment result deleted: ${resultId}`);
    return true;
  } catch (error) {
    console.error('Error deleting pre-assessment result:', error);
    throw error;
  }
};

// Get statistics for a pre-assessment
const getAssessmentStatistics = async (pool, assessmentId) => {
  try {
    console.log(`📊 Fetching statistics for pre-assessment: ${assessmentId}`);
    
    const query = `
      SELECT 
        COUNT(*) as total_attempts,
        AVG(percentage) as average_percentage,
        MAX(percentage) as highest_percentage,
        MIN(percentage) as lowest_percentage,
        AVG(time_taken_seconds) as average_time_seconds,
        COUNT(CASE WHEN percentage >= 75 THEN 1 END) as passing_count
      FROM pre_assessment_results
      WHERE pre_assessment_id = ?
    `;
    
    const [rows] = await pool.query(query, [assessmentId]);
    
    console.log(`✅ Statistics calculated for pre-assessment ${assessmentId}`);
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching assessment statistics:', error);
    throw error;
  }
};

module.exports = {
  createPreAssessmentResult,
  getResultsByUserId,
  getResultsByAssessmentId,
  getResultByUserAndAssessment,
  getAllResults,
  deleteResult,
  getAssessmentStatistics
};