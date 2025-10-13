// Tutor Applications Query Functions

// Get all tutor applications
const getAllTutorApplications = async (pool) => {
  const query = `
    SELECT 
      application_id,
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
      specialties
    FROM tutorapplications
    ORDER BY application_date DESC
  `;
  
  const [rows] = await pool.query(query);
  return rows;
};

// Get tutor applications by status
const getTutorApplicationsByStatus = async (pool, status) => {
  const query = `
    SELECT 
      application_id,
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
      specialties
    FROM tutorapplications
    WHERE status = ?
    ORDER BY application_date DESC
  `;
  
  const [rows] = await pool.query(query, [status]);
  return rows;
};

// Get a specific tutor application by ID
const getTutorApplicationById = async (pool, applicationId) => {
  const query = `
    SELECT 
      application_id,
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
      specialties
    FROM tutorapplications
    WHERE application_id = ?
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
    specialties
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
      specialties
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    specialties || ''
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
