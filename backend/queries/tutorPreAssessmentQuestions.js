// Tutor pre-assessment questions related database queries

// Get all questions for a tutor pre-assessment
const getTutorPreAssessmentQuestions = async (pool, preAssessmentId) => {
  try {
    console.log(`🔍 Fetching questions for tutor pre-assessment ID: ${preAssessmentId}`);
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        pre_assessment_id,
        question,
        question_type,
        options,
        correct_answer,
        explanation,
        points,
        difficulty,
        order_index,
        created_at,
        updated_at
      FROM tutor_pre_assessment_questions
      WHERE pre_assessment_id = ?
      ORDER BY order_index ASC, created_at ASC
    `, [preAssessmentId]);
    
    // Parse options JSON for each question
    const formattedRows = rows.map(row => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : null
    }));
    
    console.log(`✅ Found ${formattedRows.length} questions for tutor pre-assessment`);
    return formattedRows;
  } catch (error) {
    console.error('Error fetching tutor pre-assessment questions:', error);
    throw error;
  }
};

// Get question by ID
const getTutorPreAssessmentQuestionById = async (pool, id) => {
  try {
    console.log(`🔍 Fetching tutor pre-assessment question ID: ${id}`);
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        pre_assessment_id,
        question,
        question_type,
        options,
        correct_answer,
        explanation,
        points,
        difficulty,
        order_index,
        created_at,
        updated_at
      FROM tutor_pre_assessment_questions
      WHERE id = ?
    `, [id]);
    
    if (rows[0]) {
      // Parse options JSON
      rows[0].options = rows[0].options ? JSON.parse(rows[0].options) : null;
    }
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching tutor pre-assessment question by ID:', error);
    throw error;
  }
};

// Create new tutor pre-assessment question
const createTutorPreAssessmentQuestion = async (pool, questionData) => {
  try {
    const { 
      pre_assessment_id, 
      question_text, 
      question_type, 
      options, 
      correct_answer, 
      explanation, 
      points = 1,
      difficulty = 'medium',
      order_index = 0
    } = questionData;
    
    console.log(`📝 Creating question for tutor pre-assessment ID: ${pre_assessment_id}`);
    
    const query = `
      INSERT INTO tutor_pre_assessment_questions (
        pre_assessment_id, 
        question, 
        question_type, 
        options, 
        correct_answer, 
        explanation,
        points,
        difficulty,
        order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      pre_assessment_id, 
      question_text, 
      question_type, 
      JSON.stringify(options), // Store as JSON string
      correct_answer, 
      explanation,
      points,
      difficulty,
      order_index
    ];
    
    const [result] = await pool.query(query, values);
    
    console.log(`✅ Tutor pre-assessment question created with ID: ${result.insertId}`);
    
    return {
      id: result.insertId,
      pre_assessment_id,
      question: question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      points,
      difficulty,
      order_index
    };
  } catch (error) {
    console.error('Error creating tutor pre-assessment question:', error);
    throw error;
  }
};

// Update tutor pre-assessment question
const updateTutorPreAssessmentQuestion = async (pool, id, questionData) => {
  try {
    const { 
      question_text, 
      question_type, 
      options, 
      correct_answer, 
      explanation, 
      points,
      difficulty,
      order_index
    } = questionData;
    
    console.log(`📝 Updating tutor pre-assessment question ID: ${id}`);
    
    const query = `
      UPDATE tutor_pre_assessment_questions 
      SET question = ?, question_type = ?, options = ?, correct_answer = ?, 
          explanation = ?, points = ?, difficulty = ?, order_index = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const values = [
      question_text, 
      question_type, 
      JSON.stringify(options), // Store as JSON string
      correct_answer, 
      explanation, 
      points,
      difficulty,
      order_index,
      id
    ];
    
    const [result] = await pool.query(query, values);
    
    console.log(`✅ Tutor pre-assessment question updated: ${id}`);
    
    return {
      id,
      question: question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      points,
      difficulty,
      order_index
    };
  } catch (error) {
    console.error('Error updating tutor pre-assessment question:', error);
    throw error;
  }
};

// Delete tutor pre-assessment question
const deleteTutorPreAssessmentQuestion = async (pool, id) => {
  try {
    console.log(`🗑️ Deleting tutor pre-assessment question ID: ${id}`);
    
    const [result] = await pool.query('DELETE FROM tutor_pre_assessment_questions WHERE id = ?', [id]);
    
    console.log(`✅ Tutor pre-assessment question deleted: ${id}`);
    
    return { id, deleted: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error deleting tutor pre-assessment question:', error);
    throw error;
  }
};

// Bulk create questions for a tutor pre-assessment
const createTutorPreAssessmentQuestions = async (pool, preAssessmentId, questions) => {
  try {
    console.log(`📝 Creating ${questions.length} questions for tutor pre-assessment ID: ${preAssessmentId}`);
    
    const results = [];
    
    for (let i = 0; i < questions.length; i++) {
      const questionData = {
        ...questions[i],
        pre_assessment_id: preAssessmentId,
        order_index: i + 1 // Start from 1
      };
      
      const result = await createTutorPreAssessmentQuestion(pool, questionData);
      results.push(result);
    }
    
    console.log(`✅ Created ${results.length} questions for tutor pre-assessment`);
    return results;
  } catch (error) {
    console.error('Error bulk creating tutor pre-assessment questions:', error);
    throw error;
  }
};

// Delete all questions for a tutor pre-assessment
const deleteTutorPreAssessmentQuestions = async (pool, preAssessmentId) => {
  try {
    console.log(`🗑️ Deleting all questions for tutor pre-assessment ID: ${preAssessmentId}`);
    
    const [result] = await pool.query('DELETE FROM tutor_pre_assessment_questions WHERE pre_assessment_id = ?', [preAssessmentId]);
    
    console.log(`✅ Deleted ${result.affectedRows} questions for tutor pre-assessment`);
    
    return { preAssessmentId, deletedCount: result.affectedRows };
  } catch (error) {
    console.error('Error deleting tutor pre-assessment questions:', error);
    throw error;
  }
};

// Get question count for a tutor pre-assessment
const getTutorPreAssessmentQuestionCount = async (pool, preAssessmentId) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) as question_count
      FROM tutor_pre_assessment_questions
      WHERE pre_assessment_id = ?
    `, [preAssessmentId]);
    
    return rows[0].question_count;
  } catch (error) {
    console.error('Error getting tutor pre-assessment question count:', error);
    throw error;
  }
};

// Update question order
const updateTutorPreAssessmentQuestionOrder = async (pool, questions) => {
  try {
    console.log(`📝 Updating order for ${questions.length} tutor pre-assessment questions`);
    
    for (const question of questions) {
      await pool.query(
        'UPDATE tutor_pre_assessment_questions SET order_index = ? WHERE id = ?', 
        [question.order_index, question.id]
      );
    }
    
    console.log(`✅ Updated order for tutor pre-assessment questions`);
    return { success: true };
  } catch (error) {
    console.error('Error updating tutor pre-assessment question order:', error);
    throw error;
  }
};

module.exports = {
  getTutorPreAssessmentQuestions,
  getTutorPreAssessmentQuestionById,
  createTutorPreAssessmentQuestion,
  updateTutorPreAssessmentQuestion,
  deleteTutorPreAssessmentQuestion,
  createTutorPreAssessmentQuestions,
  deleteTutorPreAssessmentQuestions,
  getTutorPreAssessmentQuestionCount,
  updateTutorPreAssessmentQuestionOrder
};