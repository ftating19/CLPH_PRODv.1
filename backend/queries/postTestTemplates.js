const db = require('../dbconnection/mysql')

// Get all templates for a tutor
const getTemplatesByTutor = async (tutorId) => {
  const pool = await db.getPool()
  const query = `
    SELECT 
      t.*,
      COUNT(DISTINCT pta.assignment_id) as times_assigned,
      COUNT(DISTINCT CASE WHEN pta.status = 'completed' THEN pta.assignment_id END) as times_completed
    FROM post_test_templates t
    LEFT JOIN post_test_assignments pta ON t.template_id = pta.template_id
    WHERE t.tutor_id = ? AND t.is_active = 1
    GROUP BY t.template_id
    ORDER BY t.created_at DESC
  `
  const [results] = await pool.query(query, [tutorId])
  return results
}

// Get template by ID with questions
const getTemplateById = async (templateId) => {
  const pool = await db.getPool()
  
  // Get template details
  const templateQuery = `
    SELECT * FROM post_test_templates
    WHERE template_id = ?
  `
  const [templateResults] = await pool.query(templateQuery, [templateId])
  
  if (templateResults.length === 0) {
    return null
  }
  
  // Get questions for the template
  const questionsQuery = `
    SELECT 
      question_id,
      question_text,
      question_type,
      options,
      correct_answer,
      points,
      order_number
    FROM post_test_questions
    WHERE template_id = ?
    ORDER BY order_number ASC
  `
  const [questionsResults] = await pool.query(questionsQuery, [templateId])
  
  // Combine template with questions
  return {
    ...templateResults[0],
    questions: questionsResults
  }
}

// Create a new template
const createTemplate = async (templateData) => {
  const pool = await db.getPool()
  const query = `
    INSERT INTO post_test_templates (
      tutor_id, title, description, subject_id, subject_name,
      time_limit, passing_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  const values = [
    templateData.tutor_id,
    templateData.title,
    templateData.description,
    templateData.subject_id,
    templateData.subject_name,
    templateData.time_limit || 30,
    templateData.passing_score || 70
  ]
  const [result] = await pool.query(query, values)
  return { template_id: result.insertId }
}

// Update template
const updateTemplate = async (templateId, templateData) => {
  const pool = await db.getPool()
  const query = `
    UPDATE post_test_templates 
    SET title = ?, description = ?, subject_id = ?, subject_name = ?,
        time_limit = ?, passing_score = ?
    WHERE template_id = ?
  `
  const values = [
    templateData.title,
    templateData.description,
    templateData.subject_id,
    templateData.subject_name,
    templateData.time_limit,
    templateData.passing_score,
    templateId
  ]
  await pool.query(query, values)
  return { success: true }
}

// Soft delete template
const deleteTemplate = async (templateId) => {
  const pool = await db.getPool()
  const query = 'UPDATE post_test_templates SET is_active = 0 WHERE template_id = ?'
  await pool.query(query, [templateId])
  return { success: true }
}

// Get students who can be assigned a template (same subject bookings)
const getEligibleStudents = async (tutorId, subjectId) => {
  const pool = await db.getPool()
  const query = `
    SELECT DISTINCT 
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      b.booking_id,
      s.subject_name
    FROM bookings b
    INNER JOIN users u ON b.user_id = u.user_id
    INNER JOIN subjects s ON b.subject_id = s.subject_id
    WHERE b.tutor_id = ? 
      AND b.subject_id = ?
      AND b.booking_status IN ('confirmed', 'in-progress', 'completed')
    ORDER BY u.last_name, u.first_name
  `
  const [results] = await pool.query(query, [tutorId, subjectId])
  return results
}

// Assign template to students
const assignTemplate = async (assignments) => {
  const pool = await db.getPool()
  const query = `
    INSERT INTO post_test_assignments (
      template_id, student_id, booking_id, assigned_by, due_date
    ) VALUES ?
    ON DUPLICATE KEY UPDATE 
      assigned_at = CURRENT_TIMESTAMP,
      due_date = VALUES(due_date)
  `
  const values = assignments.map(a => [
    a.template_id,
    a.student_id,
    a.booking_id,
    a.assigned_by,
    a.due_date
  ])
  const [result] = await pool.query(query, [values])
  return { assignments_created: result.affectedRows }
}

// Get assignments for a template
const getTemplateAssignments = async (templateId) => {
  const pool = await db.getPool()
  const query = `
    SELECT 
      pta.*,
      u.first_name,
      u.last_name,
      u.email,
      ptr.score,
      ptr.passed,
      ptr.completed_at as result_completed_at
    FROM post_test_assignments pta
    INNER JOIN users u ON pta.student_id = u.user_id
    LEFT JOIN post_test_results ptr ON pta.assignment_id = ptr.assignment_id
    WHERE pta.template_id = ?
    ORDER BY pta.assigned_at DESC
  `
  const [results] = await pool.query(query, [templateId])
  return results
}

module.exports = {
  getTemplatesByTutor,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getEligibleStudents,
  assignTemplate,
  getTemplateAssignments
}
