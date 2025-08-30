const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: '../.env' })


// ...imports only, no app initialization or routes here...


const db = require('../dbconnection/mysql')
const { createUser, findUserByEmail, updateUser, findUserById } = require('../queries/users')
const { generateTemporaryPassword, sendWelcomeEmail, sendTutorApprovalEmail, sendTutorRejectionEmail, sendMaterialApprovalEmail, sendMaterialRejectionEmail, testEmailConnection } = require('../services/emailService')
const { 
  getAllSubjects, 
  getSubjectById, 
  createSubject, 
  updateSubject, 
  deleteSubject 
} = require('../queries/subjects')
const {
  getAllFlashcards,
  getAllFlashcardsWithProgress,
  getFlashcardById,
  getFlashcardsBySubject,
  getFlashcardsByCreator,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard
} = require('../queries/flashcards')

// Import flashcard progress queries
const {
  getFlashcardProgressByUser,
  getFlashcardProgress,
  getFlashcardsWithProgress,
  upsertFlashcardProgress,
  markFlashcardCompleted,
  resetFlashcardProgress,
  getFlashcardProgressStats,
  getFlashcardProgressStatsBySubject,
  deleteFlashcardProgress
} = require('../queries/flashcardProgress')
const { 
  getAllQuizzes, 
  getQuizById, 
  getQuizzesBySubject, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz, 
  getUserQuizAttempts 
} = require('../queries/quizzes')
const { 
  getQuestionsByQuizId, 
  getQuestionById, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion, 
  deleteQuestionsByQuizId 
} = require('../queries/questions')
const { 
  getAllQuizAttempts, 
  getQuizAttemptById, 
  getQuizAttemptsByUser, 
  getQuizAttemptsByQuiz, 
  createQuizAttempt, 
  updateQuizAttempt, 
  deleteQuizAttempt, 
  getUserBestScore, 
  getQuizStatistics 
} = require('../queries/quizAttempts')
const { 
  getAllTutorApplications, 
  getTutorApplicationsByStatus, 
  getTutorApplicationById, 
  createTutorApplication, 
  updateTutorApplicationStatus, 
  deleteTutorApplication 
} = require('../queries/tutorApplications')
const { 
  getAllTutors, 
  getTutorsByStatus, 
  getTutorsBySubject, 
  getApprovedTutors, 
  getTutorById, 
  createTutor, 
  updateTutorStatus, 
  deleteTutor 
} = require('../queries/tutors')
const { 
  getAllStudyMaterials, 
  getStudyMaterialById, 
  createStudyMaterial, 
  updateStudyMaterial, 
  deleteStudyMaterial, 
  incrementDownloadCount, 
  incrementViewCount, 
  updateMaterialRating, 
  searchStudyMaterials 
} = require('../queries/studyMaterials')
const { 
  getAllPendingMaterials, 
  getPendingMaterialById, 
  createPendingMaterial, 
  updatePendingMaterialStatus, 
  deletePendingMaterial, 
  getPendingMaterialsByStatus, 
  transferToStudyMaterials 
} = require('../queries/pendingMaterials')
const { createSession, getSessions } = require('../queries/sessions')

const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())
// Also accept URL-encoded form data (helps some clients/tools)
app.use(express.urlencoded({ extended: true }))

// Add a fallback middleware to parse raw body if needed
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

// Ensure middleware is applied globally
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {};
  }
  next();
});

const PORT = process.env.PORT || 4000

app.get('/health', (req, res) => res.json({ ok: true }))

// Test email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    const isConnected = await testEmailConnection();
    if (isConnected) {
      res.json({ 
        success: true, 
        message: 'Email configuration is working correctly',
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'Not configured'
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Email configuration test failed',
        error: 'Unable to connect to SMTP server'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Email configuration test failed',
      error: error.message
    });
  }
})

// Dev helper: list database tables (safe for local dev)
app.get('/debug/tables', async (req, res) => {
  try {
    const pool = await db.getPool()
    const [rows] = await pool.query("SHOW TABLES")
    res.json({ tables: rows })
  } catch (err) {
    console.error('Debug tables error', err)
    res.status(500).json({ error: err.message })
  }
})

// Add the /api/check-email endpoint to handle email verification
app.get('/api/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Invalid email parameter' });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Check if the email exists in the database
    const user = await findUserByEmail(pool, email);

    res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error('Check email error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add the /api/signup endpoint to handle user registration
app.post('/api/signup', async (req, res) => {
  try {
    // Debugging log to inspect req.body
    console.log('Request body:', req.body);

    // Log headers to debug request issues
    console.log('Request headers:', req.headers);

    // Log the entire request object for debugging
    console.log('Full request:', {
      headers: req.headers,
      body: req.body,
      method: req.method,
      url: req.url
    });

    const { first_name, middle_name, last_name, email, password, program, role, status } = req.body;

    // Ensure req.body is parsed correctly
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is missing or empty' });
    }

    // Fallback for undefined req.body
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing or malformed' });
    }

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !program) {
      return res.status(400).json({ error: 'Missing required fields: first name, last name, email, password, and program are required' });
    }

    // Hash the password (bcryptjs can be used here)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get a database connection
    const pool = await db.getPool();

    // Insert the user into the database
    const result = await createUser(pool, {
      first_name,
      middle_name,
      last_name,
      email,
      password: hashedPassword,
      program,
      role,
      status,
      first_login: 1, // Self-registered users don't need to reset password // kapag 1 ang value yung account is from sign up kapag 0 nag rereset ng password since si admin ang gumawa ng account
    });

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add the /api/admin/create-user endpoint for admin user creation with temporary password
app.post('/api/admin/create-user', async (req, res) => {
  try {
    console.log('Admin user creation request:', req.body);

    const { first_name, middle_name, last_name, email, program, role, status } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !program) {
      return res.status(400).json({ error: 'Missing required fields: first name, last name, email, and program are required' });
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Hash the temporary password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Get a database connection
    const pool = await db.getPool();

    // Check if user already exists
    const existingUser = await findUserByEmail(pool, email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Insert the user into the database
    const result = await createUser(pool, {
      first_name,
      middle_name,
      last_name,
      email,
      password: hashedPassword,
      program,
      role: role || 'Student',
      status: status || 'Active',
      first_login: 0, // Admin-created users need to reset password on first login
    });

    // Send welcome email with temporary password
    const emailResult = await sendWelcomeEmail(
      email, 
      `${first_name} ${last_name}`, 
      temporaryPassword, 
      role || 'Student'
    );

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Still return success since user was created, but log the email failure
      return res.status(201).json({ 
        message: 'User created successfully, but email notification failed',
        warning: 'Please manually provide the user with their temporary password',
        temporaryPassword: temporaryPassword // Only for debugging - remove in production
      });
    }

    // Log successful email sending
    console.log(`📧 Welcome email sent successfully to: ${email}`);
    console.log(`👤 User created: ${first_name} ${last_name} (${role || 'Student'})`);

    res.status(201).json({ 
      message: 'User created successfully and welcome email sent',
      email: email
    });
  } catch (err) {
    console.error('Admin user creation error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add the /api/users endpoint to fetch all users for admin management
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching all users for admin management');

    // Get a database connection
    const pool = await db.getPool();

    // Fetch all users (excluding passwords for security)
    const [users] = await pool.query(
      'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, first_login, created_at FROM users ORDER BY created_at DESC'
    );

    console.log(`✅ Found ${users.length} users`);
    
    res.status(200).json({ 
      success: true,
      users: users,
      total: users.length
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to fetch students specifically
app.get('/api/students', async (req, res) => {
  try {
    console.log('Fetching students for tutor matching');

    // Get a database connection
    const pool = await db.getPool();

    // Fetch only students with active status (excluding passwords for security)
    const [students] = await pool.query(
      'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, first_login, created_at FROM users WHERE role = ? AND status = ? ORDER BY created_at DESC',
      ['Student', 'active']
    );

    console.log(`✅ Found ${students.length} active students`);
    
    res.status(200).json({ 
      success: true,
      students: students,
      total: students.length
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Add the /api/admin/edit-user/:id endpoint for updating user details
app.put('/api/admin/edit-user/:id', async (req, res) => {
  try {
    console.log('=== EDIT USER ENDPOINT HIT ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const userId = parseInt(req.params.id);
    const { first_name, middle_name, last_name, email, program, role, status } = req.body;

    console.log(`Admin updating user ${userId}:`, req.body);

    // Validate required fields
    if (!first_name || !last_name || !email || !program || !role || !status) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: first name, last name, email, program, role, and status are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('✅ Validation passed, getting database connection...');
    
    // Get a database connection
    const pool = await db.getPool();
    console.log('✅ Database connection obtained');

    // Check if user exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await findUserById(pool, userId);
    console.log('User found:', existingUser);
    
    if (!existingUser) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    console.log('📧 Checking email availability...');
    if (email !== existingUser.email) {
      const emailCheck = await findUserByEmail(pool, email);
      console.log('Email check result:', emailCheck);
      
      if (emailCheck && emailCheck.user_id !== userId) {
        console.log('❌ Email already in use');
        return res.status(409).json({ error: 'Email address is already in use by another user' });
      }
    }

    console.log('💾 Updating user...');
    // Update the user using the query function
    const result = await updateUser(pool, userId, {
      first_name,
      middle_name,
      last_name,
      email,
      program,
      role,
      status
    });

    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      console.log('❌ No rows affected');
      return res.status(404).json({ error: 'User not found or no changes made' });
    }

    console.log(`✅ User ${userId} updated successfully`);
    
    res.status(200).json({ 
      message: 'User updated successfully',
      user_id: userId
    });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Add the /api/reset-password endpoint for first-time login password reset
app.post('/api/reset-password', async (req, res) => {
  try {
    console.log('Password reset request for:', req.body.email);

    const { email, currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required' });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Find user by email
    const user = await findUserByEmail(pool, email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and set first_login to 1
    await pool.query(
      'UPDATE users SET password = ?, first_login = 1 WHERE email = ?',
      [hashedNewPassword, email]
    );

    console.log(`✅ Password reset successful for: ${email}`);
    
    res.status(200).json({ 
      message: 'Password updated successfully',
      first_login: 1
    });
  } catch (err) {
    console.error('Password reset error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add the /api/login endpoint to handle user authentication
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email, timestamp: new Date().toISOString() });
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        errorType: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address',
        errorType: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Find user by email
    const user = await findUserByEmail(pool, email);

    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ 
        error: 'No account found with this email address. Please check your email or sign up for a new account.',
        errorType: 'EMAIL_NOT_FOUND'
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      console.log('Login failed: Account not active for email:', email);
      return res.status(401).json({ 
        error: 'Your account is not active. Please contact support for assistance.',
        errorType: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ 
        error: 'Incorrect password. Please check your password and try again.',
        errorType: 'INVALID_PASSWORD'
      });
    }

    // Remove password from user object before sending response
    const { password: _, ...userWithoutPassword } = user;

    console.log('Login successful for email:', email);
    console.log('User data being sent:', userWithoutPassword);
    console.log('First login status:', userWithoutPassword.first_login);
    res.status(200).json({ 
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ 
      error: 'A server error occurred. Please try again later.',
      errorType: 'SERVER_ERROR'
    });
  }
});

// Add the /api/update-profile endpoint to handle profile updates
app.put('/api/update-profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, middle_name, last_name, description, program, role, currentPassword, newPassword } = req.body;

    console.log('Profile update attempt:', { userId, timestamp: new Date().toISOString() });

    // Validate required fields
    if (!first_name || !last_name || !role) {
      return res.status(400).json({ 
        error: 'First name, last name, and role are required',
        errorType: 'MISSING_FIELDS'
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Find user by user_id first
    const [userRows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    const user = userRows[0];

    // If password change is requested, verify current password
    if (currentPassword && newPassword) {
      const bcrypt = require('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        return res.status(401).json({ 
          error: 'Current password is incorrect',
          errorType: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update profile with new password
      await pool.query(
        'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, description = ?, program = ?, role = ?, password = ? WHERE user_id = ?',
        [first_name, middle_name || null, last_name, description || null, program || null, role, hashedNewPassword, userId]
      );

      console.log('Profile updated with password change for user:', userId);
    } else {
      // Update profile without password change
      await pool.query(
        'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, description = ?, program = ?, role = ? WHERE user_id = ?',
        [first_name, middle_name || null, last_name, description || null, program || null, role, userId]
      );

      console.log('Profile updated for user:', userId);
    }

    res.status(200).json({ 
      message: 'Profile updated successfully'
    });

  } catch (err) {
    console.error('Profile update error', err);
    res.status(500).json({ 
      error: 'A server error occurred. Please try again later.',
      errorType: 'SERVER_ERROR'
    });
  }
});

// ===== TUTOR APPLICATION ENDPOINTS =====

// Get all tutor applications (with optional status filter)
app.get('/api/tutor-applications', async (req, res) => {
  try {
    console.log('=== TUTOR APPLICATIONS ENDPOINT HIT ===');
    console.log('Request query:', req.query);
    
    const { status } = req.query;
    
    console.log('Fetching tutor applications', status ? `with status: ${status}` : '(all statuses)');

    // Get a database connection
    const pool = await db.getPool();
    console.log('Database connection obtained');

    let applications;
    if (status) {
      applications = await getTutorApplicationsByStatus(pool, status);
    } else {
      applications = await getAllTutorApplications(pool);
    }

    console.log(`Found ${applications.length} applications`);

    // Transform the data to match frontend expectations
    const transformedApplications = applications.map(app => ({
      application_id: app.application_id,
      user_id: app.user_id,
      name: app.name || `${app.first_name || ''} ${app.last_name || ''}`.trim(),
      email: app.email,
      subject_id: app.subject_id,
      subject_name: app.subject_name,
      application_date: app.application_date,
      status: app.status,
      validated_by: app.validated_by,
      tutor_information: app.tutor_information || '',
      program: app.program || '',
      specialties: app.specialties || ''
    }));

    console.log(`✅ Found ${transformedApplications.length} tutor applications`);
    
    res.status(200).json({ 
      success: true,
      applications: transformedApplications,
      total: transformedApplications.length
    });
  } catch (err) {
    console.error('Error fetching tutor applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific tutor application by ID
app.get('/api/tutor-applications/:id', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    console.log(`Fetching tutor application ${applicationId}`);

    // Get a database connection
    const pool = await db.getPool();

    const application = await getTutorApplicationById(pool, applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Tutor application not found' });
    }

    // Transform the data to match frontend expectations
    const transformedApplication = {
      application_id: application.application_id,
      user_id: application.user_id,
      name: application.name || `${application.first_name || ''} ${application.last_name || ''}`.trim(),
      email: application.email,
      subject_id: application.subject_id,
      subject_name: application.subject_name,
      application_date: application.application_date,
      status: application.status,
      validated_by: application.validated_by,
      tutor_information: application.tutor_information || '',
      program: application.program || '',
      specialties: app.specialties || ''
    };

    console.log(`✅ Found tutor application ${applicationId}`);
    
    res.status(200).json({ 
      success: true,
      application: transformedApplication
    });
  } catch (err) {
    console.error('Error fetching tutor application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new tutor application
app.post('/api/tutor-applications', async (req, res) => {
  try {
    console.log('Creating new tutor application:', req.body);

    const { 
      user_id, 
      name, 
      subject_id, 
      subject_name, 
      tutor_information, 
      program, 
      specialties 
    } = req.body;

    // Validate required fields
    if (!user_id || !name || !subject_id || !subject_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, name, subject_id, and subject_name are required' 
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Create the application
    const result = await createTutorApplication(pool, {
      user_id,
      name,
      subject_id,
      subject_name,
      tutor_information,
      program,
      specialties
    });

    console.log(`✅ Tutor application created with ID: ${result.insertId}`);
    
    res.status(201).json({ 
      success: true,
      message: 'Tutor application submitted successfully',
      application_id: result.insertId
    });
  } catch (err) {
    console.error('Error creating tutor application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a tutor application
app.put('/api/tutor-applications/:id/approve', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { validatedby } = req.body;
    
    console.log(`Approving tutor application ${applicationId} by user ${validatedby}`);

    // Get a database connection
    const pool = await db.getPool();

    // Check if application exists
    const application = await getTutorApplicationById(pool, applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Tutor application not found' });
    }

    console.log(`Found application for user ${application.user_id}`);

    // Update application status to approved
    const result = await updateTutorApplicationStatus(pool, applicationId, 'approved', validatedby || '1');

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Failed to update application status' });
    }

    // Update user role to "Tutor" in users table
    console.log(`Updating user ${application.user_id} role to Tutor`);
    await pool.query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      ['Tutor', application.user_id]
    );

    // Add approved tutor to tutors table for easier querying
    console.log(`Adding approved tutor to tutors table`);
    try {
      // Check if tutor already exists for this subject
      const [existingTutor] = await pool.query(
        'SELECT application_id FROM tutors WHERE user_id = ? AND subject_id = ?',
        [application.user_id, application.subject_id]
      );

      if (existingTutor.length > 0) {
        console.log(`Tutor already exists in tutors table for this subject, updating instead`);
        // Update existing entry
        await pool.query(
          `UPDATE tutors SET 
           name = ?, subject_name = ?, application_date = ?, status = ?, 
           validated_by = ?, tutor_information = ?, program = ?, specialties = ?
           WHERE user_id = ? AND subject_id = ?`,
          [
            application.name,
            application.subject_name,
            application.application_date,
            'approved',
            validatedby || '1',
            application.tutor_information,
            application.program,
            application.specialties,
            application.user_id,
            application.subject_id
          ]
        );
      } else {
        // Create new entry
        await createTutor(pool, {
          user_id: application.user_id,
          name: application.name,
          subject_id: application.subject_id,
          subject_name: application.subject_name,
          application_date: application.application_date,
          status: 'approved',
          validated_by: validatedby || '1',
          tutor_information: application.tutor_information,
          program: application.program,
          specialties: application.specialties
        });
      }
      console.log(`✅ Tutor data synchronized to tutors table successfully`);
    } catch (tutorError) {
      console.log(`Error synchronizing tutor data: ${tutorError.message}`);
      // Don't fail the approval if tutors table sync fails
    }

    console.log(`✅ Tutor application ${applicationId} approved successfully`);
    console.log(`✅ User ${application.user_id} role updated to Tutor`);
    
    // Send approval email to the user
    try {
      console.log(`Sending approval email to ${application.user_id}...`);
      
      // Get user details for email
      const user = await findUserById(pool, application.user_id);
      
      // Get subject details for email
      const subject = await getSubjectById(pool, application.subject_id);
      
      if (user && subject) {
        const emailResult = await sendTutorApprovalEmail(
          user.email,
          `${user.first_name} ${user.last_name}`,
          subject.subject_name,
          subject.subject_code
        );
        
        if (emailResult.success) {
          console.log(`✅ Approval email sent successfully to ${user.email}`);
        } else {
          console.log(`⚠️ Failed to send approval email: ${emailResult.error}`);
        }
      } else {
        console.log(`⚠️ User or subject not found for email notification`);
      }
    } catch (emailError) {
      console.log(`⚠️ Error sending approval email: ${emailError.message}`);
      // Don't fail the approval if email fails
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Tutor application approved successfully. User role updated to Tutor and approval email sent.'
    });
  } catch (err) {
    console.error('Error approving tutor application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a tutor application
app.put('/api/tutor-applications/:id/reject', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { validatedby } = req.body;
    
    console.log(`Rejecting tutor application ${applicationId} by user ${validatedby}`);

    // Get a database connection
    const pool = await db.getPool();

    // Check if application exists
    const application = await getTutorApplicationById(pool, applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Tutor application not found' });
    }

    console.log(`Found application for user ${application.user_id}`);

    // Update application status to rejected
    const result = await updateTutorApplicationStatus(pool, applicationId, 'rejected', validatedby || '1');

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Failed to update application status' });
    }

    // Check if user has any other approved applications
    const [approvedApps] = await pool.query(
      'SELECT COUNT(*) as count FROM tutorapplications WHERE user_id = ? AND status = "approved"',
      [application.user_id]
    );

    // If no approved applications remain, revert role to Student
    if (approvedApps[0].count === 0) {
      console.log(`No approved applications remain for user ${application.user_id}, reverting role to Student`);
      await pool.query(
        'UPDATE users SET role = ? WHERE user_id = ?',
        ['Student', application.user_id]
      );

      // Also remove from tutors table if exists
      try {
        await pool.query(
          'DELETE FROM tutors WHERE user_id = ? AND subject_id = ?',
          [application.user_id, application.subject_id]
        );
        console.log(`✅ Removed tutor from tutors table`);
      } catch (deleteError) {
        console.log(`Note: Error removing tutor from tutors table: ${deleteError.message}`);
      }
    }

    console.log(`✅ Tutor application ${applicationId} rejected successfully`);
    
    // Send rejection email to the user
    try {
      console.log(`Sending rejection email to user ${application.user_id}...`);
      
      // Get user details for email
      const user = await findUserById(pool, application.user_id);
      
      // Get subject details for email
      const subject = await getSubjectById(pool, application.subject_id);
      
      if (user && subject) {
        // You can add a rejection reason from request body if needed
        const rejectionReason = req.body.rejectionReason || null;
        
        const emailResult = await sendTutorRejectionEmail(
          user.email,
          `${user.first_name} ${user.last_name}`,
          subject.subject_name,
          subject.subject_code,
          rejectionReason
        );
        
        if (emailResult.success) {
          console.log(`✅ Rejection email sent successfully to ${user.email}`);
        } else {
          console.log(`⚠️ Failed to send rejection email: ${emailResult.error}`);
        }
      } else {
        console.log(`⚠️ User or subject not found for email notification`);
      }
    } catch (emailError) {
      console.log(`⚠️ Error sending rejection email: ${emailError.message}`);
      // Don't fail the rejection if email fails
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Tutor application rejected successfully and notification email sent'
    });
  } catch (err) {
    console.error('Error rejecting tutor application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a tutor application (admin only)
app.delete('/api/tutor-applications/:id', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    console.log(`Deleting tutor application ${applicationId}`);

    // Get a database connection
    const pool = await db.getPool();

    // Delete the application
    const result = await deleteTutorApplication(pool, applicationId);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tutor application not found' });
    }

    console.log(`✅ Tutor application ${applicationId} deleted successfully`);
    
    res.status(200).json({ 
      success: true,
      message: 'Tutor application deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting tutor application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== TUTOR ENDPOINTS (for tutor matching) =====

// Get all approved tutors for matching
app.get('/api/tutors', async (req, res) => {
  try {
    console.log('=== TUTORS ENDPOINT HIT ===');
    console.log('Request query:', req.query);
    
    const { status, subject_id } = req.query;
    
    // Get a database connection
    const pool = await db.getPool();
    console.log('Database connection obtained');

    let tutors;
    if (subject_id) {
      console.log(`Fetching tutors for subject: ${subject_id}`);
      tutors = await getTutorsBySubject(pool, subject_id);
    } else if (status) {
      console.log(`Fetching tutors with status: ${status}`);
      tutors = await getTutorsByStatus(pool, status);
    } else {
      console.log('Fetching all approved tutors');
      tutors = await getApprovedTutors(pool);
    }

    console.log(`Found ${tutors.length} tutors`);

    // Transform the data to match frontend expectations
    const transformedTutors = tutors.map(tutor => ({
      application_id: tutor.application_id,
      user_id: tutor.user_id,
      name: tutor.name,
      email: tutor.email,
      subject_id: tutor.subject_id,
      subject_name: tutor.subject_name,
      application_date: tutor.application_date,
      status: tutor.status,
      validated_by: tutor.validated_by,
      tutor_information: tutor.tutor_information || '',
      program: tutor.program || '',
      specialties: tutor.specialties || ''
    }));

    console.log(`✅ Found ${transformedTutors.length} tutors`);
    
    res.status(200).json({ 
      success: true,
      tutors: transformedTutors,
      total: transformedTutors.length
    });
  } catch (err) {
    console.error('Error fetching tutors:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific tutor by ID
app.get('/api/tutors/:id', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.id);
    
    console.log(`Fetching tutor ${tutorId}`);

    // Get a database connection
    const pool = await db.getPool();

    const tutor = await getTutorById(pool, tutorId);

    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Transform the data to match frontend expectations
    const transformedTutor = {
      application_id: tutor.application_id,
      user_id: tutor.user_id,
      name: tutor.name,
      email: tutor.email,
      subject_id: tutor.subject_id,
      subject_name: tutor.subject_name,
      application_date: tutor.application_date,
      status: tutor.status,
      validated_by: tutor.validated_by,
      tutor_information: tutor.tutor_information || '',
      program: tutor.program || '',
      specialties: tutor.specialties || ''
    };

    console.log(`✅ Found tutor ${tutorId}`);
    
    res.status(200).json({ 
      success: true,
      tutor: transformedTutor
    });
  } catch (err) {
    console.error('Error fetching tutor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new tutor entry
app.post('/api/tutors', async (req, res) => {
  try {
    console.log('Creating new tutor:', req.body);

    const { 
      user_id, 
      name, 
      subject_id, 
      subject_name, 
      tutor_information, 
      program, 
      specialties 
    } = req.body;

    // Validate required fields
    if (!user_id || !name || !subject_id || !subject_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, name, subject_id, and subject_name are required' 
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Create the tutor
    const result = await createTutor(pool, {
      user_id,
      name,
      subject_id,
      subject_name,
      tutor_information,
      program,
      specialties
    });

    console.log(`✅ Tutor created with ID: ${result.insertId}`);
    
    res.status(201).json({ 
      success: true,
      message: 'Tutor created successfully',
      tutor_id: result.insertId
    });
  } catch (err) {
    console.error('Error creating tutor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SUBJECTS API ENDPOINTS =====

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    console.log('Fetching all subjects');
    
    const pool = await db.getPool();
    const subjects = await getAllSubjects(pool);
    
    console.log(`✅ Found ${subjects.length} subjects`);
    
    res.json({
      success: true,
      subjects: subjects,
      total: subjects.length
    });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get subject by ID
app.get('/api/subjects/:id', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.id);
    
    if (!subjectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid subject ID is required' 
      });
    }
    
    console.log(`Fetching subject with ID: ${subjectId}`);
    
    const pool = await db.getPool();
    const subject = await getSubjectById(pool, subjectId);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false,
        error: 'Subject not found' 
      });
    }
    
    console.log(`✅ Found subject: ${subject.subject_name}`);
    
    res.json({
      success: true,
      subject: subject
    });
  } catch (err) {
    console.error('Error fetching subject:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new subject
app.post('/api/subjects', async (req, res) => {
  try {
    const { subject_name, description, subject_code } = req.body;
    
    // Validation
    if (!subject_name || !description || !subject_code) {
      return res.status(400).json({ 
        success: false,
        error: 'Subject name, description, and subject code are required' 
      });
    }
    
    console.log(`Creating new subject: ${subject_name} (${subject_code})`);
    
    const pool = await db.getPool();
    const newSubject = await createSubject(pool, {
      subject_name,
      description,
      subject_code
    });
    
    console.log(`✅ Subject created successfully with ID: ${newSubject.subject_id}`);
    
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: newSubject
    });
  } catch (err) {
    console.error('Error creating subject:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false,
        error: 'Subject code already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update subject
app.put('/api/subjects/:id', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.id);
    const { subject_name, description, subject_code } = req.body;
    
    if (!subjectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid subject ID is required' 
      });
    }
    
    // Validation
    if (!subject_name || !description || !subject_code) {
      return res.status(400).json({ 
        success: false,
        error: 'Subject name, description, and subject code are required' 
      });
    }
    
    console.log(`Updating subject ID: ${subjectId}`);
    
    const pool = await db.getPool();
    
    // Check if subject exists
    const existingSubject = await getSubjectById(pool, subjectId);
    if (!existingSubject) {
      return res.status(404).json({ 
        success: false,
        error: 'Subject not found' 
      });
    }
    
    const updatedSubject = await updateSubject(pool, subjectId, {
      subject_name,
      description,
      subject_code
    });
    
    console.log(`✅ Subject updated successfully: ${subject_name}`);
    
    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject: updatedSubject
    });
  } catch (err) {
    console.error('Error updating subject:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false,
        error: 'Subject code already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete subject
app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.id);
    
    if (!subjectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid subject ID is required' 
      });
    }
    
    console.log(`Deleting subject ID: ${subjectId}`);
    
    const pool = await db.getPool();
    
    // Check if subject exists
    const existingSubject = await getSubjectById(pool, subjectId);
    if (!existingSubject) {
      return res.status(404).json({ 
        success: false,
        error: 'Subject not found' 
      });
    }
    
    await deleteSubject(pool, subjectId);
    
    console.log(`✅ Subject deleted successfully: ${existingSubject.subject_name}`);
    
    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting subject:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== STUDY MATERIALS (LEARNING RESOURCES) API ENDPOINTS =====

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../frontend/public/pending-resources');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all study materials
app.get('/api/study-materials', async (req, res) => {
  try {
    console.log('Fetching all study materials');
    
    const pool = await db.getPool();
    const materials = await getAllStudyMaterials(pool);
    
    console.log(`✅ Found ${materials.length} study materials`);
    
    res.json({
      success: true,
      materials: materials,
      total: materials.length
    });
  } catch (err) {
    console.error('Error fetching study materials:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get study material by ID
app.get('/api/study-materials/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Fetching study material ${materialId}`);
    
    const pool = await db.getPool();
    const material = await getStudyMaterialById(pool, materialId);
    
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Study material not found' 
      });
    }
    
    console.log(`✅ Found study material ${materialId}`);
    
    res.json({
      success: true,
      material: material
    });
  } catch (err) {
    console.error('Error fetching study material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Upload new study material (goes to pending for review)
app.post('/api/study-materials', upload.single('file'), async (req, res) => {
  try {
    console.log('Creating new pending study material:', req.body);
    console.log('Uploaded file:', req.file);

    const { title, description, subject, uploaded_by } = req.body;

    // Validate required fields
    if (!title || !uploaded_by) {
      return res.status(400).json({ 
        success: false,
        error: 'Title and uploaded_by are required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'PDF file is required' 
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Create the pending material for review
    const result = await createPendingMaterial(pool, {
      title,
      description,
      subject: subject || 'General',
      file_path: `/pending-resources/${req.file.filename}`,
      uploaded_by,
      file_type: 'PDF',
      file_size: req.file.size
    });

    console.log(`✅ Pending study material created with ID: ${result.material_id}`);
    
    res.status(201).json({ 
      success: true,
      message: 'Study material submitted for review. You will be notified once it is approved.',
      material: result
    });
  } catch (err) {
    console.error('Error creating study material:', err);
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('Error cleaning up uploaded file:', cleanupErr);
      }
    }
    
    if (err.message === 'Only PDF files are allowed!') {
      return res.status(400).json({ 
        success: false,
        error: 'Only PDF files are allowed' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update study material
app.put('/api/study-materials/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    const { title, description } = req.body;
    
    console.log(`Updating study material ${materialId}:`, req.body);

    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        success: false,
        error: 'Title is required' 
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Update the study material
    const success = await updateStudyMaterial(pool, materialId, {
      title,
      description
    });

    if (!success) {
      return res.status(404).json({ 
        success: false,
        error: 'Study material not found' 
      });
    }

    console.log(`✅ Study material ${materialId} updated successfully`);
    
    res.json({ 
      success: true,
      message: 'Study material updated successfully'
    });
  } catch (err) {
    console.error('Error updating study material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete study material
app.delete('/api/study-materials/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Deleting study material ${materialId}`);

    // Get a database connection
    const pool = await db.getPool();

    // Get material details for file cleanup
    const material = await getStudyMaterialById(pool, materialId);
    
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Study material not found' 
      });
    }

    // Delete from database (soft delete)
    const success = await deleteStudyMaterial(pool, materialId);

    if (!success) {
      return res.status(404).json({ 
        success: false,
        error: 'Study material not found' 
      });
    }

    // Optionally clean up the file (uncomment if you want to delete files)
    // try {
    //   const filePath = path.join(__dirname, '../../frontend/public', material.file_path);
    //   if (fs.existsSync(filePath)) {
    //     fs.unlinkSync(filePath);
    //   }
    // } catch (cleanupErr) {
    //   console.error('Error cleaning up file:', cleanupErr);
    // }

    console.log(`✅ Study material ${materialId} deleted successfully`);
    
    res.json({ 
      success: true,
      message: 'Study material deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting study material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Download study material (increment download count)
app.get('/api/study-materials/:id/download', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Downloading study material ${materialId}`);

    const pool = await db.getPool();
    
    // Get material details
    const material = await getStudyMaterialById(pool, materialId);
    
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Study material not found' 
      });
    }

    // Increment download count
    await incrementDownloadCount(pool, materialId);

    // Return file path for frontend to handle download
    res.json({
      success: true,
      file_path: material.file_path,
      title: material.title
    });
  } catch (err) {
    console.error('Error downloading study material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Preview study material (increment view count)
app.get('/api/study-materials/:id/preview', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Previewing study material ${materialId}`);

    const pool = await db.getPool();
    
    // Get material details
    const material = await getStudyMaterialById(pool, materialId);
    
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Study material not found' 
      });
    }

    // Increment view count
    await incrementViewCount(pool, materialId);

    // Return file path for frontend to handle preview
    res.json({
      success: true,
      file_path: material.file_path,
      title: material.title
    });
  } catch (err) {
    console.error('Error previewing study material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Search study materials
app.get('/api/study-materials/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    console.log(`Searching study materials for: ${searchTerm}`);

    const pool = await db.getPool();
    const materials = await searchStudyMaterials(pool, searchTerm);

    console.log(`✅ Found ${materials.length} study materials matching search`);
    
    res.json({
      success: true,
      materials: materials,
      total: materials.length,
      search_term: searchTerm
    });
  } catch (err) {
    console.error('Error searching study materials:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== PENDING MATERIALS API ENDPOINTS =====

// Get all pending materials
app.get('/api/pending-materials', async (req, res) => {
  try {
    console.log('Fetching all pending materials');
    
    const pool = await db.getPool();
    const materials = await getAllPendingMaterials(pool);
    
    console.log(`✅ Found ${materials.length} pending materials`);
    
    res.json({
      success: true,
      materials: materials,
      total: materials.length
    });
  } catch (err) {
    console.error('Error fetching pending materials:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending material by ID
app.get('/api/pending-materials/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Fetching pending material ${materialId}`);
    
    const pool = await db.getPool();
    const material = await getPendingMaterialById(pool, materialId);
    
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending material not found' 
      });
    }
    
    console.log(`✅ Found pending material ${materialId}`);
    
    res.json({
      success: true,
      material: material
    });
  } catch (err) {
    console.error('Error fetching pending material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Approve pending material
app.put('/api/pending-materials/:id/approve', async (req, res) => {
  try {
    const materialId = req.params.id;
    const { approved_by } = req.body;
    
    console.log(`Approving pending material ${materialId} by ${approved_by || 'system'}`);

    // Get a database connection
    const pool = await db.getPool();

    // Get reviewer's name
    let reviewerName = 'System';
    if (approved_by) {
      try {
        const [reviewerRows] = await pool.query(
          'SELECT CONCAT(first_name, " ", last_name) AS full_name FROM users WHERE user_id = ?',
          [approved_by]
        );
        if (reviewerRows.length > 0) {
          reviewerName = reviewerRows[0].full_name;
        }
      } catch (reviewerErr) {
        console.log('Could not fetch reviewer name:', reviewerErr);
      }
    }

    // Get pending material details
    const pendingMaterial = await getPendingMaterialById(pool, materialId);
    
    if (!pendingMaterial) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending material not found' 
      });
    }

    if (pendingMaterial.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Material is not in pending status' 
      });
    }

    // Transfer to study materials table
    const transferResult = await transferToStudyMaterials(pool, pendingMaterial);
    
    // Move file from pending-resources to learning-resources
    try {
      const pendingFilePath = path.join(__dirname, '../../frontend/public', pendingMaterial.file_path);
      const filename = path.basename(pendingMaterial.file_path);
      const learningResourcesPath = path.join(__dirname, '../../frontend/public/learning-resources');
      const newFilePath = path.join(learningResourcesPath, filename);
      
      // Create learning-resources directory if it doesn't exist
      if (!fs.existsSync(learningResourcesPath)) {
        fs.mkdirSync(learningResourcesPath, { recursive: true });
      }
      
      // Move file from pending-resources to learning-resources
      if (fs.existsSync(pendingFilePath)) {
        fs.renameSync(pendingFilePath, newFilePath);
        console.log(`✅ Moved file from ${pendingMaterial.file_path} to /learning-resources/${filename}`);
      }
    } catch (moveErr) {
      console.error('Error moving approved file:', moveErr);
      // Don't fail the approval if file move fails
    }
    
    // Update pending material status to approved
    const updateSuccess = await updatePendingMaterialStatus(pool, materialId, 'approved', approved_by || '1');

    if (!updateSuccess) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update material status' 
      });
    }

    console.log(`✅ Pending material ${materialId} approved successfully by ${reviewerName}`);
    
    // Send approval email to the user
    try {
      console.log(`Sending approval email to user ${pendingMaterial.uploaded_by}...`);
      
      const emailResult = await sendMaterialApprovalEmail(
        pendingMaterial.email,
        pendingMaterial.uploaded_by_name,
        pendingMaterial.title,
        reviewerName
      );
      
      if (emailResult.success) {
        console.log(`✅ Approval email sent successfully`);
      } else {
        console.log(`⚠️ Failed to send approval email: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.log(`⚠️ Error sending approval email: ${emailError.message}`);
    }
    
    res.json({ 
      success: true,
      message: 'Material approved successfully',
      approved_material: transferResult
    });
  } catch (err) {
    console.error('Error approving pending material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reject pending material
app.put('/api/pending-materials/:id/reject', async (req, res) => {
  try {
    const materialId = req.params.id;
    const { rejected_by, rejection_reason } = req.body;
    
    console.log(`Rejecting pending material ${materialId} by ${rejected_by || 'system'}`);

    // Get a database connection
    const pool = await db.getPool();

    // Get reviewer's name
    let reviewerName = 'System';
    if (rejected_by) {
      try {
        const [reviewerRows] = await pool.query(
          'SELECT CONCAT(first_name, " ", last_name) AS full_name FROM users WHERE user_id = ?',
          [rejected_by]
        );
        if (reviewerRows.length > 0) {
          reviewerName = reviewerRows[0].full_name;
        }
      } catch (reviewerErr) {
        console.log('Could not fetch reviewer name:', reviewerErr);
      }
    }

    // Get pending material details
    const pendingMaterial = await getPendingMaterialById(pool, materialId);
    
    if (!pendingMaterial) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending material not found' 
      });
    }

    if (pendingMaterial.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Material is not in pending status' 
      });
    }

    // Update pending material status to rejected
    const updateSuccess = await updatePendingMaterialStatus(pool, materialId, 'rejected', rejected_by || '1');

    if (!updateSuccess) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update material status' 
      });
    }

    // Optionally delete the uploaded file for rejected materials
    try {
      const filePath = path.join(__dirname, '../../frontend/public', pendingMaterial.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted rejected file: ${pendingMaterial.file_path}`);
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up rejected file:', cleanupErr);
    }

    console.log(`✅ Pending material ${materialId} rejected successfully by ${reviewerName}`);
    
    // Send rejection email to the user
    try {
      console.log(`Sending rejection email to user ${pendingMaterial.uploaded_by}...`);
      
      const emailResult = await sendMaterialRejectionEmail(
        pendingMaterial.email,
        pendingMaterial.uploaded_by_name,
        pendingMaterial.title,
        rejection_reason,
        reviewerName
      );
      
      if (emailResult.success) {
        console.log(`✅ Rejection email sent successfully`);
      } else {
        console.log(`⚠️ Failed to send rejection email: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.log(`⚠️ Error sending rejection email: ${emailError.message}`);
    }
    
    res.json({ 
      success: true,
      message: 'Material rejected successfully'
    });
  } catch (err) {
    console.error('Error rejecting pending material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete pending material
app.delete('/api/pending-materials/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Deleting pending material ${materialId}`);

    // Get a database connection
    const pool = await db.getPool();

    // Get material details for file cleanup
    const material = await getPendingMaterialById(pool, materialId);
    
    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending material not found' 
      });
    }

    // Delete from database
    const success = await deletePendingMaterial(pool, materialId);

    if (!success) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending material not found' 
      });
    }

    // Clean up the file
    try {
      const filePath = path.join(__dirname, '../../frontend/public', material.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted file: ${material.file_path}`);
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up file:', cleanupErr);
    }

    console.log(`✅ Pending material ${materialId} deleted successfully`);
    
    res.json({ 
      success: true,
      message: 'Pending material deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting pending material:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending materials by status
app.get('/api/pending-materials/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    console.log(`Fetching pending materials with status: ${status}`);

    const pool = await db.getPool();
    const materials = await getPendingMaterialsByStatus(pool, status);

    console.log(`✅ Found ${materials.length} materials with status ${status}`);
    
    res.json({
      success: true,
      materials: materials,
      total: materials.length,
      status: status
    });
  } catch (err) {
    console.error('Error fetching pending materials by status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== QUIZZES API ENDPOINTS =====

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    console.log('Fetching all quizzes');
    
    const pool = await db.getPool();
    const quizzes = await getAllQuizzes(pool);
    
    console.log(`✅ Found ${quizzes.length} quizzes`);
    
    res.json({
      success: true,
      quizzes: quizzes,
      total: quizzes.length
    });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get quiz by ID
app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    console.log(`Fetching quiz with ID: ${quizId}`);
    
    const pool = await db.getPool();
    const quiz = await getQuizById(pool, quizId);
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        error: 'Quiz not found' 
      });
    }
    
    console.log(`✅ Quiz found: ${quiz.title}`);
    
    res.json({
      success: true,
      quiz: quiz
    });
  } catch (err) {
    console.error('Error fetching quiz by ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get quizzes by subject
app.get('/api/quizzes/subject/:subjectId', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    
    if (!subjectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid subject ID is required' 
      });
    }
    
    console.log(`Fetching quizzes for subject ID: ${subjectId}`);
    
    const pool = await db.getPool();
    const quizzes = await getQuizzesBySubject(pool, subjectId);
    
    console.log(`✅ Found ${quizzes.length} quizzes for subject`);
    
    res.json({
      success: true,
      quizzes: quizzes,
      total: quizzes.length
    });
  } catch (err) {
    console.error('Error fetching quizzes by subject:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new quiz
app.post('/api/quizzes', async (req, res) => {
  try {
    const { title, subject_id, subject_name, description, created_by, quiz_type, duration, difficulty, item_counts } = req.body;
    
    // Add debugging to see what data is received
    console.log('=== QUIZ CREATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Subject ID:', subject_id);
    console.log('Subject Name:', subject_name);
    console.log('===========================');
    
    if (!title || !subject_id || !created_by) {
      return res.status(400).json({ 
        success: false,
        error: 'Title, subject_id, and created_by are required' 
      });
    }
    
    console.log(`Creating new quiz: ${title}`);
    
    const pool = await db.getPool();
    const newQuiz = await createQuiz(pool, {
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type,
      duration,
      difficulty,
      item_counts
    });
    
    console.log(`✅ Quiz created successfully: ${title}`);
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: newQuiz
    });
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update quiz
app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { title, subject_id, description, quiz_type, duration, difficulty, item_counts } = req.body;
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    if (!title || !subject_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Title and subject_id are required' 
      });
    }
    
    console.log(`Updating quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    
    // Check if quiz exists
    const existingQuiz = await getQuizById(pool, quizId);
    if (!existingQuiz) {
      return res.status(404).json({ 
        success: false,
        error: 'Quiz not found' 
      });
    }
    
    const updatedQuiz = await updateQuiz(pool, quizId, {
      title,
      subject_id,
      description,
      quiz_type,
      duration,
      difficulty,
      item_counts
    });
    
    console.log(`✅ Quiz updated successfully: ${title}`);
    
    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz: updatedQuiz
    });
  } catch (err) {
    console.error('Error updating quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete quiz
app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
 
      });
    }
    
    console.log(`Deleting quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    
    // Check if quiz exists
    const existingQuiz = await getQuizById(pool, quizId);
    if (!existingQuiz) {
      return res.status(404).json({ 
        success: false,
        error: 'Quiz not found' 
      });
    }
    
    await deleteQuiz(pool, quizId);
    
    console.log(`✅ Quiz deleted successfully: ${existingQuiz.title}`);
    
    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user quiz attempts
app.get('/api/quizzes/:id/attempts/:userId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!quizId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID and user ID are required' 
      });
    }
    
    console.log(`Fetching attempts for quiz ${quizId} by user ${userId}`);
    
    const pool = await db.getPool();
    const attempts = await getUserQuizAttempts(pool, quizId, userId);
    
    console.log(`✅ Found ${attempts.length} attempts`);
    
    res.json({
      success: true,
      attempts: attempts,
      total: attempts.length
    });
  } catch (err) {
    console.error('Error fetching user quiz attempts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== QUESTIONS API ENDPOINTS =====

// Get questions for a quiz
app.get('/api/questions/quiz/:quizId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    console.log(`Fetching questions for quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    const questions = await getQuestionsByQuizId(pool, quizId);
    
    console.log(`✅ Found ${questions.length} questions`);
    
    res.json({
      success: true,
      questions: questions,
      total: questions.length
    });
  } catch (err) {
    console.error('Error fetching questions by quiz ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get question by ID
app.get('/api/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid question ID is required' 
      });
    }
    
    console.log(`Fetching question with ID: ${questionId}`);
    
    const pool = await db.getPool();
    const question = await getQuestionById(pool, questionId);
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }
    
    console.log(`✅ Question found`);
    
    res.json({
      success: true,
      question: question
    });
  } catch (err) {
    console.error('Error fetching question by ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new question
app.post('/api/questions', async (req, res) => {
  try {
    const { quizzes_id, question, choices, answer, explanation, points } = req.body;
    
    if (!quizzes_id || !question || !answer) {
      return res.status(400).json({ 
        success: false,
        error: 'quizzes_id, question, and answer are required' 
      });
    }
    
    console.log(`Creating new question for quiz ID: ${quizzes_id}`);
    
    const pool = await db.getPool();
    const newQuestion = await createQuestion(pool, {
      quizzes_id,
      question,
      choices,
      answer,
      explanation,
      points
    });
    
    console.log(`✅ Question created successfully`);
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: newQuestion
    });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { question_text, question_type, choices, correct_answer, explanation, points } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid question ID is required' 
      });
    }
    
    if (!question_text || !question_type || !correct_answer) {
      return res.status(400).json({ 
        success: false,
        error: 'question_text, question_type, and correct_answer are required' 
      });
    }
    
    console.log(`Updating question ID: ${questionId}`);
    
    const pool = await db.getPool();
    
    // Check if question exists
    const existingQuestion = await getQuestionById(pool, questionId);
    if (!existingQuestion) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }
    
    const updatedQuestion = await updateQuestion(pool, questionId, {
      question_text,
      question_type,
      choices,
      correct_answer,
      explanation,
      points
    });
    
    console.log(`✅ Question updated successfully`);
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid question ID is required' 
      });
    }
    
    console.log(`Deleting question ID: ${questionId}`);
    
    const pool = await db.getPool();
    
    // Check if question exists
    const existingQuestion = await getQuestionById(pool, questionId);
    if (!existingQuestion) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }
    
    await deleteQuestion(pool, questionId);
    
    console.log(`✅ Question deleted successfully`);
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete all questions for a quiz
app.delete('/api/questions/quiz/:quizId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    console.log(`Deleting all questions for quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    await deleteQuestionsByQuizId(pool, quizId);
    
    console.log(`✅ All questions deleted for quiz`);
    
    res.json({
      success: true,
      message: 'All questions deleted for quiz'
    });
  } catch (err) {
    console.error('Error deleting questions by quiz ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== QUIZ ATTEMPTS API ENDPOINTS =====

// Get all quiz attempts
app.get('/api/quiz-attempts', async (req, res) => {
  try {
    console.log('Fetching all quiz attempts');
    
    const pool = await db.getPool();
    const attempts = await getAllQuizAttempts(pool);
    
    console.log(`✅ Found ${attempts.length} quiz attempts`);
    
    res.json({
      success: true,
      attempts: attempts,
      total: attempts.length
    });
  } catch (err) {
    console.error('Error fetching quiz attempts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get quiz attempt by ID
app.get('/api/quiz-attempts/:id', async (req, res) => {
  try {
    const attemptId = parseInt(req.params.id);
    
    if (!attemptId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid attempt ID is required' 
      });
    }
    
    console.log(`Fetching quiz attempt with ID: ${attemptId}`);
    
    const pool = await db.getPool();
    const attempt = await getQuizAttemptById(pool, attemptId);
    
    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        error: 'Quiz attempt not found' 
      });
    }
    
    console.log(`✅ Quiz attempt found`);
    
    res.json({
      success: true,
      attempt: attempt
    });
  } catch (err) {
    console.error('Error fetching quiz attempt by ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get quiz attempts by user
app.get('/api/quiz-attempts/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user ID is required' 
      });
    }
    
    console.log(`Fetching quiz attempts for user ID: ${userId}`);
    
    const pool = await db.getPool();
    const attempts = await getQuizAttemptsByUser(pool, userId);
    
    console.log(`✅ Found ${attempts.length} attempts for user`);
    
    res.json({
      success: true,
      attempts: attempts,
      total: attempts.length
    });
  } catch (err) {
    console.error('Error fetching quiz attempts by user:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get quiz attempts by quiz
app.get('/api/quiz-attempts/quiz/:quizId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    console.log(`Fetching attempts for quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    const attempts = await getQuizAttemptsByQuiz(pool, quizId);
    
    console.log(`✅ Found ${attempts.length} attempts for quiz`);
    
    res.json({
      success: true,
      attempts: attempts,
      total: attempts.length
    });
  } catch (err) {
    console.error('Error fetching quiz attempts by quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new quiz attempt
app.post('/api/quiz-attempts', async (req, res) => {
  try {
    const { quiz_id, user_id, name, score, answers } = req.body;
    
    if (!quiz_id || !user_id || !name || score === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'quiz_id, user_id, name, and score are required' 
      });
    }
    
    console.log(`Creating new quiz attempt for user ${user_id} on quiz ${quiz_id}`);
    
    const pool = await db.getPool();
    const newAttempt = await createQuizAttempt(pool, {
      quizzes_id: quiz_id,  // Map quiz_id to quizzes_id for the database
      user_id,
      name,
      score,
      answers
    });
    
    console.log(`✅ Quiz attempt created successfully`);
    
    res.status(201).json({
      success: true,
      message: 'Quiz attempt created successfully',
      attempt: newAttempt
    });
  } catch (err) {
    console.error('Error creating quiz attempt:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update quiz attempt
app.put('/api/quiz-attempts/:id', async (req, res) => {
  try {
    const attemptId = parseInt(req.params.id);
    const { score, answers } = req.body;
    
    if (!attemptId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid attempt ID is required' 
      });
    }
    
    if (score === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Score is required' 
      });
    }
    
    console.log(`Updating quiz attempt ID: ${attemptId}`);
    
    const pool = await db.getPool();
    
    // Check if attempt exists
    const existingAttempt = await getQuizAttemptById(pool, attemptId);
    if (!existingAttempt) {
      return res.status(404).json({ 
        success: false,
        error: 'Quiz attempt not found' 
      });
    }
    
    const updatedAttempt = await updateQuizAttempt(pool, attemptId, {
      score,
      answers
    });
    
    console.log(`✅ Quiz attempt updated successfully`);
    
    res.json({
      success: true,
      message: 'Quiz attempt updated successfully',
      attempt: updatedAttempt
    });
  } catch (err) {
    console.error('Error updating quiz attempt:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete quiz attempt
app.delete('/api/quiz-attempts/:id', async (req, res) => {
  try {
    const attemptId = parseInt(req.params.id);
    
    if (!attemptId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid attempt ID is required' 
      });
    }
    
    console.log(`Deleting quiz attempt ID: ${attemptId}`);
    
    const pool = await db.getPool();
    
    // Check if attempt exists
    const existingAttempt = await getQuizAttemptById(pool, attemptId);
    if (!existingAttempt) {
      return res.status(404).json({ 
        success: false,
        error: 'Quiz attempt not found' 
      });
    }
    
    await deleteQuizAttempt(pool, attemptId);
    
    console.log(`✅ Quiz attempt deleted successfully`);
    
    res.json({
      success: true,
      message: 'Quiz attempt deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting quiz attempt:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user's best score for a quiz
app.get('/api/quiz-attempts/best-score/:quizId/:userId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const userId = parseInt(req.params.userId);
    
    if (!quizId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID and user ID are required' 
      });
    }
    
    console.log(`Fetching best score for user ${userId} on quiz ${quizId}`);
    
    const pool = await db.getPool();
    const bestScore = await getUserBestScore(pool, quizId, userId);
    
    console.log(`✅ Best score retrieved`);
    
    res.json({
      success: true,
      bestScore: bestScore
    });
  } catch (err) {
    console.error('Error fetching user best score:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get quiz statistics
app.get('/api/quiz-attempts/statistics/:quizId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    console.log(`Fetching statistics for quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    const stats = await getQuizStatistics(pool, quizId);
    
    console.log(`✅ Quiz statistics retrieved`);
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (err) {
    console.error('Error fetching quiz statistics:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ============ FLASHCARDS ENDPOINTS ============

// Get all flashcards
app.get('/api/flashcards', async (req, res) => {
  try {
    const { user_id } = req.query;
    console.log('Fetching all flashcards', user_id ? `with progress for user ${user_id}` : '');
    
    const pool = await db.getPool();
    let flashcards;
    
    if (user_id) {
      // Get flashcards with progress for specific user
      flashcards = await getAllFlashcardsWithProgress(pool, parseInt(user_id));
    } else {
      // Get all flashcards without progress
      flashcards = await getAllFlashcards(pool);
    }
    
    console.log(`✅ Retrieved ${flashcards.length} flashcards`);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length
    });
  } catch (err) {
    console.error('Error fetching flashcards:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get flashcard by ID
app.get('/api/flashcards/:id', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    
    if (!flashcardId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid flashcard ID is required' 
      });
    }
    
    console.log(`Fetching flashcard ID: ${flashcardId}`);
    
    const pool = await db.getPool();
    const flashcard = await getFlashcardById(pool, flashcardId);
    
    if (!flashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard not found' 
      });
    }
    
    console.log(`✅ Flashcard retrieved: ${flashcard.question}`);
    
    res.json({
      success: true,
      flashcard: flashcard
    });
  } catch (err) {
    console.error('Error fetching flashcard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get flashcards by subject
app.get('/api/flashcards/subject/:subjectId', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    
    if (!subjectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid subject ID is required' 
      });
    }
    
    console.log(`Fetching flashcards for subject ID: ${subjectId}`);
    
    const pool = await db.getPool();
    const flashcards = await getFlashcardsBySubject(pool, subjectId);
    
    console.log(`✅ Retrieved ${flashcards.length} flashcards for subject`);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length
    });
  } catch (err) {
    console.error('Error fetching flashcards by subject:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get flashcards by creator
app.get('/api/flashcards/creator/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user ID is required' 
      });
    }
    
    console.log(`Fetching flashcards created by user ID: ${userId}`);
    
    const pool = await db.getPool();
    const flashcards = await getFlashcardsByCreator(pool, userId);
    
    console.log(`✅ Retrieved ${flashcards.length} flashcards by creator`);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length
    });
  } catch (err) {
    console.error('Error fetching flashcards by creator:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new flashcard
app.post('/api/flashcards', async (req, res) => {
  try {
    const { question, answer, subject_id, created_by, sub_id } = req.body;

    if (!question || !answer || !subject_id || !created_by) {
      return res.status(400).json({ 
        success: false,
        error: 'Question, answer, subject_id, and created_by are required' 
      });
    }

    console.log(`Creating new flashcard: ${question}, sub_id: ${sub_id}`);

    const pool = await db.getPool();
    const flashcard = await createFlashcard(pool, {
      question,
      answer,
      subject_id,
      created_by,
      sub_id
    });

    console.log(`✅ Flashcard created successfully: ${question}`);

    res.status(201).json({
      success: true,
      flashcard: flashcard,
      message: 'Flashcard created successfully'
    });
  } catch (err) {
    console.error('Error creating flashcard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update flashcard
app.put('/api/flashcards/:id', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    const { question, answer, subject_id } = req.body;
    
    if (!flashcardId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid flashcard ID is required' 
      });
    }
    
    if (!question || !answer || !subject_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Question, answer, and subject_id are required' 
      });
    }
    
    console.log(`Updating flashcard ID: ${flashcardId}`);
    
    const pool = await db.getPool();
    
    // Check if flashcard exists
    const existingFlashcard = await getFlashcardById(pool, flashcardId);
    if (!existingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard not found' 
      });
    }
    
    const updated = await updateFlashcard(pool, flashcardId, {
      question,
      answer,
      subject_id
    });
    
    if (!updated) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update flashcard' 
      });
    }
    
    console.log(`✅ Flashcard updated successfully: ${question}`);
    
    res.json({
      success: true,
      message: 'Flashcard updated successfully'
    });
  } catch (err) {
    console.error('Error updating flashcard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete flashcard
app.delete('/api/flashcards/:id', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    
    if (!flashcardId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid flashcard ID is required' 
      });
    }
    
    console.log(`Deleting flashcard ID: ${flashcardId}`);
    
    const pool = await db.getPool();
    
    // Check if flashcard exists
    const existingFlashcard = await getFlashcardById(pool, flashcardId);
    if (!existingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard not found' 
      });
    }
    
    const deleted = await deleteFlashcard(pool, flashcardId);
    
    if (!deleted) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete flashcard' 
      });
    }
    
    console.log(`✅ Flashcard deleted successfully: ${existingFlashcard.question}`);
    
    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting flashcard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ============ FLASHCARD PROGRESS ENDPOINTS ============

// Get flashcard progress statistics for a user
app.get('/api/flashcards/progress/stats/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user ID is required' 
      });
    }
    
    console.log(`Fetching flashcard progress stats for user ID: ${userId}`);
    
    const pool = await db.getPool();
    const stats = await getFlashcardProgressStats(pool, userId);
    const statsBySubject = await getFlashcardProgressStatsBySubject(pool, userId);
    
    console.log(`✅ Retrieved flashcard progress stats for user ${userId}`);
    
    res.json({
      success: true,
      stats: stats,
      statsBySubject: statsBySubject
    });
  } catch (err) {
    console.error('Error fetching flashcard progress stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get flashcard progress for a user
app.get('/api/flashcards/progress/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user ID is required' 
      });
    }
    
    console.log(`Fetching flashcard progress for user ID: ${userId}`);
    
    const pool = await db.getPool();
    const progress = await getFlashcardProgressByUser(pool, userId);
    
    console.log(`✅ Retrieved ${progress.length} flashcard progress records for user`);
    
    res.json({
      success: true,
      progress: progress,
      total: progress.length
    });
  } catch (err) {
    console.error('Error fetching flashcard progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get specific flashcard progress for a user
app.get('/api/flashcards/:flashcardId/progress/:userId', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.flashcardId);
    const userId = parseInt(req.params.userId);
    
    if (!flashcardId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid flashcard ID and user ID are required' 
      });
    }
    
    console.log(`Fetching progress for flashcard ${flashcardId}, user ${userId}`);
    
    const pool = await db.getPool();
    const progress = await getFlashcardProgress(pool, flashcardId, userId);
    
    res.json({
      success: true,
      progress: progress
    });
  } catch (err) {
    console.error('Error fetching flashcard progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update flashcard progress
app.post('/api/flashcards/:flashcardId/progress', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.flashcardId);
    const { user_id, status } = req.body;
    
    if (!flashcardId || !user_id || !status) {
      return res.status(400).json({ 
        success: false,
        error: 'Flashcard ID, user_id, and status are required' 
      });
    }
    
    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Status must be one of: ' + validStatuses.join(', ')
      });
    }
    
    console.log(`Updating flashcard progress: flashcard ${flashcardId}, user ${user_id}, status ${status}`);
    
    const pool = await db.getPool();
    
    // Check if flashcard exists
    const existingFlashcard = await getFlashcardById(pool, flashcardId);
    if (!existingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard not found' 
      });
    }
    
    const progress = await upsertFlashcardProgress(pool, {
      flashcard_id: flashcardId,
      user_id: parseInt(user_id),
      status: status
    });
    
    console.log(`✅ Flashcard progress updated successfully`);
    
    res.json({
      success: true,
      progress: progress,
      message: 'Flashcard progress updated successfully'
    });
  } catch (err) {
    console.error('Error updating flashcard progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Mark flashcard as completed
app.post('/api/flashcards/:flashcardId/complete', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.flashcardId);
    const { user_id } = req.body;
    
    if (!flashcardId || !user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Flashcard ID and user_id are required' 
      });
    }
    
    console.log(`Marking flashcard ${flashcardId} as completed for user ${user_id}`);
    
    const pool = await db.getPool();
    
    // Check if flashcard exists
    const existingFlashcard = await getFlashcardById(pool, flashcardId);
    if (!existingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard not found' 
      });
    }
    
    const progress = await markFlashcardCompleted(pool, flashcardId, parseInt(user_id));
    
    console.log(`✅ Flashcard marked as completed successfully`);
    
    res.json({
      success: true,
      progress: progress,
      message: 'Flashcard marked as completed successfully'
    });
  } catch (err) {
    console.error('Error marking flashcard as completed:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reset flashcard progress
app.post('/api/flashcards/:flashcardId/reset', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.flashcardId);
    const { user_id } = req.body;
    
    if (!flashcardId || !user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Flashcard ID and user_id are required' 
      });
    }
    
    console.log(`Resetting flashcard ${flashcardId} progress for user ${user_id}`);
    
    const pool = await db.getPool();
    
    // Check if flashcard exists
    const existingFlashcard = await getFlashcardById(pool, flashcardId);
    if (!existingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard not found' 
      });
    }
    
    const progress = await resetFlashcardProgress(pool, flashcardId, parseInt(user_id));
    
    console.log(`✅ Flashcard progress reset successfully`);
    
    res.json({
      success: true,
      progress: progress,
      message: 'Flashcard progress reset successfully'
    });
  } catch (err) {
    console.error('Error resetting flashcard progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// API endpoint: Create a new session booking
app.post('/api/sessions', async (req, res) => {
  try {
    console.log('Received request payload:', req.body);

    const { tutor_id, student_id, preferred_dates, preferred_time } = req.body;

    if (!tutor_id || !student_id || !preferred_dates || !Array.isArray(preferred_dates) || preferred_dates.length !== 2 || !preferred_time) {
      console.error('Validation failed for request payload:', req.body);
      return res.status(400).json({ success: false, error: 'Missing or invalid required fields' });
    }

    // preferred_dates: [startDate, endDate]
    const [start_date, end_date] = preferred_dates;

    // Fetch tutor_name and student_name from the users table
    const pool = await db.getPool();
    const [[tutor]] = await pool.query('SELECT CONCAT(first_name, " ", last_name) AS name FROM users WHERE user_id = ?', [tutor_id]);
    const [[student]] = await pool.query('SELECT CONCAT(first_name, " ", last_name) AS name FROM users WHERE user_id = ?', [student_id]);

    const tutor_name = tutor ? tutor.name : 'Unknown Tutor';
    const student_name = student ? student.name : 'Unknown Student';

    console.log('Creating session with details:', {
      tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time
    });

    const booking_id = await createSession({ tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time });
    console.log('Session created successfully with booking_id:', booking_id);

    res.status(201).json({ success: true, booking_id });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

// API endpoint: Get sessions for a student or tutor
app.get('/api/sessions', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'Missing user_id' });
    }

    // Get a database connection
    const pool = await db.getPool();

    const query = `
      SELECT * FROM bookings
      WHERE student_id = ? OR tutor_id = ?
    `;

    const [sessions] = await pool.query(query, [user_id, user_id]);

    if (sessions.length === 0) {
      console.log(`No sessions found for user_id: ${user_id}`);
    } else {
      console.log(`Found ${sessions.length} sessions for user_id: ${user_id}`);
    }

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

async function start() {
  try {
    await db.connect()
    app.listen(PORT, async () => {
      console.log(`Server listening at http://localhost:${PORT}`)
      
      // Check email configuration
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const isConnected = await testEmailConnection();
          if (isConnected) {
            console.log(`✅ Email service ready: ${process.env.SMTP_USER}`);
          } else {
            console.log(`❌ Email service failed`);
          }
        } catch (error) {
          console.log(`❌ Email service error`);
        }
      } else {
        console.log(`⚠️  Email not configured`);
      }
    })
  } catch (err) {
    console.error('Startup error', err)
    process.exit(1)
  }
}

start()

async function handleSubmit(e) {
  e.preventDefault();

  const response = await fetch('http://localhost:4000/api/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name,
      middle_name,
      last_name,
      email,
      password,
      role,
      status,
    }),
  });

  const data = await response.json();
  console.log(data);
}
