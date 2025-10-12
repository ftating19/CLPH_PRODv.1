// Pre-assessment questions related database queries

// Get questions for a pre-assessment
const getQuestionsByPreAssessmentId = async (pool, preAssessmentId) => {
  try {
    console.log(`🔍 Fetching questions for pre-assessment ID: ${preAssessmentId}`);
    
    const [rows] = await pool.query(`
      SELECT 
        paq.id,
        paq.pre_assessment_id,
        paq.subject_id,
        paq.question_type,
        paq.question,
        paq.options,
        paq.correct_answer,
        paq.explanation,
        paq.points,
        paq.created_at,
        s.subject_name,
        s.subject_code
      FROM pre_assessment_questions paq
      LEFT JOIN subjects s ON paq.subject_id = s.subject_id
      WHERE paq.pre_assessment_id = ?
      ORDER BY paq.created_at ASC
    `, [preAssessmentId]);
    
    // Parse JSON options if they exist
    const processedRows = rows.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : null
    }));
    
    console.log(`✅ Found ${processedRows.length} questions for pre-assessment ${preAssessmentId}`);
    return processedRows;
  } catch (error) {
    console.error('Error fetching questions by pre-assessment ID:', error);
    throw error;
  }
};

// Get question by ID
const getPreAssessmentQuestionById = async (pool, questionId) => {
  try {
    console.log(`🔍 Fetching pre-assessment question with ID: ${questionId}`);
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        pre_assessment_id,
        question_type,
        question,
        options,
        correct_answer,
        explanation,
        points,
        created_at
      FROM pre_assessment_questions 
      WHERE id = ?
    `, [questionId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Parse JSON options if they exist
    const question = {
      ...rows[0],
      options: rows[0].options ? JSON.parse(rows[0].options) : null
    };
    
    return question;
  } catch (error) {
    console.error('Error fetching pre-assessment question by ID:', error);
    throw error;
  }
};

// Create new question for pre-assessment
const createPreAssessmentQuestion = async (pool, questionData) => {
  try {
    const { 
      pre_assessment_id, 
      question_type, 
      question, 
      options, 
      correct_answer, 
      explanation, 
      points,
      subject_id 
    } = questionData;
    
    console.log(`📝 Creating question for pre-assessment ID: ${pre_assessment_id}, subject ID: ${subject_id}`);
    
    // Convert options array to JSON string if it exists
    const optionsJson = options ? JSON.stringify(options) : null;
    
    const [result] = await pool.query(`
      INSERT INTO pre_assessment_questions (
        pre_assessment_id, 
        question_type, 
        question, 
        options, 
        correct_answer, 
        explanation, 
        points,
        subject_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [pre_assessment_id, question_type, question, optionsJson, correct_answer, explanation, points, subject_id]);
    
    console.log(`✅ Pre-assessment question created with ID: ${result.insertId}`);
    
    return {
      id: result.insertId,
      pre_assessment_id,
      question_type,
      question,
      options,
      correct_answer,
      explanation,
      points,
      subject_id
    };
  } catch (error) {
    console.error('Error creating pre-assessment question:', error);
    throw error;
  }
};

// Update pre-assessment question
const updatePreAssessmentQuestion = async (pool, questionId, questionData) => {
  try {
    const { 
      question_type, 
      question, 
      options, 
      correct_answer, 
      explanation, 
      points,
      subject_id 
    } = questionData;
    
    console.log(`📝 Updating pre-assessment question ID: ${questionId}, subject ID: ${subject_id}`);
    
    // Convert options array to JSON string if it exists
    const optionsJson = options ? JSON.stringify(options) : null;
    
    await pool.query(`
      UPDATE pre_assessment_questions SET 
        question_type = ?, 
        question = ?, 
        options = ?, 
        correct_answer = ?, 
        explanation = ?, 
        points = ?,
        subject_id = ?
      WHERE id = ?
    `, [question_type, question, optionsJson, correct_answer, explanation, points, subject_id, questionId]);
    
    console.log(`✅ Pre-assessment question updated: ${questionId}`);
    
    return {
      id: questionId,
      question_type,
      question,
      options,
      correct_answer,
      explanation,
      points,
      subject_id
    };
  } catch (error) {
    console.error('Error updating pre-assessment question:', error);
    throw error;
  }
};

// Delete pre-assessment question
const deletePreAssessmentQuestion = async (pool, questionId) => {
  try {
    console.log(`🗑️ Deleting pre-assessment question ID: ${questionId}`);
    
    await pool.query('DELETE FROM pre_assessment_questions WHERE id = ?', [questionId]);
    
    console.log(`✅ Pre-assessment question deleted: ${questionId}`);
    
    return { id: questionId };
  } catch (error) {
    console.error('Error deleting pre-assessment question:', error);
    throw error;
  }
};

// Delete all questions for a pre-assessment
const deleteQuestionsByPreAssessmentId = async (pool, preAssessmentId) => {
  try {
    console.log(`🗑️ Deleting all questions for pre-assessment ID: ${preAssessmentId}`);
    
    const [result] = await pool.query(
      'DELETE FROM pre_assessment_questions WHERE pre_assessment_id = ?', 
      [preAssessmentId]
    );
    
    console.log(`✅ Deleted ${result.affectedRows} questions for pre-assessment ${preAssessmentId}`);
    
    return { deletedCount: result.affectedRows };
  } catch (error) {
    console.error('Error deleting questions by pre-assessment ID:', error);
    throw error;
  }
};

// Bulk create questions for pre-assessment
const createPreAssessmentQuestions = async (pool, preAssessmentId, questions) => {
  try {
    console.log(`📝 Creating ${questions.length} questions for pre-assessment ID: ${preAssessmentId}`);
    
    if (questions.length === 0) {
      return [];
    }
    
    // Prepare values for batch insert
    const values = questions.map(q => [
      preAssessmentId,
      q.question_type || q.type,
      q.question,
      q.options ? JSON.stringify(q.options) : null,
      Array.isArray(q.correct_answer) ? q.correct_answer.join(',') : q.correct_answer,
      q.explanation || '',
      q.points || 1
    ]);
    
    const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();
    
    const [result] = await pool.query(`
      INSERT INTO pre_assessment_questions (
        pre_assessment_id, 
        question_type, 
        question, 
        options, 
        correct_answer, 
        explanation, 
        points
      ) VALUES ${placeholders}
    `, flatValues);
    
    console.log(`✅ Created ${result.affectedRows} questions for pre-assessment ${preAssessmentId}`);
    
    return { insertedCount: result.affectedRows, insertId: result.insertId };
  } catch (error) {
    console.error('Error creating pre-assessment questions:', error);
    throw error;
  }
};

module.exports = {
  getQuestionsByPreAssessmentId,
  getPreAssessmentQuestionById,
  createPreAssessmentQuestion,
  updatePreAssessmentQuestion,
  deletePreAssessmentQuestion,
  deleteQuestionsByPreAssessmentId,
  createPreAssessmentQuestions
};