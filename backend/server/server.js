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
const {
  getAllPendingQuizzes,
  getPendingQuizById,
  createPendingQuiz,
  updatePendingQuizStatus,
  deletePendingQuiz,
  getPendingQuizzesByStatus,
  getPendingQuizzesByUser,
  transferToQuizzes
} = require('../queries/pendingQuizzes')
const {
  getAllPendingFlashcards,
  getPendingFlashcardById,
  createPendingFlashcard,
  updatePendingFlashcardStatus,
  deletePendingFlashcard,
  getPendingFlashcardsByStatus,
  transferToFlashcards,
  getPendingFlashcardsBySubId,
  getPendingFlashcardsByUser,
  deletePendingFlashcardsBySubId
} = require('../queries/pendingFlashcards')
const { createSession, getSessions } = require('../queries/sessions')
const { getAllForums, getForumById, createForum } = require('../queries/forums')
const { getCommentsByForumId, addComment } = require('../queries/comments')

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

    const { first_name, middle_name, last_name, email, password, program, role, status, year_level } = req.body;

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
      year_level,
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

    const { first_name, middle_name, last_name, email, program, role, status, year_level } = req.body;

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
      year_level,
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
      'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, year_level, first_login, created_at FROM users ORDER BY created_at DESC'
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

// Get single user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log(`Fetching user with ID: ${userId}`);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user ID is required' 
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Fetch single user (excluding password for security)
    const [users] = await pool.query(
      'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, year_level, first_login, created_at, description FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    console.log(`✅ Found user: ${users[0].email}`);
    
    res.status(200).json({ 
      success: true,
      user: users[0]
    });
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Add endpoint to fetch students specifically
// Add endpoint to fetch faculty specifically
app.get('/api/faculty', async (req, res) => {
  try {
    console.log('Fetching faculty for subject assignment');

    // Get a database connection
    const pool = await db.getPool();

    // Fetch only faculty with active status (excluding passwords for security)
    const [faculty] = await pool.query(
      'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, year_level, first_login, created_at FROM users WHERE role = ? AND status = ? ORDER BY created_at DESC',
      ['Faculty', 'active']
    );

    console.log(`✅ Found ${faculty.length} active faculty`);
    res.status(200).json({
      success: true,
      faculty: faculty,
      total: faculty.length
    });
  } catch (err) {
    console.error('Error fetching faculty:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/students', async (req, res) => {
  try {
    console.log('Fetching students for tutor matching');

    // Get a database connection
    const pool = await db.getPool();

    // Fetch only students with active status (excluding passwords for security)
    const [students] = await pool.query(
      'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, year_level, first_login, created_at FROM users WHERE role = ? AND status = ? ORDER BY created_at DESC',
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
    const { first_name, middle_name, last_name, email, program, role, status, year_level } = req.body;

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
      status,
      year_level
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
    const { first_name, middle_name, last_name, description, program, role, year_level, currentPassword, newPassword } = req.body;

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
        'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, description = ?, program = ?, role = ?, year_level = ?, password = ? WHERE user_id = ?',
        [first_name, middle_name || null, last_name, description || null, program || null, role, year_level || null, hashedNewPassword, userId]
      );

      console.log('Profile updated with password change for user:', userId);
    } else {
      // Update profile without password change
      await pool.query(
        'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, description = ?, program = ?, role = ?, year_level = ? WHERE user_id = ?',
        [first_name, middle_name || null, last_name, description || null, program || null, role, year_level || null, userId]
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

    // Get all applications
    let applications;
    if (status) {
      applications = await getTutorApplicationsByStatus(pool, status);
    } else {
      applications = await getAllTutorApplications(pool);
    }

    // Get all subjects and users for faculty matching
    const subjects = await pool.query('SELECT subject_id, user_id FROM subjects');
    // user_id is a JSON array of faculty ids
    const subjectFacultyMap = {};
    subjects[0].forEach(subj => {
      let facultyIds = [];
      if (subj.user_id) {
        try {
          facultyIds = JSON.parse(subj.user_id);
        } catch {
          facultyIds = [];
        }
      }
      subjectFacultyMap[subj.subject_id] = facultyIds;
    });

    // Get current user from request header (assume user_id and role are sent)
    const currentUserId = req.headers['x-user-id'];
    const currentUserRole = req.headers['x-user-role'];

    // Filter applications for faculty
    let filteredApplications = applications;
    if (currentUserRole === 'Faculty' && currentUserId) {
      filteredApplications = applications.filter(app => {
        const assignedFaculty = subjectFacultyMap[app.subject_id] || [];
        return assignedFaculty.some(fid => String(fid) === String(currentUserId));
      });
    }

    // Transform the data to match frontend expectations
    const transformedApplications = filteredApplications.map(app => ({
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

    console.log(`✅ Found ${transformedApplications.length} tutor applications (filtered)`);
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
    const { validatedby, comment } = req.body;
    
    // Validate that comment is provided
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection comment is required' 
      });
    }
    
    console.log(`Rejecting tutor application ${applicationId} by user ${validatedby} with comment`);

    // Get a database connection
    const pool = await db.getPool();

    // Check if application exists
    const application = await getTutorApplicationById(pool, applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Tutor application not found' });
    }

    console.log(`Found application for user ${application.user_id}`);

    // Update application status to rejected with comment
    const result = await updateTutorApplicationStatus(pool, applicationId, 'rejected', validatedby || '1', comment);

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
        const emailResult = await sendTutorRejectionEmail(
          user.email,
          `${user.first_name} ${user.last_name}`,
          subject.subject_name,
          subject.subject_code,
          comment
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

    // Transform the data to match frontend expectations, including ratings
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
      specialties: tutor.specialties || '',
      ratings: tutor.ratings
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
    // Fetch all users for matching
    const [users] = await pool.query('SELECT user_id, first_name, middle_name, last_name, email FROM users');

    // Attach assigned faculty info to each subject
    const subjectsWithFaculty = subjects.map(subj => {
      let facultyIds = [];
      if (subj.user_id) {
        try {
          facultyIds = JSON.parse(subj.user_id);
        } catch {
          facultyIds = [];
        }
      }
      const assigned_faculty = facultyIds.map(fid => {
        const user = users.find(u => String(u.user_id) === String(fid));
        return user
          ? `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name} (${user.email})`
          : `Faculty ID: ${fid}`;
      });
      
      // Parse program if it's a JSON string
      let programArray = [];
      if (subj.program) {
        try {
          programArray = JSON.parse(subj.program);
        } catch {
          programArray = [subj.program];
        }
      }
      
      return { 
        ...subj, 
        assigned_faculty, 
        faculty_ids: facultyIds,
        program: programArray
      };
    });

    console.log(`✅ Found ${subjects.length} subjects`);
    res.json({
      success: true,
      subjects: subjectsWithFaculty,
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
  const { subject_name, description, subject_code, faculty_ids, program, year_level } = req.body;
    
    // Validation
    if (!subject_name || !description || !subject_code) {
      return res.status(400).json({ 
        success: false,
        error: 'Subject name, description, and subject code are required' 
      });
    }
    
    console.log(`Creating new subject: ${subject_name} (${subject_code})`);
    
    const pool = await db.getPool();
    // Store faculty_ids as JSON string in user_id field
    const user_id = Array.isArray(faculty_ids) ? JSON.stringify(faculty_ids) : faculty_ids ? JSON.stringify([faculty_ids]) : null;
    // Store program as JSON string if it's an array
    const programString = Array.isArray(program) ? JSON.stringify(program) : program;
    const newSubject = await createSubject(pool, {
      subject_name,
      description,
      subject_code,
      user_id,
      program: programString,
      year_level
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
  const { subject_name, description, subject_code, faculty_ids, program, year_level } = req.body;
    
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
    
    // Store faculty_ids as JSON string in user_id field
    const user_id = Array.isArray(faculty_ids) ? JSON.stringify(faculty_ids) : faculty_ids ? JSON.stringify([faculty_ids]) : null;
    // Store program as JSON string if it's an array
    const programString = Array.isArray(program) ? JSON.stringify(program) : program;
    const updatedSubject = await updateSubject(pool, subjectId, {
      subject_name,
      description,
      subject_code,
      user_id,
      program: programString,
      year_level
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

    const { title, description, subject, uploaded_by, program } = req.body;

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
      file_size: req.file.size,
      program
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
    const { rejected_by, comment } = req.body;
    
    // Validate that comment is provided
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection comment is required' 
      });
    }
    
    console.log(`Rejecting pending material ${materialId} by ${rejected_by || 'system'} with comment`);

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

    // Update pending material status to rejected with comment
    const updateSuccess = await updatePendingMaterialStatus(pool, materialId, 'rejected', rejected_by || '1', comment);

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
        comment,
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

// ===== PENDING QUIZZES API ENDPOINTS =====

// Get all pending quizzes
app.get('/api/pending-quizzes', async (req, res) => {
  try {
    console.log('Fetching all pending quizzes');
    const pool = await db.getPool();
    const quizzes = await getAllPendingQuizzes(pool);
    
    res.json({
      success: true,
      quizzes: quizzes,
      total: quizzes.length
    });
  } catch (err) {
    console.error('Error fetching pending quizzes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending quiz by ID
app.get('/api/pending-quizzes/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const pool = await db.getPool();
    const quiz = await getPendingQuizById(pool, quizId);
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending quiz not found' 
      });
    }
    
    res.json({
      success: true,
      quiz: quiz
    });
  } catch (err) {
    console.error('Error fetching pending quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Approve pending quiz

app.put('/api/pending-quizzes/:id/approve', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { approved_by } = req.body;
    
    console.log(`Approving pending quiz ID: ${quizId}`);
    
    const pool = await db.getPool();
    
    // Get the pending quiz details
    const pendingQuiz = await getPendingQuizById(pool, quizId);
    if (!pendingQuiz) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending quiz not found' 
      });
    }
    
    // Transfer to quizzes table (this creates a NEW quiz with a NEW quizzes_id)
    const newQuiz = await transferToQuizzes(pool, pendingQuiz);
    const newQuizId = newQuiz.quizzes_id;
    const oldQuizId = quizId;
    
    console.log(`Quiz transferred: old ID ${oldQuizId} -> new ID ${newQuizId}`);
    
    // Update all questions that were linked to the pending quiz to point to the new quiz
    const [updateResult] = await pool.query(`
      UPDATE questions 
      SET quizzes_id = ? 
      WHERE quizzes_id = ?
    `, [newQuizId, oldQuizId]);
    
    console.log(`✅ Updated ${updateResult.affectedRows} questions to new quiz ID ${newQuizId}`);
    
    // Also approve and transfer all related pending flashcards (by sub_id)
    const groupSubId = pendingQuiz.sub_id;
    let approvedFlashcards = [];
    if (groupSubId) {
      const groupFlashcards = await getPendingFlashcardsBySubId(pool, groupSubId);
      for (const card of groupFlashcards) {
        const newFlashcard = await transferToFlashcards(pool, card);
        approvedFlashcards.push(newFlashcard);
      }
      // Remove all flashcards from pending table
      await deletePendingFlashcardsBySubId(pool, groupSubId);
    }

    // Delete the pending quiz from pending table
    await deletePendingQuiz(pool, quizId);

    console.log(`✅ Quiz approved and transferred with ID: ${newQuiz.quizzes_id}, removed from pending table`);
    if (approvedFlashcards.length > 0) {
      console.log(`✅ Also approved and transferred ${approvedFlashcards.length} related flashcards for sub_id: ${groupSubId}`);
    }

    res.json({
      success: true,
      message: 'Quiz and related flashcards approved successfully',
      quiz: newQuiz,
      flashcards: approvedFlashcards,
      questionsUpdated: updateResult.affectedRows
    });
  } catch (err) {
    console.error('Error approving quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reject pending quiz
app.put('/api/pending-quizzes/:id/reject', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { rejected_by, comment } = req.body;
    
    // Validate that comment is provided
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection comment is required' 
      });
    }
    
    console.log(`Rejecting pending quiz ID: ${quizId} with comment`);
    
    const pool = await db.getPool();
    
    // Update status to rejected with comment
    const updateSuccess = await updatePendingQuizStatus(pool, quizId, 'rejected', rejected_by, comment);
    
    if (!updateSuccess) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending quiz not found' 
      });
    }
    
    console.log(`✅ Quiz rejected: ${quizId}`);
    
    res.json({
      success: true,
      message: 'Quiz rejected successfully'
    });
  } catch (err) {
    console.error('Error rejecting quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending quizzes by status
app.get('/api/pending-quizzes/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    console.log(`Fetching pending quizzes with status: ${status}`);

    const pool = await db.getPool();
    const quizzes = await getPendingQuizzesByStatus(pool, status);

    console.log(`✅ Found ${quizzes.length} quizzes with status ${status}`);
    
    res.json({
      success: true,
      quizzes: quizzes,
      total: quizzes.length,
      status: status
    });
  } catch (err) {
    console.error('Error fetching pending quizzes by status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending quizzes by user
app.get('/api/pending-quizzes/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log(`Fetching pending quizzes for user: ${userId}`);

    const pool = await db.getPool();
    const quizzes = await getPendingQuizzesByUser(pool, userId);

    console.log(`✅ Found ${quizzes.length} pending quizzes for user ${userId}`);
    
    res.json({
      success: true,
      quizzes: quizzes,
      total: quizzes.length
    });
  } catch (err) {
    console.error('Error fetching pending quizzes by user:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== PENDING FLASHCARDS API ENDPOINTS =====

// Get all pending flashcards
app.get('/api/pending-flashcards', async (req, res) => {
  try {
    console.log('Fetching all pending flashcards');
    const pool = await db.getPool();
    const flashcards = await getAllPendingFlashcards(pool);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length
    });
  } catch (err) {
    console.error('Error fetching pending flashcards:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending flashcard by ID
app.get('/api/pending-flashcards/:id', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    const pool = await db.getPool();
    const flashcard = await getPendingFlashcardById(pool, flashcardId);
    
    if (!flashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending flashcard not found' 
      });
    }
    
    res.json({
      success: true,
      flashcard: flashcard
    });
  } catch (err) {
    console.error('Error fetching pending flashcard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Approve pending flashcard

// Approve all pending flashcards in a group (by sub_id)
app.put('/api/pending-flashcards/:id/approve', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    const { approved_by } = req.body;
    const pool = await db.getPool();

    // Get the pending flashcard details
    const pendingFlashcard = await getPendingFlashcardById(pool, flashcardId);
    if (!pendingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending flashcard not found' 
      });
    }

    // Get all pending flashcards in the same group (by sub_id)
    const groupSubId = pendingFlashcard.sub_id || pendingFlashcard.flashcard_id;
    const groupFlashcards = await getPendingFlashcardsBySubId(pool, groupSubId);
    if (!groupFlashcards || groupFlashcards.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pending flashcards found in this group'
      });
    }

    // Transfer all to flashcards table
    const approvedFlashcards = [];
    for (const card of groupFlashcards) {
      const newFlashcard = await transferToFlashcards(pool, card);
      approvedFlashcards.push(newFlashcard);
    }

    // Delete all from pending table
    await deletePendingFlashcardsBySubId(pool, groupSubId);

    console.log(`✅ Approved and transferred ${approvedFlashcards.length} flashcards for group sub_id: ${groupSubId}, removed from pending table`);

    res.json({
      success: true,
      message: `Approved ${approvedFlashcards.length} flashcards in the group`,
      flashcards: approvedFlashcards
    });
  } catch (err) {
    console.error('Error approving flashcard group:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reject pending flashcard (and entire group)
app.put('/api/pending-flashcards/:id/reject', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    const { rejected_by, comment } = req.body;
    
    // Validate that comment is provided
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection comment is required' 
      });
    }
    
    console.log(`Rejecting pending flashcard ID: ${flashcardId} with comment`);
    
    const pool = await db.getPool();
    
    // Get the pending flashcard details to find the group
    const pendingFlashcard = await getPendingFlashcardById(pool, flashcardId);
    if (!pendingFlashcard) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending flashcard not found' 
      });
    }

    // Get all pending flashcards in the same group (by sub_id)
    const groupSubId = pendingFlashcard.sub_id || pendingFlashcard.flashcard_id;
    const groupFlashcards = await getPendingFlashcardsBySubId(pool, groupSubId);
    if (!groupFlashcards || groupFlashcards.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pending flashcards found in this group'
      });
    }

    // Reject all flashcards in the group with the same comment
    let rejectedCount = 0;
    for (const card of groupFlashcards) {
      const updateSuccess = await updatePendingFlashcardStatus(pool, card.flashcard_id, 'rejected', rejected_by, comment);
      if (updateSuccess) {
        rejectedCount++;
      }
    }
    
    console.log(`✅ Rejected ${rejectedCount} flashcard(s) in group with sub_id: ${groupSubId}`);
    
    res.json({
      success: true,
      message: `Rejected ${rejectedCount} flashcard(s) in the group`,
      rejectedCount: rejectedCount
    });
  } catch (err) {
    console.error('Error rejecting flashcard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending flashcards by status
app.get('/api/pending-flashcards/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    console.log(`Fetching pending flashcards with status: ${status}`);

    const pool = await db.getPool();
    const flashcards = await getPendingFlashcardsByStatus(pool, status);

    console.log(`✅ Found ${flashcards.length} flashcards with status ${status}`);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length,
      status: status
    });
  } catch (err) {
    console.error('Error fetching pending flashcards by status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending flashcards by sub_id (for grouped flashcards)
app.get('/api/pending-flashcards/sub/:subId', async (req, res) => {
  try {
    const subId = parseInt(req.params.subId);
    const pool = await db.getPool();
    const flashcards = await getPendingFlashcardsBySubId(pool, subId);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length
    });
  } catch (err) {
    console.error('Error fetching pending flashcards by sub_id:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending flashcards by user
app.get('/api/pending-flashcards/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log(`Fetching pending flashcards for user: ${userId}`);

    const pool = await db.getPool();
    const flashcards = await getPendingFlashcardsByUser(pool, userId);

    console.log(`✅ Found ${flashcards.length} pending flashcards for user ${userId}`);
    
    res.json({
      success: true,
      flashcards: flashcards,
      total: flashcards.length
    });
  } catch (err) {
    console.error('Error fetching pending flashcards by user:', err);
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

// Create new quiz - goes to pending_quizzes first
app.post('/api/quizzes', async (req, res) => {
  try {
    const { title, subject_id, subject_name, description, created_by, quiz_type, duration, difficulty, item_counts, quiz_view, duration_unit } = req.body;
    
    // Add debugging to see what data is received
    console.log('=== QUIZ CREATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Subject ID:', subject_id);
    console.log('Subject Name:', subject_name);
    console.log('Redirecting to pending_quizzes table');
    console.log('===========================');
    
    if (!title || !subject_id || !created_by) {
      return res.status(400).json({ 
        success: false,
        error: 'Title, subject_id, and created_by are required' 
      });
    }
    
    console.log(`Creating new pending quiz: ${title}`);
    
    const pool = await db.getPool();
    const newQuiz = await createPendingQuiz(pool, {
      title,
      subject_id,
      subject_name,
      description,
      created_by,
      quiz_type,
      duration,
      duration_unit: duration_unit || 'minutes',
      difficulty,
      item_counts,
      program: req.body.program || "",
      quiz_view: quiz_view || "Personal"
    });
    
    console.log(`✅ Pending quiz created successfully: ${title}`);
    
    res.status(201).json({
      success: true,
      message: 'Quiz submitted for approval. It will appear after admin/faculty review.',
      quiz: newQuiz
    });
  } catch (err) {
    console.error('Error creating pending quiz:', err);
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
  const { title, subject_id, description, quiz_type, duration, difficulty, item_counts, program, quiz_view } = req.body;
    
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
      item_counts,
      program: program || "",
      quiz_view: quiz_view || "Personal"
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
    const { quizzes_id, question, choices, answer, explanation, points, question_type } = req.body;
    if (!quizzes_id || !question || !answer || !question_type) {
      return res.status(400).json({ 
        success: false,
        error: 'quizzes_id, question, answer, and question_type are required' 
      });
    }
    console.log(`Creating new question for quiz ID: ${quizzes_id}, type: ${question_type}`);
    const pool = await db.getPool();
    const newQuestion = await createQuestion(pool, {
      quizzes_id,
      question,
      choices,
      answer,
      explanation,
      points,
      question_type
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

// Create new flashcard - goes to pending_flashcards first
app.post('/api/flashcards', async (req, res) => {
  try {
    const { question, answer, subject_id, created_by, sub_id, program, flashcard_view } = req.body;

    if (!question || !answer || !subject_id || !created_by) {
      return res.status(400).json({ 
        success: false,
        error: 'Question, answer, subject_id, and created_by are required' 
      });
    }

    console.log(`Creating new pending flashcard: ${question}, sub_id: ${sub_id}, program: ${program}, view: ${flashcard_view}`);

    const pool = await db.getPool();
    const flashcard = await createPendingFlashcard(pool, {
      question,
      answer,
      subject_id,
      created_by,
      sub_id,
      program,
      flashcard_view: flashcard_view || 'Personal'
    });

    console.log(`✅ Pending flashcard created successfully: ${question}`);

    res.status(201).json({
      success: true,
      flashcard: flashcard,
      message: 'Flashcard submitted for approval. It will appear after admin/faculty review.'
    });
  } catch (err) {
    console.error('Error creating pending flashcard:', err);
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
    const { question, answer, subject_id, program } = req.body;
    
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
    
    console.log(`Updating flashcard ID: ${flashcardId}, program: ${program}`);
    
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
      subject_id,
      program
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

// API endpoint: Get all bookings for debugging (admin only)
app.get('/api/bookings', async (req, res) => {
  try {
    const { tutor_id, status } = req.query;
    
    const pool = await db.getPool();
    let query = 'SELECT * FROM bookings';
    let params = [];
    
    const conditions = [];
    
    if (tutor_id) {
      conditions.push('tutor_id = ?');
      params.push(tutor_id);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY start_date DESC, preferred_time ASC';
    
    const [bookings] = await pool.query(query, params);
    
    res.json({
      success: true,
      bookings: bookings,
      total: bookings.length
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// API endpoint: Get tutor availability
app.get('/api/tutors/:tutorId/availability', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('=== AVAILABILITY REQUEST ===');
    console.log('Tutor ID:', tutorId);
    console.log('Date Range:', startDate, 'to', endDate);
    console.log('Request URL params:', req.query);

    if (!tutorId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: tutorId, startDate, endDate' 
      });
    }

    const pool = await db.getPool();
    
    // Get all existing bookings for the tutor within the date range
    const [existingBookings] = await pool.query(`
      SELECT booking_id, start_date, end_date, preferred_time, status, student_name, created_at
      FROM bookings 
      WHERE tutor_id = ? 
      AND status IN ('pending', 'confirmed', 'accepted')
      AND (
        (DATE(start_date) <= DATE(?) AND DATE(end_date) >= DATE(?)) OR
        (DATE(start_date) >= DATE(?) AND DATE(start_date) <= DATE(?))
      )
      ORDER BY start_date, preferred_time
    `, [tutorId, endDate, startDate, startDate, endDate]);

    console.log('=== EXISTING BOOKINGS FOUND ===');
    console.log('Total bookings:', existingBookings.length);
    existingBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking.booking_id,
        dates: `${booking.start_date} to ${booking.end_date}`,
        time: booking.preferred_time,
        status: booking.status,
        student: booking.student_name,
        rawStartDate: booking.start_date,
        rawEndDate: booking.end_date
      });
    });

    // Define available time slots (9 AM to 5 PM)
    const timeSlots = [
      '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
      '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
    ];

    // Generate available slots for each day in the date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const availableSlots = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = d.toISOString().split('T')[0];
      
      // Skip past dates (before today)
      const today = new Date();
      const currentDateObj = new Date(currentDate);
      if (currentDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        continue;
      }
      
      // Allow all days including weekends - tutors may work on Saturdays and Sundays
      // Removed weekend restriction to allow flexible scheduling
      
      // Check which time slots are available for this date
      const daySlots = timeSlots.filter(slot => {
        // Check if this slot conflicts with any existing booking
        const hasConflict = existingBookings.some(booking => {
          const bookingStartDate = new Date(booking.start_date);
          const bookingEndDate = new Date(booking.end_date);
          const currentDateObj = new Date(currentDate + 'T00:00:00');
          
          // Normalize dates to compare only the date part (ignore time)
          const bookingStartStr = bookingStartDate.toISOString().split('T')[0];
          const bookingEndStr = bookingEndDate.toISOString().split('T')[0];
          const currentDateStr = currentDateObj.toISOString().split('T')[0];
          
          // Check if current date falls within booking date range
          if (currentDateStr >= bookingStartStr && currentDateStr <= bookingEndStr) {
            // Parse preferred_time - handle different formats
            let bookingTimeSlot = '';
            if (booking.preferred_time) {
              // Handle "HH:MM - HH:MM" format
              const timeParts = booking.preferred_time.trim().split(' - ');
              if (timeParts.length === 2) {
                const startTime = timeParts[0].trim();
                const endTime = timeParts[1].trim();
                bookingTimeSlot = `${startTime}-${endTime}`;
              } else {
                // Handle other formats or direct slot format
                bookingTimeSlot = booking.preferred_time.replace(/ - /g, '-').replace(/\s+/g, '');
              }
            }
            
            // Normalize the current slot format for comparison
            const normalizedSlot = slot.replace(/ - /g, '-').replace(/\s+/g, '');
            const normalizedBookingSlot = bookingTimeSlot.replace(/ - /g, '-').replace(/\s+/g, '');
            
            // Check if the time slots match
            const conflict = normalizedSlot === normalizedBookingSlot;
            
            if (conflict) {
              console.log(`🚫 CONFLICT FOUND for ${currentDate} ${slot}:`, {
                bookingId: booking.booking_id,
                bookingTime: booking.preferred_time,
                normalizedBookingSlot: normalizedBookingSlot,
                currentSlot: normalizedSlot,
                status: booking.status,
                dateRange: `${bookingStartStr} to ${bookingEndStr}`
              });
            } else {
              console.log(`✅ No conflict for ${currentDate} ${slot}:`, {
                bookingTime: booking.preferred_time || 'No time',
                normalizedBookingSlot: normalizedBookingSlot,
                currentSlot: normalizedSlot
              });
            }
            
            return conflict;
          }
          return false;
        });

        return !hasConflict;
      });

      availableSlots.push({
        date: currentDate,
        slots: daySlots,
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        totalSlots: timeSlots.length,
        bookedSlots: timeSlots.length - daySlots.length
      });

      console.log(`${currentDate} (${d.toLocaleDateString('en-US', { weekday: 'long' })}):`, {
        available: daySlots.length,
        booked: timeSlots.length - daySlots.length,
        slots: daySlots
      });
    }

    console.log('=== AVAILABILITY RESPONSE ===');
    console.log('Total days processed:', availableSlots.length);
    console.log('Days with available slots:', availableSlots.filter(day => day.slots.length > 0).length);

    res.json({
      success: true,
      availability: availableSlots,
      totalDays: availableSlots.length,
      tutorId: parseInt(tutorId),
      existingBookings: existingBookings.map(booking => ({
        id: booking.booking_id,
        dates: `${booking.start_date} - ${booking.end_date}`,
        time: booking.preferred_time,
        status: booking.status
      }))
    });

  } catch (error) {
    console.error('Error fetching tutor availability:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// API endpoint: Check specific time slot availability
app.post('/api/tutors/:tutorId/check-availability', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { date, timeSlot } = req.body;

    if (!tutorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date, timeSlot'
      });
    }

    const pool = await db.getPool();
    
    // Check if the specific time slot is already booked
    const [conflicts] = await pool.query(`
      SELECT booking_id, start_date, end_date, preferred_time, status
      FROM bookings
      WHERE tutor_id = ?
      AND status IN ('pending', 'confirmed', 'accepted')
      AND ? BETWEEN start_date AND end_date
      AND preferred_time LIKE ?
    `, [tutorId, date, `${timeSlot}%`]);

    const isAvailable = conflicts.length === 0;

    res.json({
      success: true,
      available: isAvailable,
      conflicts: conflicts.length,
      date,
      timeSlot,
      tutorId: parseInt(tutorId)
    });

  } catch (error) {
    console.error('Error checking time slot availability:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// API endpoint: Create a new session booking
// Note: Students can book the same tutor multiple times for different time slots
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
    const pool = await db.getPool();
    let sessions = [];
    if (user_id) {
      // Only show sessions for this user (student or tutor)
      const query = `SELECT * FROM bookings WHERE student_id = ? OR tutor_id = ?`;
      const [result] = await pool.query(query, [user_id, user_id]);
      sessions = result;
      if (sessions.length === 0) {
        console.log(`No sessions found for user_id: ${user_id}`);
      } else {
        console.log(`Found ${sessions.length} sessions for user_id: ${user_id}`);
      }
    } else {
      // No user_id: show all sessions (admin/faculty)
      const [result] = await pool.query(`SELECT * FROM bookings`);
      sessions = result;
      console.log(`Admin/faculty: Found ${sessions.length} total sessions.`);
    }
    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

  // API endpoint: Update booking status (Accept/Decline)
// API endpoint: Update tutor rating for a booking
app.put('/api/sessions/:booking_id/rating', async (req, res) => {
  try {
    const booking_id = parseInt(req.params.booking_id);
    const { rating, remarks } = req.body;
    if (!booking_id || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Missing or invalid booking_id or rating' });
    }
    const pool = await db.getPool();
    // Update booking rating and remarks
    const [result] = await pool.query('UPDATE bookings SET rating = ?, remarks = ? WHERE booking_id = ?', [rating, remarks || null, booking_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Get tutor_id for this booking
    const [[booking]] = await pool.query('SELECT tutor_id FROM bookings WHERE booking_id = ?', [booking_id]);
    if (!booking || !booking.tutor_id) {
      return res.status(404).json({ success: false, error: 'Tutor not found for this booking' });
    }
    const tutor_id = booking.tutor_id;

  // Calculate average rating for this tutor from all completed bookings with a rating
  const [[avgResult]] = await pool.query('SELECT AVG(rating) AS avg_rating FROM bookings WHERE tutor_id = ? AND rating IS NOT NULL AND status = "Completed"', [tutor_id]);
  const avg_rating = avgResult.avg_rating ? parseFloat(avgResult.avg_rating).toFixed(2) : null;

  // Update tutor's ratings column
  await pool.query('UPDATE tutors SET ratings = ? WHERE user_id = ?', [avg_rating, tutor_id]);

    res.json({ success: true, booking_id, rating, remarks, tutor_id, avg_rating });
  } catch (err) {
    console.error('Error updating booking rating and tutor rating:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
  app.put('/api/sessions/:booking_id/status', async (req, res) => {
    try {
      const booking_id = parseInt(req.params.booking_id);
      const { status } = req.body;
      if (!booking_id || !status) {
        return res.status(400).json({ success: false, error: 'Missing booking_id or status' });
      }
      const pool = await db.getPool();
      const [result] = await pool.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [status, booking_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      res.json({ success: true, booking_id, status });
    } catch (err) {
      console.error('Error updating booking status:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

// ===== FORUMS API ENDPOINTS =====

// Get all forums
app.get('/api/forums', async (req, res) => {
  try {
    const pool = await db.getPool();
    const forums = await getAllForums(pool);
    const user_id = req.query.user_id;
    const forumsQueries = require('../queries/forums');
    // Transform to always include user name, subject name, and liked_by_current_user
    const transformed = await Promise.all(forums.map(async forum => {
      let liked_by_current_user = false;
      if (user_id) {
        liked_by_current_user = await forumsQueries.hasUserLiked(pool, forum.forum_id, user_id);
      }
      return {
        ...forum,
        created_by_name: forum.created_by_name || forum.created_by,
        subject_name: forum.subject_name || forum.subject_id,
        liked_by_current_user
      };
    }));
    res.json({ success: true, forums: transformed });
  } catch (err) {
    console.error('Error fetching forums:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get forum by ID
app.get('/api/forums/:id', async (req, res) => {
  try {
    const pool = await db.getPool();
    const forum = await getForumById(pool, req.params.id);
    res.json({ success: true, forum });
  } catch (err) {
    console.error('Error fetching forum:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create a new forum
app.post('/api/forums', async (req, res) => {
  try {
    const pool = await db.getPool();
    const { title, topic, subject_id, created_by } = req.body;
    // Get user name from users table
    let created_by_name = '';
    if (created_by) {
      const [userRows] = await pool.query('SELECT CONCAT(first_name, " ", last_name) AS name FROM users WHERE user_id = ?', [created_by]);
      if (userRows.length > 0) {
        created_by_name = userRows[0].name;
      }
    }
    // Insert forum with user_id and user_name
    const forum_id = await createForum(pool, { title, topic, subject_id, created_by });
    // Optionally update created_by_name in forums table if you have a column for it
    // await pool.query('UPDATE forums SET created_by_name = ? WHERE forum_id = ?', [created_by_name, forum_id]);
    res.json({ success: true, forum_id, created_by_name });
  } catch (err) {
    console.error('Error creating forum:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get comments for a forum
app.get('/api/forums/:id/comments', async (req, res) => {
  try {
    const pool = await db.getPool();
    const comments = await getCommentsByForumId(pool, req.params.id);
    res.json({ success: true, comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add a comment to a forum
app.post('/api/forums/:id/comments', async (req, res) => {
  try {
    const pool = await db.getPool();
    const { user_id, comment } = req.body;
    const comment_id = await addComment(pool, { forum_id: req.params.id, user_id, comment });
    res.json({ success: true, comment_id });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Like/unlike a forum
app.post('/api/forums/:id/like', async (req, res) => {
  try {
    const pool = await db.getPool();
    const { user_id } = req.body;
    const forumsQueries = require('../queries/forums');
    if (!user_id) return res.status(400).json({ success: false, error: 'Missing user_id' });
    const forum_id = req.params.id;
    let liked;
    if (await forumsQueries.hasUserLiked(pool, forum_id, user_id)) {
      await forumsQueries.removeUserLike(pool, forum_id, user_id);
      liked = false;
    } else {
      await forumsQueries.addUserLike(pool, forum_id, user_id);
      liked = true;
    }
    // Get new like_count
    const forum = await forumsQueries.getForumById(pool, forum_id);
    res.json({ success: true, like_count: forum.like_count, liked });
  } catch (err) {
    console.error('Error liking/unliking forum:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

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
