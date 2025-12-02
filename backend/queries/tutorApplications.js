// Tutor Applications Query Functions

// Get all tutor applications
const getAllTutorApplications = async (pool) => {
  const query = `
    SELECT 
      ta.application_id,
      ta.user_id,
      ta.name,
      ta.subject_id,
      ta.subject_name,
      ta.application_date,
      ta.status,
      ta.validated_by,
      ta.tutor_information,
      ta.program,
      ta.year_level,
      ta.specialties,
      ta.class_card_image_url,
      ta.assessment_result_id,
      ta.assessment_score,
      ta.assessment_percentage,
      ta.assessment_passed,
      u.email
    FROM tutorapplications ta
    LEFT JOIN users u ON ta.user_id = u.user_id
    ORDER BY ta.application_date DESC
  `;
  
  const [rows] = await pool.query(query);
  return rows;
};

// Get tutor applications by status
const getTutorApplicationsByStatus = async (pool, status) => {
  const query = `
    SELECT 
      ta.application_id,
      ta.user_id,
      ta.name,
      ta.subject_id,
      ta.subject_name,
      ta.application_date,
      ta.status,
      ta.validated_by,
      ta.tutor_information,
      ta.program,
      ta.year_level,
      ta.specialties,
      ta.class_card_image_url,
      ta.assessment_result_id,
      ta.assessment_score,
      ta.assessment_percentage,
      ta.assessment_passed,
      u.email
    FROM tutorapplications ta
    LEFT JOIN users u ON ta.user_id = u.user_id
    WHERE ta.status = ?
    ORDER BY ta.application_date DESC
  `;
  
  const [rows] = await pool.query(query, [status]);
  return rows;
};

// Get a specific tutor application by ID
const getTutorApplicationById = async (pool, applicationId) => {
  const query = `
    SELECT 
      ta.application_id,
      ta.user_id,
      ta.name,
      ta.subject_id,
      ta.subject_name,
      ta.application_date,
      ta.status,
      ta.validated_by,
      ta.tutor_information,
      ta.program,
      ta.year_level,
      ta.specialties,
      ta.class_card_image_url,
      ta.assessment_result_id,
      ta.assessment_score,
      ta.assessment_percentage,
      ta.assessment_passed,
      u.email
    FROM tutorapplications ta
    LEFT JOIN users u ON ta.user_id = u.user_id
    WHERE ta.application_id = ?
  `;
  
  const [rows] = await pool.query(query, [applicationId]);
  return rows[0] || null;
};

// Create a new tutor application
const createTutorApplication = async (pool, applicationData) => {
  const {
    user_id,
    name,
    subject_id,
    subject_name,
    tutor_information,
    program,
    year_level,
    specialties,
    class_card_image_url,
    assessment_result_id,
    assessment_score,
    assessment_percentage,
    assessment_passed
  } = applicationData;

  const query = `
    INSERT INTO tutorapplications (
      user_id,
      name,
      subject_id,
      subject_name,
      application_date,
      status,
      validated_by,
      tutor_information,
      program,
      year_level,
      specialties,
      class_card_image_url,
      assessment_result_id,
      assessment_score,
      assessment_percentage,
      assessment_passed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const [result] = await pool.query(query, [
    user_id,
    name,
    subject_id,
    subject_name,
    currentDate,
    'pending',
    '0', // No validator initially
    tutor_information || '',
    program || '',
    year_level || '',
    specialties || '',
    class_card_image_url || null,
    assessment_result_id || null,
    assessment_score || null,
    assessment_percentage || null,
    assessment_passed || false
  ]);

  return result;
};

// Update tutor application status (approve/reject)
const updateTutorApplicationStatus = async (pool, applicationId, status, validatedBy, comment = null) => {
  const query = `
    UPDATE tutorapplications 
    SET status = ?, validated_by = ?, comment = ?
    WHERE application_id = ?
  `;

  const [result] = await pool.query(query, [status, validatedBy, comment, applicationId]);
  return result;
};

// Delete a tutor application
const deleteTutorApplication = async (pool, applicationId) => {
  const query = `DELETE FROM tutorapplications WHERE application_id = ?`;
  const [result] = await pool.query(query, [applicationId]);
  return result;
};

module.exports = {
  getAllTutorApplications,
  getTutorApplicationsByStatus,
  getTutorApplicationById,
  createTutorApplication,
  updateTutorApplicationStatus,
  deleteTutorApplication
};
