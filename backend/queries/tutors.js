// Tutors Query Functions

// Get all tutors
const getAllTutors = async (pool) => {
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
  specialties,
  ratings
    FROM tutors
    ORDER BY application_date DESC
  `;
  
  const [rows] = await pool.query(query);
  return rows;
};

// Get tutors by status
const getTutorsByStatus = async (pool, status) => {
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
  specialties,
  ratings
    FROM tutors
    WHERE status = ?
    ORDER BY application_date DESC
  `;
  
  const [rows] = await pool.query(query, [status]);
  return rows;
};

// Get tutors by subject
const getTutorsBySubject = async (pool, subjectId) => {
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
  specialties,
  ratings
    FROM tutors
    WHERE subject_id = ? AND status = 'approved'
    ORDER BY application_date DESC
  `;
  
  const [rows] = await pool.query(query, [subjectId]);
  return rows;
};

// Get approved tutors (for matching)
const getApprovedTutors = async (pool) => {
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
  specialties,
  ratings
    FROM tutors
    WHERE status = 'approved'
    ORDER BY application_date DESC
  `;
  
  const [rows] = await pool.query(query);
  return rows;
};

// Get a specific tutor by ID
const getTutorById = async (pool, applicationId) => {
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
  specialties,
  ratings
    FROM tutors
    WHERE application_id = ?
  `;
  
  const [rows] = await pool.query(query, [applicationId]);
  return rows[0] || null;
};

// Create a new tutor entry
const createTutor = async (pool, tutorData) => {
  const {
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
  } = tutorData;

  const query = `
    INSERT INTO tutors (
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

  const [result] = await pool.query(query, [
    user_id,
    name,
    subject_id,
    subject_name,
    application_date || new Date().toISOString().split('T')[0], // Use original date or current date
    status || 'approved', // Use provided status or default to approved
    validated_by || '1', // Use provided validator or default
    tutor_information || '',
    program || '',
    year_level || '',
    specialties || ''
  ]);

  return result;
};

// Update tutor status
const updateTutorStatus = async (pool, applicationId, status, validatedBy) => {
  const query = `
    UPDATE tutors 
    SET status = ?, validated_by = ?
    WHERE application_id = ?
  `;

  const [result] = await pool.query(query, [status, validatedBy, applicationId]);
  return result;
};

// Delete a tutor
const deleteTutor = async (pool, applicationId) => {
  const query = `DELETE FROM tutors WHERE application_id = ?`;
  const [result] = await pool.query(query, [applicationId]);
  return result;
};

module.exports = {
  getAllTutors,
  getTutorsByStatus,
  getTutorsBySubject,
  getApprovedTutors,
  getTutorById,
  createTutor,
  updateTutorStatus,
  deleteTutor
};
