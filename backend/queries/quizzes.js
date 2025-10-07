// Quiz-related database queries

// Get all quizzes
const getAllQuizzes = async (pool) => {
  try {
    console.log('🔍 Fetching all quizzes...');
    
    // First try with duration_unit column
    try {
      const [rows] = await pool.query(`
        SELECT 
          q.quizzes_id,
          q.title,
          q.subject_id,
          q.description,
          q.created_by,
          q.quiz_type,
          q.duration,
          COALESCE(q.duration_unit, 'minutes') as duration_unit,
          q.difficulty,
          q.item_counts,
          COALESCE(q.program, '') as program,
          COALESCE(q.quiz_view, 'Personal') as quiz_view,
          COALESCE(q.subject_name, s.subject_name) as subject_name,
          s.subject_code,
          u.first_name,
          u.last_name,
          q.created_at,
          COUNT(DISTINCT qu.question_id) as question_count
        FROM quizzes q
        LEFT JOIN subjects s ON q.subject_id = s.subject_id
        LEFT JOIN users u ON q.created_by = u.user_id
        LEFT JOIN questions qu ON q.quizzes_id = qu.quizzes_id
  GROUP BY q.quizzes_id
        ORDER BY q.quizzes_id DESC
      `);
      
      console.log('📊 First quiz result:', rows[0]);
      console.log('📊 Subject name (prioritizing quizzes table):', rows[0]?.subject_name);
      console.log('📊 Duration:', rows[0]?.duration, rows[0]?.duration_unit);
      console.log('📊 Subject ID:', rows[0]?.subject_id);
      
      // Debug: Check if subjects table has the subject
      if (rows[0] && rows[0].subject_id) {
        try {
          const [subjectCheck] = await pool.query(`
            SELECT subject_id, subject_name FROM subjects WHERE subject_id = ?
          `, [rows[0].subject_id]);
          console.log('🔍 Direct subject lookup for subject_id', rows[0].subject_id, ':', subjectCheck[0]);
        } catch (subError) {
          console.log('❌ Error checking subject:', subError.message);
        }
      }
      
      return rows;
    } catch (columnError) {
      console.log('⚠️ Duration_unit column might not exist, trying without it:', columnError.message);
      
      // Fallback query without duration_unit column
      const [rows] = await pool.query(`
        SELECT 
          q.quizzes_id,
          q.title,
          q.subject_id,
          q.description,
          q.created_by,
          q.quiz_type,
          q.duration,
          'minutes' as duration_unit,
          q.difficulty,
          q.item_counts,
          COALESCE(q.program, '') as program,
          COALESCE(q.quiz_view, 'Personal') as quiz_view,
          s.subject_name,
          s.subject_code,
          u.first_name,
          u.last_name,
          q.created_at,
          COUNT(DISTINCT qu.question_id) as question_count
        FROM quizzes q
        LEFT JOIN subjects s ON q.subject_id = s.subject_id
        LEFT JOIN users u ON q.created_by = u.user_id
        LEFT JOIN questions qu ON q.quizzes_id = qu.quizzes_id
  GROUP BY q.quizzes_id
        ORDER BY q.quizzes_id DESC
      `);
      
      console.log('📊 Fallback query result:', rows[0]);
      console.log('💡 Please run the database_fix.sql script to add missing columns');
      
      return rows;
    }
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// Get quiz by ID with questions
const getQuizById = async (pool, quizId) => {
  try {
    // Get quiz details
    const [quizRows] = await pool.query(`
      SELECT 
        q.*,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN users u ON q.created_by = u.user_id
      WHERE q.quizzes_id = ?
    `, [quizId]);
    
    if (quizRows.length === 0) {
      return null;
    }
    
    const quiz = quizRows[0];
    
    // Get questions for this quiz
    const [questionRows] = await pool.query(`
      SELECT * FROM questions 
      WHERE quizzes_id = ? 
      ORDER BY question_id
    `, [quizId]);
    
    // Parse choices from JSON string to array
    const questions = questionRows.map(question => ({
      ...question,
      choices: question.choices ? JSON.parse(question.choices) : []
    }));
    
    return {
      ...quiz,
      questions
    };
  } catch (error) {
    console.error('Error fetching quiz by ID:', error);
    throw error;
  }
};

// Get quizzes by subject
const getQuizzesBySubject = async (pool, subjectId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        q.*,
        s.subject_name,
        s.subject_code,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT qu.question_id) as question_count
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN users u ON q.created_by = u.user_id
      LEFT JOIN questions qu ON q.quizzes_id = qu.quizzes_id
      WHERE q.subject_id = ?
      GROUP BY q.quizzes_id
      ORDER BY q.quizzes_id DESC
    `, [subjectId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching quizzes by subject:', error);
    throw error;
  }
};

// Create new quiz
const createQuiz = async (pool, quizData) => {
  try {
    const {
      title,
      subject_id,
      subject_name, // Get subject_name directly from frontend
      description,
      created_by,
      quiz_type,
      duration,
      duration_unit, // Remove default value to see actual value from frontend
      difficulty,
      item_counts,
      quiz_view // Add quiz_view field
    } = quizData;
    
    // Add debugging
    console.log('=== CREATE QUIZ DEBUG ===');
    console.log('Quiz data received:', JSON.stringify(quizData, null, 2));
    console.log('Subject ID:', subject_id);
    console.log('Subject Name from frontend:', subject_name);
    console.log('Duration:', duration, 'minutes');
    console.log('Duration Unit from frontend:', duration_unit);
    console.log('Duration Unit type:', typeof duration_unit);
    console.log('========================');
    
    // Use subject_name directly from frontend, with fallback to database lookup if null
    let finalSubjectName = subject_name;
    if (!finalSubjectName) {
      console.log('⚠️ Subject name not provided from frontend, fetching from database...');
      const [subjectRows] = await pool.query('SELECT subject_name FROM subjects WHERE subject_id = ?', [subject_id]);
      finalSubjectName = subjectRows.length > 0 ? subjectRows[0].subject_name : null;
      console.log('📋 Subject name from database fallback:', finalSubjectName);
    } else {
      console.log('✅ Using subject name from frontend:', finalSubjectName);
    }
    
    // Use 'minutes' as fallback only if duration_unit is undefined/null
    const finalDurationUnit = duration_unit || 'minutes';
    
    console.log('=== SQL INSERTION DEBUG ===');
    console.log('Values being inserted:');
    console.log('1. title:', title);
    console.log('2. subject_id:', subject_id);
    console.log('3. subject_name (final):', finalSubjectName);
    console.log('4. description:', description);
    console.log('5. created_by:', created_by);
    console.log('6. quiz_type:', quiz_type);
    console.log('7. duration:', duration, '(in minutes)');
    console.log('8. duration_unit (final):', finalDurationUnit);
    console.log('9. difficulty:', difficulty);
    console.log('10. item_counts:', item_counts);
    console.log('===========================');
    
    try {
      // Try to insert with both subject_name and duration_unit
      const [result] = await pool.query(`
        INSERT INTO quizzes (
          title, subject_id, subject_name, description, 
          created_by, quiz_type, duration, duration_unit, difficulty, item_counts, program, quiz_view
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title, subject_id, finalSubjectName, description,
        created_by, quiz_type, duration, finalDurationUnit, difficulty, item_counts, quizData.program || "", quiz_view || "Personal"
      ]);
      
      console.log('✅ Quiz inserted successfully with ID:', result.insertId);
      console.log('✅ Subject name saved as:', finalSubjectName);
      console.log('✅ Duration unit saved as:', finalDurationUnit);
      
      return {
        quizzes_id: result.insertId,
        ...quizData,
        subject_name: finalSubjectName
      };
    } catch (insertError) {
      console.error('❌ SQL INSERT ERROR:', insertError);
      console.log('⚠️ Trying fallback insertion methods...');
      
      // Fallback 1: try without duration_unit column
      try {
        const [result] = await pool.query(`
          INSERT INTO quizzes (
            title, subject_id, subject_name, description, 
            created_by, quiz_type, duration, difficulty, item_counts
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          title, subject_id, finalSubjectName, description,
          created_by, quiz_type, duration, difficulty, item_counts
        ]);
        
        console.log('✅ Quiz inserted successfully with ID (fallback 1):', result.insertId);
        console.log('✅ Subject name saved as:', finalSubjectName);
        
        // Try to update duration_unit separately
        try {
          await pool.query(`
            UPDATE quizzes SET duration_unit = ? WHERE quizzes_id = ?
          `, [finalDurationUnit, result.insertId]);
          console.log('✅ Duration unit updated successfully:', finalDurationUnit);
        } catch (updateError) {
          console.log('⚠️ Duration unit column might not exist:', updateError.message);
        }
        
        return {
          quizzes_id: result.insertId,
          ...quizData,
          subject_name: finalSubjectName
        };
      } catch (fallback1Error) {
        console.error('❌ FALLBACK 1 ERROR:', fallback1Error);
        
        // Fallback 2: try without both subject_name and duration_unit
        try {
          const [result] = await pool.query(`
            INSERT INTO quizzes (
              title, subject_id, description, 
              created_by, quiz_type, duration, difficulty, item_counts
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            title, subject_id, description,
            created_by, quiz_type, duration, difficulty, item_counts
          ]);
          
          console.log('✅ Quiz inserted successfully with ID (fallback 2):', result.insertId);
          console.log('💡 You may need to add these columns:');
          console.log('   ALTER TABLE quizzes ADD COLUMN subject_name VARCHAR(255);');
          console.log('   ALTER TABLE quizzes ADD COLUMN duration_unit VARCHAR(10) DEFAULT "minutes";');
          
          return {
            quizzes_id: result.insertId,
            ...quizData
          };
        } catch (fallback2Error) {
          console.error('❌ FALLBACK 2 ERROR:', fallback2Error);
          throw fallback2Error;
        }
      }
    }
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Update quiz
const updateQuiz = async (pool, quizId, quizData) => {
  try {
    const {
      title,
      subject_id,
      subject_name,
      description,
      quiz_type,
      duration,
      difficulty,
      item_counts,
      program,
      quiz_view
    } = quizData;
    
    const [result] = await pool.query(`
      UPDATE quizzes SET 
        title = ?, subject_id = ?, subject_name = ?, description = ?,
        quiz_type = ?, duration = ?, difficulty = ?, item_counts = ?, program = ?, quiz_view = ?
      WHERE quizzes_id = ?
    `, [
      title, subject_id, subject_name, description,
      quiz_type, duration, difficulty, item_counts, program || "", quiz_view || "Personal", quizId
    ]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

// Delete quiz
const deleteQuiz = async (pool, quizId) => {
  try {
    // First delete all questions for this quiz
    await pool.query('DELETE FROM questions WHERE quizzes_id = ?', [quizId]);
    
    // Then delete all quiz attempts
    await pool.query('DELETE FROM quizattempts WHERE quizzes_id = ?', [quizId]);
    
    // Finally delete the quiz
    const [result] = await pool.query('DELETE FROM quizzes WHERE quizzes_id = ?', [quizId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

// Get user's quiz attempts
const getUserQuizAttempts = async (pool, userId, quizId = null) => {
  try {
    let query = `
      SELECT 
        qa.*,
        q.title as quiz_title,
        q.item_counts
      FROM quizattempts qa
      JOIN quizzes q ON qa.quizzes_id = q.quizzes_id
      WHERE qa.user_id = ?
    `;
    
    const params = [userId];
    
    if (quizId) {
      query += ' AND qa.quizzes_id = ?';
      params.push(quizId);
    }
    
    query += ' ORDER BY qa.timestamp DESC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching user quiz attempts:', error);
    throw error;
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  getQuizzesBySubject,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getUserQuizAttempts
};
