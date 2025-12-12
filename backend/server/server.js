const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

// ...imports only, no app initialization or routes here...

const db = require('../dbconnection/mysql')
const { createUser, findUserByEmail, updateUser, findUserById } = require('../queries/users')
const { generateTemporaryPassword, sendWelcomeEmail, sendTutorApprovalEmail, sendTutorRejectionEmail, sendMaterialApprovalEmail, sendMaterialRejectionEmail, sendPostTestApprovalEmailToTutor, sendPostTestApprovalEmailToStudent, sendPostTestAssignmentEmail, sendPostTestAssignmentEmailToCoTutor, sendFacultyTutorNotificationEmail, sendFacultyNewApplicationNotificationEmail, sendQuizApprovalEmail, sendFlashcardApprovalEmail, sendRatingReminderEmail, testEmailConnection } = require('../services/emailService')
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
  deleteFlashcardProgress,
  getFlashcardSetStatistics
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
  getQuizAverageRating,
  getUserQuizRating,
  upsertQuizRating,
  deleteQuizRating,
  getQuizRatings
} = require('../queries/quizRatings')
const {
  getFlashcardAverageRating,
  getFlashcardSetAverageRating,
  getUserFlashcardRating,
  getUserFlashcardSetRating,
  upsertFlashcardRating,
  rateFlashcardSet,
  deleteFlashcardRating,
  getFlashcardRatings
} = require('../queries/flashcardRatings')
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
  getQuizStatistics, 
  getTopQuizPerformers
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
  getMaterialAverageRating,
  getUserMaterialRating,
  upsertMaterialRating,
  deleteMaterialRating,
  getMaterialRatingsWithComments
} = require('../queries/materialRatings')
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
const { 
  createChatMessage, 
  getChatMessagesByBooking, 
  markMessagesAsRead, 
  getUnreadMessageCount, 
  deleteChatMessage,
  updateChatMessage
} = require('../queries/chatMessages')
const { getAllForums, getForumById, createForum, updateForum, deleteForum } = require('../queries/forums')
const { getCommentsByForumId, addComment } = require('../queries/comments')
const { 
  logProfanityViolation, 
  getUserViolations, 
  getAllViolations, 
  getUserViolationCount, 
  getTopViolators, 
  cleanupOldViolations 
} = require('../queries/profanityViolations')
const {
  getAllPreAssessments,
  getPreAssessmentById,
  createPreAssessment,
  updatePreAssessment,
  deletePreAssessment,
  getPreAssessmentsByProgram,
  getPreAssessmentsByYearLevel
} = require('../queries/preAssessments')
const {
  getQuestionsByPreAssessmentId,
  getPreAssessmentQuestionById,
  createPreAssessmentQuestion,
  updatePreAssessmentQuestion,
  deletePreAssessmentQuestion,
  deleteQuestionsByPreAssessmentId,
  createPreAssessmentQuestions
} = require('../queries/preAssessmentQuestions')

const {
  createPreAssessmentResult,
  getResultsByUserId,
  getResultsByAssessmentId,
  getResultByUserAndAssessment,
  getAllResults,
  deleteResult,
  getAssessmentStatistics
} = require('../queries/preAssessmentResults')
const {
  getAllTutorPreAssessments,
  getTutorPreAssessmentById,
  createTutorPreAssessment,
  updateTutorPreAssessment,
  deleteTutorPreAssessment,
  getTutorPreAssessmentsByProgram,
  getTutorPreAssessmentsByYearLevel,
  getTutorPreAssessmentsBySubject
} = require('../queries/tutorPreAssessments')
const {
  getTutorPreAssessmentQuestions,
  getTutorPreAssessmentQuestionById,
  createTutorPreAssessmentQuestion,
  updateTutorPreAssessmentQuestion,
  deleteTutorPreAssessmentQuestion,
  createTutorPreAssessmentQuestions,
  deleteTutorPreAssessmentQuestions,
  getTutorPreAssessmentQuestionCount,
  updateTutorPreAssessmentQuestionOrder
} = require('../queries/tutorPreAssessmentQuestions')
const {
  createPostTest,
  getAllPostTests,
  getPostTestById,
  updatePostTest,
  deletePostTest,
  publishPostTest
} = require('../queries/postTests')
const {
  createPostTestQuestion,
  createPostTestQuestions,
  getQuestionsByPostTestId,
  getPostTestQuestionById,
  updatePostTestQuestion,
  deletePostTestQuestion,
  deleteQuestionsByPostTestId
} = require('../queries/postTestQuestions')
const {
  createPostTestResult,
  getAllPostTestResults,
  getPostTestResultById,
  getResultByStudentAndPostTest,
  deletePostTestResult,
  getPostTestStatistics
} = require('../queries/postTestResults')
const {
  getAllPendingPostTests,
  getPendingPostTestById,
  createPendingPostTest,
  updatePendingPostTestStatus,
  updatePendingPostTestQuestionCount,
  deletePendingPostTest,
  getPendingPostTestsByStatus,
  getPendingPostTestsBySubject,
  transferToPostTests
} = require('../queries/pendingPostTests')
const {
  createPendingPostTestQuestion,
  createPendingPostTestQuestions,
  getQuestionsByPendingPostTestId,
  getPendingPostTestQuestionById,
  updatePendingPostTestQuestion,
  deletePendingPostTestQuestion,
  deleteQuestionsByPendingPostTestId
} = require('../queries/pendingPostTestQuestions')

const multer = require('multer')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json({ limit: '250mb' })) // Increased limit for file uploads
// Also accept URL-encoded form data (helps some clients/tools)
app.use(express.urlencoded({ extended: true, limit: '250mb' }))

// Add a fallback middleware to parse raw body if needed
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '250mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '250mb' }))

// Ensure middleware is applied globally
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {};
  }
  next();
});

// Configure where pending resources are stored and how they are exposed publicly.
// - `PENDING_RESOURCES_DIR`: absolute filesystem directory where PDFs are saved (optional).
// - `PENDING_RESOURCES_URL`: public base URL where files are served (optional).
// If not provided, files default to `../frontend/public/pending-resources` and are served
// by the backend at `/pending-resources`.
const pendingResourcesDir = process.env.PENDING_RESOURCES_DIR || path.join(__dirname, '../../frontend/public/pending-resources');
const pendingResourcesPublicUrl = process.env.PENDING_RESOURCES_URL || null; // optional absolute URL

// Ensure directory exists and expose it at `/pending-resources` so the backend can serve files
try {
  if (!fs.existsSync(pendingResourcesDir)) {
    fs.mkdirSync(pendingResourcesDir, { recursive: true });
  }
  app.use('/pending-resources', express.static(pendingResourcesDir));
} catch (e) {
  console.warn('Could not create or serve pending-resources directory:', e.message);
}


// Configure learning-resources directory and public exposure (used for approved study materials)
const learningResourcesDir = process.env.LEARNING_RESOURCES_DIR || path.join(__dirname, '../../frontend/public/learning-resources');
const learningResourcesPublicUrl = process.env.LEARNING_RESOURCES_URL || null; // optional absolute URL
try {
  if (!fs.existsSync(learningResourcesDir)) {
    fs.mkdirSync(learningResourcesDir, { recursive: true });
  }
  app.use('/learning-resources', express.static(learningResourcesDir));
} catch (e) {
  console.warn('Could not create or serve learning-resources directory:', e.message);
}

// Configure class-cards directory and public exposure (used for tutor class card uploads)
const classCardsDir = process.env.CLASS_CARDS_DIR || path.join(__dirname, '../../frontend/public/class-cards');
const classCardsPublicUrl = process.env.CLASS_CARDS_PUBLIC_URL || null; // optional absolute URL
try {
  if (!fs.existsSync(classCardsDir)) {
    fs.mkdirSync(classCardsDir, { recursive: true });
  }
  app.use('/class-cards', express.static(classCardsDir));
} catch (e) {
  console.warn('Could not create or serve class-cards directory:', e.message);
}

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

    // Check user role authorization - only admins can create users
    const currentUserRole = req.headers['x-user-role'];
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      console.log('Unauthorized access attempt to /api/admin/create-user. Role:', currentUserRole);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

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

// Public stats endpoint for dashboard (no auth required)
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    console.log('Fetching dashboard statistics');
    
    const pool = await db.getPool();

    // Get active users count
    const [activeUsersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE status = 'Active'"
    );

    // Get total forum posts count
    const [forumPostsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM forums'
    );

    // Get recommended tutors count (ratings >= 4)
    const [tutorsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM tutors WHERE status = "Approved" AND ratings >= 4'
    );

    // Get learning materials count
    const [materialsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM studymaterials'
    );

    console.log('📊 Dashboard Stats:', {
      activeUsers: activeUsersResult[0].count,
      forumPosts: forumPostsResult[0].count,
      recommendedTutors: tutorsResult[0].count,
      learningMaterials: materialsResult[0].count
    });
    // If a user_id is provided, include booking counts for that user
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
    let bookingCounts = null;
    if (userId && !isNaN(userId)) {
      try {
        const [rows] = await pool.query(
          `SELECT
            COUNT(CASE WHEN LOWER(status) IN ('accepted','active') THEN 1 END) AS ongoing,
            COUNT(CASE WHEN LOWER(status) = 'completed' THEN 1 END) AS completed,
            COUNT(CASE WHEN LOWER(status) = 'declined' THEN 1 END) AS declined
          FROM bookings
          WHERE student_id = ? OR tutor_id = ?`,
          [userId, userId]
        );
        bookingCounts = (rows && rows[0]) ? rows[0] : { ongoing: 0, completed: 0, declined: 0 };
      } catch (err) {
        console.error('Error fetching booking counts for user:', userId, err);
        bookingCounts = { ongoing: 0, completed: 0, declined: 0 };
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        activeUsers: activeUsersResult[0].count || 0,
        forumPosts: forumPostsResult[0].count || 0,
        recommendedTutors: tutorsResult[0].count || 0,
        learningMaterials: materialsResult[0].count || 0,
        bookingCounts: bookingCounts
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add the /api/users endpoint to fetch all users for admin management
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching all users for admin management');

    // Check user role authorization - only admins can access this endpoint
    const currentUserRole = req.headers['x-user-role'];
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      console.log('Unauthorized access attempt to /api/users. Role:', currentUserRole);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

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

    // Check user role authorization - only admins can edit users
    const currentUserRole = req.headers['x-user-role'];
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      console.log('Unauthorized access attempt to /api/admin/edit-user. Role:', currentUserRole);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }
    
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

// Forgot Password - Request reset token
app.post('/api/forgot-password', async (req, res) => {
  try {
    console.log('Forgot password request for:', req.body.email);

    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      // For security, don't reveal if email doesn't exist
      return res.status(200).json({ 
        message: 'If this email exists, you will receive a password reset link shortly.' 
      });
    }

    const user = users[0];

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [resetToken, resetTokenExpires, email]
    );

    // Send email with reset link
    const nodemailer = require('nodemailer');
    
    // Create transporter using existing email config
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Reset Your CICT Peer Learning Hub Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.first_name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              You requested to reset your password for your CICT Peer Learning Hub account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in <strong>1 hour</strong> for security reasons.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this password reset, you can safely ignore this email. 
              Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              © ${new Date().getFullYear()} CICT Peer Learning Hub. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Password reset email sent to: ${email}`);
    
    res.status(200).json({ 
      message: 'If this email exists, you will receive a password reset link shortly.' 
    });
  } catch (err) {
    console.error('Forgot password error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate reset token
app.post('/api/validate-reset-token', async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    const pool = await db.getPool();
    
    // Find user with valid reset token
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token',
        valid: false 
      });
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    console.error('Token validation error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with token
app.post('/api/reset-password-with-token', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email, and new password are required' });
    }

    const pool = await db.getPool();
    
    // Find user with valid reset token
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?',
      [hashedNewPassword, email]
    );

    console.log(`✅ Password reset with token successful for: ${email}`);
    
    res.status(200).json({ 
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Password reset with token error', err);
    res.status(500).json({ error: 'Internal server error' });
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
    console.log('🚨🚨🚨 UPDATED TUTOR APPLICATIONS ENDPOINT HIT 🚨🚨🚨');
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

    // Compose public base for class-cards (priority: CLASS_CARDS_PUBLIC_URL -> backend host -> FRONTEND_URL)
    const classCardsPublicBase = classCardsPublicUrl
      || `${req.protocol}://${req.get('host')}/class-cards`
      || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/class-cards` : '/class-cards');

    // Transform the data to match frontend expectations
    const transformedApplications = [];
    for (const app of filteredApplications) {
      // Normalize class card URL
      let classCardUrl = null;
      try {
        if (app.class_card_image_url) {
          if (app.class_card_image_url.startsWith('http')) {
            classCardUrl = app.class_card_image_url;
          } else if (app.class_card_image_url.startsWith('/')) {
            // If stored as '/class-cards/filename' or similar
            classCardUrl = `${classCardsPublicBase.replace(/\/$/, '')}${app.class_card_image_url}`;
          } else {
            // If stored as just filename or 'class-cards/filename'
            const cleaned = app.class_card_image_url.replace(/^\/*/, '');
            classCardUrl = `${classCardsPublicBase.replace(/\/$/, '')}/${cleaned}`;
          }
        }
      } catch (e) {
        console.warn('Failed to normalize class card URL for app', app.application_id, e && e.message);
      }

      transformedApplications.push({
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
        year_level: app.year_level || '',
        specialties: app.specialties || '',
        class_card_image_url: classCardUrl || null,
        // Include assessment fields
        assessment_result_id: app.assessment_result_id,
        assessment_score: app.assessment_score,
        assessment_percentage: app.assessment_percentage,
        assessment_passed: app.assessment_passed
      });
    }

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

    // Compose public base for class-cards for single application
    const classCardsPublicBaseSingle = classCardsPublicUrl
      || `${req.protocol}://${req.get('host')}/class-cards`
      || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/class-cards` : '/class-cards');

    // Normalize stored class card URL for single application
    let classCardUrlSingle = null;
    try {
      if (application.class_card_image_url) {
        if (application.class_card_image_url.startsWith('http')) {
          classCardUrlSingle = application.class_card_image_url;
        } else if (application.class_card_image_url.startsWith('/')) {
          classCardUrlSingle = `${classCardsPublicBaseSingle.replace(/\/$/, '')}${application.class_card_image_url}`;
        } else {
          const cleanedSingle = application.class_card_image_url.replace(/^\/*/, '');
          classCardUrlSingle = `${classCardsPublicBaseSingle.replace(/\/$/, '')}/${cleanedSingle}`;
        }
      }
    } catch (e) {
      console.warn('Failed to normalize class card URL for application', application.application_id, e && e.message);
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
      year_level: application.year_level || '',
      specialties: application.specialties || '',
      class_card_image_url: classCardUrlSingle || null,
      // Include assessment fields
      assessment_result_id: application.assessment_result_id,
      assessment_score: application.assessment_score,
      assessment_percentage: application.assessment_percentage,
      assessment_passed: application.assessment_passed
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
      year_level,
      specialties,
      class_card_image_url,
      assessment_result_id,
      assessment_score,
      assessment_percentage,
      assessment_passed
    } = req.body;

    // Validate required fields
    if (!user_id || !name || !subject_id || !subject_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, name, subject_id, and subject_name are required' 
      });
    }

    // Get a database connection
    const pool = await db.getPool();

    // Check if user already has a pending application
    console.log(`🔍 Checking for existing pending applications for user ${user_id}...`);
    const existingApplications = await getTutorApplicationsByStatus(pool, 'pending');
    const userPendingApplication = existingApplications.find(app => app.user_id === user_id);
    
    if (userPendingApplication) {
      console.log(`⚠️ User ${user_id} already has a pending application (ID: ${userPendingApplication.application_id})`);
      return res.status(409).json({ 
        error: 'You already have a pending tutor application. Please wait for it to be reviewed before submitting a new one.',
        existingApplication: {
          application_id: userPendingApplication.application_id,
          subject_name: userPendingApplication.subject_name,
          application_date: userPendingApplication.application_date,
          status: userPendingApplication.status
        }
      });
    }


    // Create the application
    const result = await createTutorApplication(pool, {
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
    });

    console.log(`✅ Tutor application created with ID: ${result.insertId}`);

    // Send notification email to assigned faculty
    try {
      console.log(`🔔 Sending new application notification to faculty for subject ${subject_id}...`);
      if (subject && subject.user_id) {
        let facultyIds = [];
        try {
          facultyIds = JSON.parse(subject.user_id);
          if (!Array.isArray(facultyIds)) {
            facultyIds = [facultyIds];
          }
        } catch {
          facultyIds = [subject.user_id];
        }
        for (const facultyId of facultyIds) {
          const faculty = await findUserById(pool, facultyId);
          if (faculty && faculty.role === 'Faculty') {
            const facultyEmailResult = await sendFacultyNewApplicationNotificationEmail(
              faculty.email,
              `${faculty.first_name} ${faculty.last_name}`,
              name,
              subject.subject_name,
              subject.subject_code
            );
            if (facultyEmailResult.success) {
              console.log(`✅ Faculty new application notification sent successfully to ${faculty.email}`);
            } else {
              console.log(`❌ Failed to send faculty notification to ${faculty.email}: ${facultyEmailResult.error}`);
            }
          }
        }
      } else {
        console.log(`⚠️ No faculty assigned to subject ${subject_name}`);
      }
    } catch (facultyEmailError) {
      console.log(`⚠️ Error sending faculty notification email: ${facultyEmailError.message}`);
    }

    res.status(201).json({ 
      success: true,
      message: 'Tutor application submitted successfully. Faculty have been notified for review.',
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
           validated_by = ?, tutor_information = ?, program = ?, year_level = ?, specialties = ?
           WHERE user_id = ? AND subject_id = ?`,
          [
            application.name,
            application.subject_name,
            application.application_date,
            'approved',
            validatedby || '1',
            application.tutor_information,
            application.program,
            application.year_level,
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
          year_level: application.year_level,
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

        // Send notification email to assigned faculty
        try {
          console.log(`Sending faculty notification email for subject ${subject.subject_id}...`);
          
          if (subject.user_id) {
            // Handle both single faculty ID and JSON array of faculty IDs
            let facultyIds = [];
            try {
              // Try to parse as JSON array first
              facultyIds = JSON.parse(subject.user_id);
              if (!Array.isArray(facultyIds)) {
                facultyIds = [facultyIds];
              }
            } catch {
              // If parsing fails, treat as single ID
              facultyIds = [subject.user_id];
            }

            // Send notification to each assigned faculty
            for (const facultyId of facultyIds) {
              const faculty = await findUserById(pool, facultyId);
              if (faculty && faculty.role === 'Faculty') {
                const facultyEmailResult = await sendFacultyTutorNotificationEmail(
                  faculty.email,
                  `${faculty.first_name} ${faculty.last_name}`,
                  `${user.first_name} ${user.last_name}`,
                  subject.subject_name,
                  subject.subject_code
                );
                
                if (facultyEmailResult.success) {
                  console.log(`✅ Faculty notification sent successfully to ${faculty.email}`);
                } else {
                  console.log(`⚠️ Failed to send faculty notification to ${faculty.email}: ${facultyEmailResult.error}`);
                }
              } else {
                console.log(`⚠️ Faculty with ID ${facultyId} not found or not a faculty member`);
              }
            }
          } else {
            console.log(`⚠️ No faculty assigned to subject ${subject.subject_name}`);
          }
        } catch (facultyEmailError) {
          console.log(`⚠️ Error sending faculty notification email: ${facultyEmailError.message}`);
          // Don't fail the approval if faculty email fails
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
      message: 'Tutor application approved successfully. User role updated to Tutor, approval email sent, and faculty notified.'
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
    
    // Use default comment if none provided
    const finalComment = comment && comment.trim() ? comment.trim() : 'No reason provided';
    
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
    const result = await updateTutorApplicationStatus(pool, applicationId, 'rejected', validatedby || '1', finalComment);

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
      year_level: tutor.year_level || '',
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
      year_level: tutor.year_level || '',
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

// Get distinct programs from subjects
app.get('/api/programs', async (req, res) => {
  try {
    console.log('Fetching distinct programs from subjects');
    
    const pool = await db.getPool();
    const [rows] = await pool.query(`
      SELECT DISTINCT program 
      FROM subjects 
      WHERE program IS NOT NULL AND program != '' 
      ORDER BY program ASC
    `);
    
    const programs = [];
    const uniquePrograms = new Set();
    
    rows.forEach(row => {
      let program = row.program;
      console.log(`Processing program: "${program}", type: ${typeof program}`);
      
      // Handle case where program might be stored as JSON array
      try {
        if (typeof program === 'string' && program.startsWith('[')) {
          console.log(`Attempting to parse JSON: ${program}`);
          const parsed = JSON.parse(program);
          console.log(`Parsed result:`, parsed, `isArray: ${Array.isArray(parsed)}`);
          
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              console.log(`Processing array item: "${p}"`);
              if (p && typeof p === 'string' && !uniquePrograms.has(p)) {
                console.log(`Adding unique program: "${p}"`);
                uniquePrograms.add(p);
                programs.push(p);
              }
            });
          } else {
            if (!uniquePrograms.has(program)) {
              uniquePrograms.add(program);
              programs.push(program);
            }
          }
        } else {
          if (!uniquePrograms.has(program)) {
            uniquePrograms.add(program);
            programs.push(program);
          }
        }
      } catch (e) {
        console.log(`JSON parse error: ${e.message}`);
        // If parsing fails, treat as regular string
        if (!uniquePrograms.has(program)) {
          uniquePrograms.add(program);
          programs.push(program);
        }
      }
    });
    
    // Sort programs alphabetically
    programs.sort();
    
    console.log(`✅ Found ${programs.length} distinct programs`);
    
    res.json({
      success: true,
      programs: programs,
      total: programs.length
    });
  } catch (err) {
    console.error('Error fetching programs:', err);
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
    // Use configured pending resources directory when available
    const uploadPath = pendingResourcesDir || path.join(__dirname, '../../frontend/public/pending-resources');

    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not ensure upload directory exists:', e.message);
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
    fileSize: 200 * 1024 * 1024 // 200MB limit - higher limit since materials are reviewed by faculty
  }
});

// Configure multer for image uploads (class cards, etc.)
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../frontend/public/class-cards');
    
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

// File filter to only allow image files
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload image endpoint
app.post('/api/upload', imageUpload.single('file'), async (req, res) => {
  try {
    console.log('Image upload request:', {
      file: req.file,
      type: req.body.type,
      user_id: req.body.user_id
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Compose public-accessible file URL for the uploaded class card.
    // Priority: CLASS_CARDS_PUBLIC_URL -> backend host (/class-cards) -> FRONTEND_URL
    const publicBase = classCardsPublicUrl
      || `${req.protocol}://${req.get('host')}/class-cards`
      || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/class-cards` : '/class-cards');

    const fileUrl = `${publicBase.replace(/\/$/, '')}/${req.file.filename}`;

    console.log(`✅ Image uploaded successfully: ${fileUrl}`);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      file_url: fileUrl,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get all study materials
app.get('/api/study-materials', async (req, res) => {
  try {
    console.log('Fetching all study materials');
    
    const pool = await db.getPool();
    const materials = await getAllStudyMaterials(pool);
    
    console.log(`✅ Found ${materials.length} study materials`);
    // Build absolute file URLs
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const materialsWithUrls = materials.map(m => ({
      ...m,
      file_path: m.file_path && (m.file_path.startsWith('http') ? m.file_path : `${baseUrl}${m.file_path}`)
    }));

    res.json({
      success: true,
      materials: materialsWithUrls,
      total: materialsWithUrls.length
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
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const materialWithUrl = {
      ...material,
      file_path: material.file_path && (material.file_path.startsWith('http') ? material.file_path : `${baseUrl}${material.file_path}`)
    };
    
    res.json({
      success: true,
      material: materialWithUrl
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

    // Compose public-accessible file path/URL for the uploaded file.
    // Priority: PENDING_RESOURCES_URL -> backend host (/pending-resources) -> FRONTEND_URL
    const publicBase = pendingResourcesPublicUrl
      || `${req.protocol}://${req.get('host')}/pending-resources`
      || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/pending-resources` : '/pending-resources');
    const filePathForDb = `${publicBase.replace(/\/$/, '')}/${req.file.filename}`;

    // Create the pending material for review
    const result = await createPendingMaterial(pool, {
      title,
      description,
      subject: subject || 'General',
      file_path: filePathForDb,
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

    // Return the serve endpoint URL (same-origin) so frontend can open/anchor it.
    // This avoids relying on FRONTEND_URL and ensures the file is served by the API.
    const apiBase = `${req.protocol}://${req.get('host')}`;
    const serveUrl = `${apiBase}/api/study-materials/${materialId}/serve?download=1`;

    res.json({
      success: true,
      file_path: serveUrl,
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

    // Build absolute URL for preview and return for frontend
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = material.file_path && (material.file_path.startsWith('http') ? material.file_path : `${baseUrl}${material.file_path}`);

    res.json({
      success: true,
      file_path: fileUrl,
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

// Serve/stream the study material file directly (for preview in new tab)
app.get('/api/study-materials/:id/serve', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Serving study material file ${materialId}`);

    const pool = await db.getPool();
    const material = await getStudyMaterialById(pool, materialId);

    if (!material || !material.file_path) {
      return res.status(404).json({ success: false, error: 'Study material not found' });
    }

    // Resolve filesystem path for the file. Support both pending-resources
    // and learning-resources stored values and absolute URLs.
    let relPath = material.file_path;
    try {
      if (relPath && relPath.startsWith('http')) {
        const parsed = new URL(relPath);
        relPath = parsed.pathname;
      }
    } catch (e) {
      // ignore URL parsing errors
    }

    let filePath;
    if (relPath && relPath.startsWith('/pending-resources/')) {
      // stored path under pending-resources
      const cleanRelPath = relPath.replace(/^\/pending-resources\//, '');
      filePath = path.join(pendingResourcesDir, cleanRelPath);
    } else if (relPath && relPath.startsWith('/learning-resources/')) {
      // stored path under learning-resources
      const cleanRelPath = relPath.replace(/^\/learning-resources\//, '');
      filePath = path.join(learningResourcesDir, cleanRelPath);
    } else {
      // Fallback: try to resolve by basename in pendingResourcesDir first,
      // then in learning-resources directory.
      const filename = path.basename(relPath || '');
      const candidatePending = path.join(pendingResourcesDir, filename);
      const candidateLearning = path.join(learningResourcesDir, filename);
      if (fs.existsSync(candidatePending)) filePath = candidatePending;
      else filePath = candidateLearning;
    }

    if (!fs.existsSync(filePath)) {
      console.error('File not found on server:', filePath);
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Increment view count
    try {
      await incrementViewCount(pool, materialId);
    } catch (incErr) {
      console.warn('Failed to increment view count:', incErr.message);
    }

    // Stream the file. If download query param is present, set attachment header.
    res.setHeader('Content-Type', 'application/pdf');
    if (String(req.query.download || '').toLowerCase() === '1') {
      try {
        const filename = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } catch (e) {
        // ignore header errors
      }
    }
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving study material file:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// --- Debug endpoints for pending-resources (only enabled when ENABLE_DEBUG_ENDPOINTS=true) ---
const debugEnabled = String(process.env.ENABLE_DEBUG_ENDPOINTS || '').toLowerCase() === 'true';

app.get('/debug/pending-resources-files', async (req, res) => {
  if (!debugEnabled) return res.status(404).json({ error: 'Not found' });
  try {
    const files = fs.existsSync(pendingResourcesDir) ? fs.readdirSync(pendingResourcesDir) : [];
    return res.json({ success: true, dir: pendingResourcesDir, count: files.length, files });
  } catch (err) {
    console.error('Debug list error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /debug/pending-resources/migrate
// Copies files from the repo frontend/public/pending-resources to the configured pendingResourcesDir.
// Body (optional): { force: boolean }
app.post('/debug/pending-resources/migrate', async (req, res) => {
  if (!debugEnabled) return res.status(404).json({ error: 'Not found' });
  try {
    const repoPath = path.join(__dirname, '../../frontend/public/pending-resources');
    if (!fs.existsSync(repoPath)) {
      return res.status(404).json({ success: false, error: 'Source repo pending-resources folder not found', repoPath });
    }
    if (!fs.existsSync(pendingResourcesDir)) {
      fs.mkdirSync(pendingResourcesDir, { recursive: true });
    }
    const files = fs.readdirSync(repoPath);
    let copied = 0;
    for (const f of files) {
      const src = path.join(repoPath, f);
      const dest = path.join(pendingResourcesDir, f);
      if (!fs.existsSync(dest) || req.body.force) {
        fs.copyFileSync(src, dest);
        copied++;
      }
    }
    return res.json({ success: true, copied, targetDir: pendingResourcesDir });
  } catch (err) {
    console.error('Debug migrate error:', err);
    return res.status(500).json({ success: false, error: err.message });
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

// ===== PRE-ASSESSMENTS API ENDPOINTS =====

// Get all pre-assessments
app.get('/api/pre-assessments', async (req, res) => {
  try {
    console.log('Fetching all pre-assessments');
    
    const pool = await db.getPool();
    const preAssessments = await getAllPreAssessments(pool);
    
    console.log(`✅ Found ${preAssessments.length} pre-assessments`);
    
    res.json({
      success: true,
      preAssessments: preAssessments,
      total: preAssessments.length
    });
  } catch (err) {
    console.error('Error fetching pre-assessments:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pre-assessment by ID
app.get('/api/pre-assessments/:id', async (req, res) => {
  try {
    const preAssessmentId = parseInt(req.params.id);
    
    if (!preAssessmentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid pre-assessment ID is required' 
      });
    }
    
    console.log(`Fetching pre-assessment ID: ${preAssessmentId}`);
    
    const pool = await db.getPool();
    const preAssessment = await getPreAssessmentById(pool, preAssessmentId);
    
    if (!preAssessment) {
      return res.status(404).json({ 
        success: false,
        error: 'Pre-assessment not found' 
      });
    }
    
    res.json({
      success: true,
      preAssessment: preAssessment
    });
  } catch (err) {
    console.error('Error fetching pre-assessment:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new pre-assessment
app.post('/api/pre-assessments', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty 
    } = req.body;
    
    console.log('📝 Creating pre-assessment request body:', JSON.stringify(req.body, null, 2));
    
    // Validation
    if (!title || !description || !created_by) {
      const error = 'Title, description, and creator are required';
      console.error('❌ Validation error:', error);
      return res.status(400).json({ 
        success: false,
        error 
      });
    }
    
    console.log(`📝 Creating new pre-assessment: ${title}`);
    
    const pool = await db.getPool();
    const newPreAssessment = await createPreAssessment(pool, {
      title,
      description,
      created_by,
      program: program || '',
      year_level: year_level || '',
      duration: duration || 30,
      duration_unit: duration_unit || 'minutes',
      difficulty: difficulty || 'Medium'
    });
    
    console.log(`✅ Pre-assessment created successfully with ID: ${newPreAssessment.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Pre-assessment created successfully',
      preAssessment: newPreAssessment
    });
  } catch (err) {
    console.error('❌ Error creating pre-assessment:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Check for specific database errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        success: false,
        error: 'Pre-assessment tables do not exist. Please run the database setup script first.',
        details: err.message
      });
    }
    
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        success: false,
        error: 'Database column mismatch. Please update your database schema.',
        details: err.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Please contact support'
    });
  }
});

// Update pre-assessment
app.put('/api/pre-assessments/:id', async (req, res) => {
  try {
    const preAssessmentId = parseInt(req.params.id);
    const { 
      title, 
      description, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty 
    } = req.body;
    
    console.log('📝 Updating pre-assessment request body:', req.body);
    
    if (!preAssessmentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid pre-assessment ID is required' 
      });
    }
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        success: false,
        error: 'Title and description are required' 
      });
    }
    
    console.log(`Updating pre-assessment ID: ${preAssessmentId}`);
    
    const pool = await db.getPool();
    
    // Check if pre-assessment exists
    const existingPreAssessment = await getPreAssessmentById(pool, preAssessmentId);
    if (!existingPreAssessment) {
      return res.status(404).json({ 
        success: false,
        error: 'Pre-assessment not found' 
      });
    }
    
    const updatedPreAssessment = await updatePreAssessment(pool, preAssessmentId, {
      title,
      description,
      program: program || '',
      year_level: year_level || '',
      duration: duration || 30,
      duration_unit: duration_unit || 'minutes',
      difficulty: difficulty || 'Medium'
    });
    
    console.log(`✅ Pre-assessment updated successfully: ${title}`);
    
    res.json({
      success: true,
      message: 'Pre-assessment updated successfully',
      preAssessment: updatedPreAssessment
    });
  } catch (err) {
    console.error('❌ Error updating pre-assessment:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Check for specific database errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        success: false,
        error: 'Pre-assessment tables do not exist. Please run the database setup script first.',
        details: err.message
      });
    }
    
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        success: false,
        error: 'Database column mismatch. Please update your database schema.',
        details: err.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Please contact support'
    });
  }
});

// Delete pre-assessment
app.delete('/api/pre-assessments/:id', async (req, res) => {
  try {
    const preAssessmentId = parseInt(req.params.id);
    
    if (!preAssessmentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid pre-assessment ID is required' 
      });
    }
    
    console.log(`Deleting pre-assessment ID: ${preAssessmentId}`);
    
    const pool = await db.getPool();
    
    // Check if pre-assessment exists
    const existingPreAssessment = await getPreAssessmentById(pool, preAssessmentId);
    if (!existingPreAssessment) {
      return res.status(404).json({ 
        success: false,
        error: 'Pre-assessment not found' 
      });
    }
    
    await deletePreAssessment(pool, preAssessmentId);
    
    console.log(`✅ Pre-assessment deleted successfully: ${preAssessmentId}`);
    
    res.json({
      success: true,
      message: 'Pre-assessment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting pre-assessment:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pre-assessments by program
app.get('/api/pre-assessments/program/:program', async (req, res) => {
  try {
    const program = req.params.program;
    
    console.log(`Fetching pre-assessments for program: ${program}`);
    
    const pool = await db.getPool();
    const preAssessments = await getPreAssessmentsByProgram(pool, program);
    
    console.log(`✅ Found ${preAssessments.length} pre-assessments for program ${program}`);
    
    res.json({
      success: true,
      preAssessments: preAssessments,
      total: preAssessments.length
    });
  } catch (err) {
    console.error('Error fetching pre-assessments by program:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pre-assessments by year level
app.get('/api/pre-assessments/year-level/:yearLevel', async (req, res) => {
  try {
    const yearLevel = req.params.yearLevel;
    
    console.log(`Fetching pre-assessments for year level: ${yearLevel}`);
    
    const pool = await db.getPool();
    const preAssessments = await getPreAssessmentsByYearLevel(pool, yearLevel);
    
    console.log(`✅ Found ${preAssessments.length} pre-assessments for year level ${yearLevel}`);
    
    res.json({
      success: true,
      preAssessments: preAssessments,
      total: preAssessments.length
    });
  } catch (err) {
    console.error('Error fetching pre-assessments by year level:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pre-assessments by program and year level
app.get('/api/pre-assessments/program/:program/year/:yearLevel', async (req, res) => {
  try {
    const { program, yearLevel } = req.params;
    
    console.log(`Fetching pre-assessments for program: ${program} and year level: ${yearLevel}`);
    
    const pool = await db.getPool();
    const [preAssessments] = await pool.query(`
      SELECT 
        pa.id,
        pa.title,
        pa.description,
        pa.created_by,
        pa.program,
        pa.year_level,
        pa.duration,
        pa.duration_unit,
        pa.difficulty,
        pa.status,
        pa.created_at,
        pa.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(DISTINCT q.id) as question_count
      FROM pre_assessments pa
      LEFT JOIN users u ON pa.created_by = u.user_id
      LEFT JOIN pre_assessment_questions q ON pa.id = q.pre_assessment_id
      WHERE pa.program = ? AND pa.year_level = ? AND pa.status = 'active'
      GROUP BY pa.id, pa.title, pa.description, pa.created_by, 
               pa.program, pa.year_level, pa.duration, pa.duration_unit, 
               pa.difficulty, pa.status, pa.created_at, pa.updated_at,
               u.first_name, u.last_name
      ORDER BY pa.created_at DESC
    `, [program, yearLevel]);
    
    console.log(`✅ Found ${preAssessments.length} pre-assessments for program ${program} and year level ${yearLevel}`);
    
    res.json({
      success: true,
      preAssessments: preAssessments || []
    });
  } catch (err) {
    console.error('Error fetching pre-assessments by program and year level:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== PRE-ASSESSMENT QUESTIONS API ENDPOINTS =====

// Get questions for a pre-assessment
app.get('/api/pre-assessment-questions/pre-assessment/:preAssessmentId', async (req, res) => {
  try {
    const preAssessmentId = parseInt(req.params.preAssessmentId);
    
    if (!preAssessmentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid pre-assessment ID is required' 
      });
    }
    
    console.log(`Fetching questions for pre-assessment ID: ${preAssessmentId}`);
    
    const pool = await db.getPool();
    const questions = await getQuestionsByPreAssessmentId(pool, preAssessmentId);
    
    console.log(`✅ Found ${questions.length} questions`);
    
    res.json({
      success: true,
      questions: questions,
      total: questions.length
    });
  } catch (err) {
    console.error('Error fetching questions by pre-assessment ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get question by ID
app.get('/api/pre-assessment-questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid question ID is required' 
      });
    }
    
    console.log(`Fetching pre-assessment question ID: ${questionId}`);
    
    const pool = await db.getPool();
    const question = await getPreAssessmentQuestionById(pool, questionId);
    
    if (!question) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }
    
    res.json({
      success: true,
      question: question
    });
  } catch (err) {
    console.error('Error fetching pre-assessment question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new question
app.post('/api/pre-assessment-questions', async (req, res) => {
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
    } = req.body;
    
    console.log('📝 Creating pre-assessment question request body:', JSON.stringify(req.body, null, 2));
    
    // Validation
    if (!pre_assessment_id || !question_type || !question || !correct_answer) {
      return res.status(400).json({ 
        success: false,
        error: 'Pre-assessment ID, question type, question text, and correct answer are required' 
      });
    }
    
    console.log(`Creating question for pre-assessment ID: ${pre_assessment_id}, subject ID: ${subject_id}`);
    
    const pool = await db.getPool();
    const newQuestion = await createPreAssessmentQuestion(pool, {
      pre_assessment_id,
      question_type,
      question,
      options: options || null,
      correct_answer,
      explanation: explanation || '',
      points: points || 1,
      subject_id
    });
    
    console.log(`✅ Question created successfully with ID: ${newQuestion.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: newQuestion
    });
  } catch (err) {
    console.error('Error creating pre-assessment question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update question
app.put('/api/pre-assessment-questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { 
      question_type, 
      question, 
      options, 
      correct_answer, 
      explanation, 
      points,
      subject_id 
    } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid question ID is required' 
      });
    }
    
    // Validation
    if (!question_type || !question || !correct_answer) {
      return res.status(400).json({ 
        success: false,
        error: 'Question type, question text, and correct answer are required' 
      });
    }
    
    console.log(`Updating pre-assessment question ID: ${questionId}`);
    
    const pool = await db.getPool();
    
    // Check if question exists
    const existingQuestion = await getPreAssessmentQuestionById(pool, questionId);
    if (!existingQuestion) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }
    
    const updatedQuestion = await updatePreAssessmentQuestion(pool, questionId, {
      question_type,
      question,
      options: options || null,
      correct_answer,
      explanation: explanation || '',
      points: points || 1,
      subject_id
    });
    
    console.log(`✅ Question updated successfully: ${questionId}`);
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (err) {
    console.error('Error updating pre-assessment question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete question
app.delete('/api/pre-assessment-questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid question ID is required' 
      });
    }
    
    console.log(`Deleting pre-assessment question ID: ${questionId}`);
    
    const pool = await db.getPool();
    
    // Check if question exists
    const existingQuestion = await getPreAssessmentQuestionById(pool, questionId);
    if (!existingQuestion) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }
    
    await deletePreAssessmentQuestion(pool, questionId);
    
    console.log(`✅ Question deleted successfully: ${questionId}`);
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting pre-assessment question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Bulk create questions for pre-assessment
app.post('/api/pre-assessment-questions/bulk', async (req, res) => {
  try {
    const { pre_assessment_id, questions } = req.body;
    
    if (!pre_assessment_id || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        success: false,
        error: 'Pre-assessment ID and questions array are required' 
      });
    }
    
    console.log(`Creating ${questions.length} questions for pre-assessment ID: ${pre_assessment_id}`);
    
    const pool = await db.getPool();
    const result = await createPreAssessmentQuestions(pool, pre_assessment_id, questions);
    
    console.log(`✅ Created ${result.insertedCount} questions`);
    
    res.status(201).json({
      success: true,
      message: `${result.insertedCount} questions created successfully`,
      insertedCount: result.insertedCount
    });
  } catch (err) {
    console.error('Error creating pre-assessment questions in bulk:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ===== PRE-ASSESSMENT RESULTS API ENDPOINTS =====

// Submit pre-assessment result
app.post('/api/pre-assessment-results', async (req, res) => {
  try {
    const { 
      user_id, 
      pre_assessment_id, 
      score, 
      total_points, 
      correct_answers, 
      total_questions, 
      time_taken_seconds,
      started_at,
      answers 
    } = req.body;

    if (!user_id || !pre_assessment_id || score === undefined || total_points === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, pre_assessment_id, score, total_points'
      });
    }

    const percentage = total_points > 0 ? (score / total_points) * 100 : 0;
    // Convert started_at to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
    function toMySQLDatetime(value) {
      if (!value) return null;
      // If already in desired format, return as is
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return value;
      // Try parsing ISO string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
      }
      // Fallback: replace T with space and trim milliseconds
      return String(value).replace('T', ' ').substring(0, 19);
    }

    const resultData = {
      user_id,
      pre_assessment_id,
      score,
      total_points,
      percentage: parseFloat(percentage.toFixed(2)),
      correct_answers: correct_answers || 0,
      total_questions: total_questions || 0,
      time_taken_seconds,
      started_at: toMySQLDatetime(started_at),
      answers
    };

    const pool = await db.getPool();
    const result = await createPreAssessmentResult(pool, resultData);

    res.status(201).json({
      success: true,
      result: result
    });
  } catch (err) {
    console.error('Error creating pre-assessment result:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'User has already taken this pre-assessment'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get results by user ID
app.get('/api/pre-assessment-results/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const pool = await db.getPool();
    const results = await getResultsByUserId(pool, userId);

    console.log(`✅ Found ${results.length} pre-assessment results for user ${userId}`);

    // Add no-cache headers to prevent browser caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    res.json({
      success: true,
      results: results || [],
      timestamp: Date.now() // Add timestamp to ensure fresh data
    });
  } catch (err) {
    console.error('Error fetching results by user ID:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get results by assessment ID
app.get('/api/pre-assessment-results/assessment/:assessmentId', async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId);

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assessment ID'
      });
    }

    const pool = await db.getPool();
    const results = await getResultsByAssessmentId(pool, assessmentId);

    res.json({
      success: true,
      results: results || []
    });
  } catch (err) {
    console.error('Error fetching results by assessment ID:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get specific result by user and assessment
app.get('/api/pre-assessment-results/user/:userId/assessment/:assessmentId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const assessmentId = parseInt(req.params.assessmentId);

    if (!userId || !assessmentId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID or assessment ID'
      });
    }

    const pool = await db.getPool();
    const result = await getResultByUserAndAssessment(pool, userId, assessmentId);

    res.json({
      success: true,
      result: result || null
    });
  } catch (err) {
    console.error('Error fetching result by user and assessment:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all results (admin only)
app.get('/api/pre-assessment-results', async (req, res) => {
  try {
    const pool = await db.getPool();
    const results = await getAllResults(pool);

    res.json({
      success: true,
      results: results || []
    });
  } catch (err) {
    console.error('Error fetching all results:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get assessment statistics
app.get('/api/pre-assessment-results/statistics/:assessmentId', async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId);

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assessment ID'
      });
    }

    const pool = await db.getPool();
    const statistics = await getAssessmentStatistics(pool, assessmentId);

    res.json({
      success: true,
      statistics: statistics || {}
    });
  } catch (err) {
    console.error('Error fetching assessment statistics:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete result
app.delete('/api/pre-assessment-results/:resultId', async (req, res) => {
  try {
    const resultId = parseInt(req.params.resultId);

    if (!resultId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID'
      });
    }

    const pool = await db.getPool();
    await deleteResult(pool, resultId);

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting result:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== TUTOR PRE-ASSESSMENT API ENDPOINTS =====

// Get all tutor pre-assessments
app.get('/api/tutor-pre-assessments', async (req, res) => {
  try {
    console.log('🔍 Fetching all tutor pre-assessments');
    const createdBy = req.query.created_by || null;
    
    const pool = await db.getPool();
    const preAssessments = await getAllTutorPreAssessments(pool, createdBy);
    
    console.log(`✅ Found ${preAssessments.length} tutor pre-assessments`);
    
    res.json({
      success: true,
      preAssessments: preAssessments,
      total: preAssessments.length
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessments:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get tutor pre-assessment by ID
app.get('/api/tutor-pre-assessments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🔍 Fetching tutor pre-assessment ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tutor pre-assessment ID'
      });
    }
    
    const pool = await db.getPool();
    const preAssessment = await getTutorPreAssessmentById(pool, parseInt(id));
    
    if (!preAssessment) {
      return res.status(404).json({
        success: false,
        error: 'Tutor pre-assessment not found'
      });
    }
    
    console.log(`✅ Found tutor pre-assessment: ${preAssessment.title}`);
    
    res.json({
      success: true,
      preAssessment: preAssessment
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessment by ID:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new tutor pre-assessment
app.post('/api/tutor-pre-assessments', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      created_by, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty,
      subject_id 
    } = req.body;
    
    console.log(`📝 Creating tutor pre-assessment: ${title} for subject ${subject_id}`);
    
    // Validate required fields
    if (!title || !description || !created_by || !program || !year_level || !subject_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, created_by, program, year_level, subject_id'
      });
    }
    
    const pool = await db.getPool();
    const result = await createTutorPreAssessment(pool, {
      title,
      description,
      created_by,
      program,
      year_level,
      duration: duration || 30, // default 30 minutes
      duration_unit: duration_unit || 'minutes',
      difficulty: difficulty || 'medium',
      subject_id
    });
    
    console.log(`✅ Created tutor pre-assessment: ${result.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Tutor pre-assessment created successfully',
      preAssessment: result
    });
  } catch (err) {
    console.error('Error creating tutor pre-assessment:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update tutor pre-assessment
app.put('/api/tutor-pre-assessments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { 
      title, 
      description, 
      program, 
      year_level, 
      duration, 
      duration_unit, 
      difficulty,
      subject_id 
    } = req.body;
    
    console.log(`📝 Updating tutor pre-assessment ${id} for subject ${subject_id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tutor pre-assessment ID'
      });
    }
    
    // Validate required fields
    if (!title || !description || !program || !year_level || !subject_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, program, year_level, subject_id'
      });
    }
    
    const pool = await db.getPool();
    const result = await updateTutorPreAssessment(pool, parseInt(id), {
      title,
      description,
      program,
      year_level,
      duration,
      duration_unit,
      difficulty,
      subject_id
    });
    
    console.log(`✅ Updated tutor pre-assessment: ${id}`);
    
    res.json({
      success: true,
      message: 'Tutor pre-assessment updated successfully',
      preAssessment: result
    });
  } catch (err) {
    console.error('Error updating tutor pre-assessment:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete tutor pre-assessment
app.delete('/api/tutor-pre-assessments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🗑️ Deleting tutor pre-assessment ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tutor pre-assessment ID'
      });
    }
    
    const pool = await db.getPool();
    
    // Check if assessment exists
    const existingAssessment = await getTutorPreAssessmentById(pool, parseInt(id));
    if (!existingAssessment) {
      return res.status(404).json({
        success: false,
        error: 'Tutor pre-assessment not found'
      });
    }
    
    const result = await deleteTutorPreAssessment(pool, parseInt(id));
    
    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tutor pre-assessment not found or already deleted'
      });
    }
    
    console.log(`✅ Deleted tutor pre-assessment: ${id}`);
    
    res.json({
      success: true,
      message: 'Tutor pre-assessment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting tutor pre-assessment:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get tutor pre-assessments by program
app.get('/api/tutor-pre-assessments/program/:program', async (req, res) => {
  try {
    const program = req.params.program;
    console.log(`🔍 Fetching tutor pre-assessments for program: ${program}`);
    
    if (!program) {
      return res.status(400).json({
        success: false,
        error: 'Program parameter is required'
      });
    }
    
    const pool = await db.getPool();
    const preAssessments = await getTutorPreAssessmentsByProgram(pool, program);
    
    console.log(`✅ Found ${preAssessments.length} tutor pre-assessments for program: ${program}`);
    
    res.json({
      success: true,
      preAssessments: preAssessments,
      total: preAssessments.length,
      program: program
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessments by program:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get tutor pre-assessments by year level
app.get('/api/tutor-pre-assessments/year-level/:yearLevel', async (req, res) => {
  try {
    const yearLevel = req.params.yearLevel;
    console.log(`🔍 Fetching tutor pre-assessments for year level: ${yearLevel}`);
    
    if (!yearLevel) {
      return res.status(400).json({
        success: false,
        error: 'Year level parameter is required'
      });
    }
    
    const pool = await db.getPool();
    const preAssessments = await getTutorPreAssessmentsByYearLevel(pool, yearLevel);
    
    console.log(`✅ Found ${preAssessments.length} tutor pre-assessments for year level: ${yearLevel}`);
    
    res.json({
      success: true,
      preAssessments: preAssessments,
      total: preAssessments.length,
      yearLevel: yearLevel
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessments by year level:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get tutor pre-assessments by subject
app.get('/api/tutor-pre-assessments/subject/:subjectId', async (req, res) => {
  try {
    const subjectId = req.params.subjectId;
    
    console.log(`🔍 Fetching tutor pre-assessments for subject: ${subjectId}`);
    
    if (!subjectId || isNaN(subjectId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid subject ID is required'
      });
    }
    
    const pool = await db.getPool();
    const assessments = await getTutorPreAssessmentsBySubject(pool, parseInt(subjectId));
    
    console.log(`✅ Found ${assessments.length} tutor pre-assessments for subject`);
    
    res.json({
      success: true,
      assessments: assessments,
      total: assessments.length
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessments by subject:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Save tutor pre-assessment result
app.post('/api/tutor-pre-assessment-results', async (req, res) => {
  try {
    const {
      user_id,
      pre_assessment_id,
      score,
      total_points,
      percentage,
      correct_answers,
      total_questions,
      answers,
      passed
    } = req.body;

    console.log(`📝 Saving assessment result for user ${user_id}, assessment ${pre_assessment_id}`);

    // Validate required fields
    if (!user_id || !pre_assessment_id || score === undefined || total_points === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, pre_assessment_id, score, total_points'
      });
    }

    const pool = await db.getPool();

    // Check if result already exists
    const [existingResults] = await pool.query(
      'SELECT id FROM tutor_pre_assessment_results WHERE user_id = ? AND pre_assessment_id = ?',
      [user_id, pre_assessment_id]
    );

    if (existingResults.length > 0) {
      // Update existing result
      const [updateResult] = await pool.query(`
        UPDATE tutor_pre_assessment_results 
        SET score = ?, total_points = ?, percentage = ?, correct_answers = ?, 
            total_questions = ?, answers = ?, passed = ?, completed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND pre_assessment_id = ?
      `, [score, total_points, percentage, correct_answers, total_questions, answers, passed, user_id, pre_assessment_id]);

      console.log(`✅ Updated assessment result for user ${user_id}`);
      
      res.json({
        success: true,
        message: 'Assessment result updated successfully',
        result_id: existingResults[0].id
      });
    } else {
      // Insert new result
      const [insertResult] = await pool.query(`
        INSERT INTO tutor_pre_assessment_results (
          user_id, pre_assessment_id, score, total_points, percentage, 
          correct_answers, total_questions, answers, passed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [user_id, pre_assessment_id, score, total_points, percentage, correct_answers, total_questions, answers, passed]);

      console.log(`✅ Created assessment result with ID: ${insertResult.insertId}`);
      
      res.json({
        success: true,
        message: 'Assessment result saved successfully',
        result_id: insertResult.insertId
      });
    }

  } catch (err) {
    console.error('Error saving tutor pre-assessment result:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== TUTOR PRE-ASSESSMENT QUESTIONS API ENDPOINTS =====

// Get questions for tutor pre-assessment
app.get('/api/tutor-pre-assessment-questions/pre-assessment/:preAssessmentId', async (req, res) => {
  try {
    const preAssessmentId = req.params.preAssessmentId;
    console.log(`🔍 Fetching questions for tutor pre-assessment ${preAssessmentId}`);
    
    if (!preAssessmentId || isNaN(preAssessmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tutor pre-assessment ID'
      });
    }
    
    const pool = await db.getPool();
    const questions = await getTutorPreAssessmentQuestions(pool, parseInt(preAssessmentId));
    
    // Shuffle questions for randomization
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    const shuffledQuestions = shuffleArray(questions);
    
    console.log(`✅ Found ${shuffledQuestions.length} questions for tutor pre-assessment (shuffled)`);
    
    res.json({
      success: true,
      questions: shuffledQuestions,
      total: shuffledQuestions.length
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessment questions:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get tutor pre-assessment question by ID
app.get('/api/tutor-pre-assessment-questions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🔍 Fetching tutor pre-assessment question ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question ID'
      });
    }
    
    const pool = await db.getPool();
    const question = await getTutorPreAssessmentQuestionById(pool, parseInt(id));
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Tutor pre-assessment question not found'
      });
    }
    
    console.log(`✅ Found tutor pre-assessment question: ${question.id}`);
    
    res.json({
      success: true,
      question: question
    });
  } catch (err) {
    console.error('Error fetching tutor pre-assessment question by ID:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new tutor pre-assessment question
app.post('/api/tutor-pre-assessment-questions', async (req, res) => {
  try {
    const { 
      pre_assessment_id, 
      question, 
      question_type, 
      options, 
      correct_answer, 
      explanation, 
      points,
      difficulty,
      order_index
    } = req.body;
    
    console.log(`📝 Creating question for tutor pre-assessment ${pre_assessment_id}`);
    
    // Validate required fields
    if (!pre_assessment_id || !question || !question_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pre_assessment_id, question, question_type'
      });
    }
    
    const pool = await db.getPool();
    const result = await createTutorPreAssessmentQuestion(pool, {
      pre_assessment_id,
      question_text: question,
      question_type,
      options,
      correct_answer,
      explanation,
      points: points || 1,
      difficulty: difficulty || 'medium',
      order_index: order_index || 0
    });
    
    console.log(`✅ Created tutor pre-assessment question: ${result.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Tutor pre-assessment question created successfully',
      question: result
    });
  } catch (err) {
    console.error('Error creating tutor pre-assessment question:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update tutor pre-assessment question
app.put('/api/tutor-pre-assessment-questions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { 
      question, 
      question_type, 
      options, 
      correct_answer, 
      explanation, 
      points,
      difficulty,
      order_index
    } = req.body;
    
    console.log(`📝 Updating tutor pre-assessment question ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question ID'
      });
    }
    
    // Validate required fields
    if (!question || !question_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question, question_type'
      });
    }
    
    const pool = await db.getPool();
    const result = await updateTutorPreAssessmentQuestion(pool, parseInt(id), {
      question_text: question,
      question_type,
      options,
      correct_answer,
      explanation,
      points,
      difficulty,
      order_index
    });
    
    console.log(`✅ Updated tutor pre-assessment question: ${id}`);
    
    res.json({
      success: true,
      message: 'Tutor pre-assessment question updated successfully',
      question: result
    });
  } catch (err) {
    console.error('Error updating tutor pre-assessment question:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete tutor pre-assessment question
app.delete('/api/tutor-pre-assessment-questions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🗑️ Deleting tutor pre-assessment question ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question ID'
      });
    }
    
    const pool = await db.getPool();
    
    // Check if question exists
    const existingQuestion = await getTutorPreAssessmentQuestionById(pool, parseInt(id));
    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Tutor pre-assessment question not found'
      });
    }
    
    const result = await deleteTutorPreAssessmentQuestion(pool, parseInt(id));
    
    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tutor pre-assessment question not found or already deleted'
      });
    }
    
    console.log(`✅ Deleted tutor pre-assessment question: ${id}`);
    
    res.json({
      success: true,
      message: 'Tutor pre-assessment question deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting tutor pre-assessment question:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Bulk create tutor pre-assessment questions
app.post('/api/tutor-pre-assessment-questions/bulk', async (req, res) => {
  try {
    const { pre_assessment_id, questions } = req.body;
    
    console.log(`📝 Bulk creating ${questions.length} questions for tutor pre-assessment ${pre_assessment_id}`);
    
    // Validate required fields
    if (!pre_assessment_id || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pre_assessment_id and questions array'
      });
    }
    
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Questions array cannot be empty'
      });
    }
    
    const pool = await db.getPool();
    const result = await createTutorPreAssessmentQuestions(pool, pre_assessment_id, questions);
    
    console.log(`✅ Created ${result.length} tutor pre-assessment questions`);
    
    res.status(201).json({
      success: true,
      message: 'Tutor pre-assessment questions created successfully',
      questions: result,
      total: result.length
    });
  } catch (err) {
    console.error('Error bulk creating tutor pre-assessment questions:', err);
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

// Serve/stream a pending material file directly (for preview in new tab)
app.get('/api/pending-materials/:id/serve', async (req, res) => {
  try {
    const materialId = req.params.id;
    console.log(`Serving pending material file ${materialId}`);

    const pool = await db.getPool();
    const material = await getPendingMaterialById(pool, materialId);

    if (!material || !material.file_path) {
      return res.status(404).json({ success: false, error: 'Pending material not found' });
    }

    // Resolve filesystem path for the file (supports '/pending-resources/...' stored values)
    let relPath = material.file_path;
    try {
      if (relPath.startsWith('http')) {
        const parsed = new URL(relPath);
        relPath = parsed.pathname;
      }
    } catch (e) {
      // ignore URL parsing errors
    }

    let cleanRelPath = relPath.replace(/^\/pending-resources\//, '');
    const filePath = path.join(pendingResourcesDir, cleanRelPath);

    if (!fs.existsSync(filePath)) {
      console.error('Pending file not found on server:', filePath);
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Try to increment view count in pendingmaterials table (best-effort)
    try {
      await pool.query('UPDATE pendingmaterials SET view_count = view_count + 1 WHERE material_id = ?', [materialId]);
    } catch (incErr) {
      console.warn('Failed to increment pending material view count:', incErr.message);
    }

    // Stream the file
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving pending material file:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
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
      const filename = path.basename(pendingMaterial.file_path);

      // Source: the pending resources directory where uploads are stored
      const pendingFilePath = path.join(pendingResourcesDir, filename);

      // Destination: learning-resources directory under frontend public
      const learningResourcesPath = path.join(__dirname, '../../frontend/public/learning-resources');
      const newFilePath = path.join(learningResourcesPath, filename);

      // Create learning-resources directory if it doesn't exist
      if (!fs.existsSync(learningResourcesPath)) {
        fs.mkdirSync(learningResourcesPath, { recursive: true });
      }

      // If file exists in pendingResourcesDir, move it. Otherwise, attempt legacy path fallback.
      if (fs.existsSync(pendingFilePath)) {
        fs.renameSync(pendingFilePath, newFilePath);
        console.log(`✅ Moved file from ${pendingFilePath} to ${newFilePath}`);
      } else {
        // Legacy fallback: try joining the frontend/public root with stored file_path
        const legacyPending = path.join(__dirname, '../../frontend/public', pendingMaterial.file_path.replace(/^\//, ''));
        if (fs.existsSync(legacyPending)) {
          fs.renameSync(legacyPending, newFilePath);
          console.log(`✅ Moved file from legacy path ${legacyPending} to ${newFilePath}`);
        } else {
          console.warn('Pending file not found at expected locations:', pendingFilePath, legacyPending);
        }
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

    // Send approval email to the quiz creator
    try {
      console.log(`Sending quiz approval email to ${pendingQuiz.creator_email}...`);
      
      const emailResult = await sendQuizApprovalEmail(
        pendingQuiz.creator_email,
        pendingQuiz.created_by_name,
        pendingQuiz.title,
        'Admin'
      );
      
      if (emailResult.success) {
        console.log(`✅ Quiz approval email sent successfully`);
      } else {
        console.log(`⚠️ Failed to send quiz approval email: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.log(`⚠️ Error sending quiz approval email: ${emailError.message}`);
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

// ===== PENDING POST-TESTS API ENDPOINTS =====

// Get all pending post-tests
app.get('/api/pending-post-tests', async (req, res) => {
  try {
    console.log('Fetching all pending post-tests');
    const pool = await db.getPool();
    const postTests = await getAllPendingPostTests(pool);
    
    console.log(`✅ Found ${postTests.length} pending post-tests`);
    
    res.json({
      success: true,
      postTests: postTests,
      total: postTests.length
    });
  } catch (err) {
    console.error('Error fetching pending post-tests:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending post-test by ID
app.get('/api/pending-post-tests/:id', async (req, res) => {
  try {
    const pendingPostTestId = parseInt(req.params.id);
    console.log(`Fetching pending post-test with ID: ${pendingPostTestId}`);
    
    const pool = await db.getPool();
    const postTest = await getPendingPostTestById(pool, pendingPostTestId);
    
    if (!postTest) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending post-test not found' 
      });
    }
    
    // Get questions for this pending post-test
    const questions = await getQuestionsByPendingPostTestId(pool, pendingPostTestId);
    
    console.log(`✅ Found pending post-test ${pendingPostTestId} with ${questions.length} questions`);
    
    res.json({
      success: true,
      postTest: {
        ...postTest,
        questions: questions
      }
    });
  } catch (err) {
    console.error('Error fetching pending post-test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending post-tests by status
app.get('/api/pending-post-tests/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    console.log(`Fetching pending post-tests with status: ${status}`);
    
    const pool = await db.getPool();
    const postTests = await getPendingPostTestsByStatus(pool, status);
    
    console.log(`✅ Found ${postTests.length} post-tests with status ${status}`);
    
    res.json({
      success: true,
      postTests: postTests,
      total: postTests.length,
      status: status
    });
  } catch (err) {
    console.error('Error fetching pending post-tests by status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending post-tests by subject (for faculty)
app.get('/api/pending-post-tests/subject/:subjectId', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    console.log(`Fetching pending post-tests for subject: ${subjectId}`);
    
    const pool = await db.getPool();
    const postTests = await getPendingPostTestsBySubject(pool, subjectId);
    
    console.log(`✅ Found ${postTests.length} pending post-tests for subject ${subjectId}`);
    
    res.json({
      success: true,
      postTests: postTests,
      total: postTests.length
    });
  } catch (err) {
    console.error('Error fetching pending post-tests by subject:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Approve pending post-test
app.put('/api/pending-post-tests/:id/approve', async (req, res) => {
  try {
    const pendingPostTestId = parseInt(req.params.id);
    const { approved_by } = req.body;
    
    console.log(`Approving pending post-test ID: ${pendingPostTestId}`);
    
    const pool = await db.getPool();
    
    // Get pending post-test details with user information
    const pendingPostTest = await getPendingPostTestById(pool, pendingPostTestId);
    
    if (!pendingPostTest) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending post-test not found' 
      });
    }

    // Get tutor information
    const [tutorRows] = await pool.query(`
      SELECT user_id, first_name, last_name, email 
      FROM users 
      WHERE user_id = ?
    `, [pendingPostTest.tutor_id]);

    const tutor = tutorRows[0];
    if (!tutor) {
      return res.status(404).json({ 
        success: false,
        error: 'Tutor not found' 
      });
    }

    // Student and session may not exist for template submissions
    const student = pendingPostTest.student_id ? (await (await pool.query(`SELECT user_id, first_name, last_name, email FROM users WHERE user_id = ?`, [pendingPostTest.student_id]))[0])[0] : null;
    const sessionDate = null;
    
    // Update status to approved
    await updatePendingPostTestStatus(pool, pendingPostTestId, 'approved', approved_by, null);
    
    // Transfer to post_test_templates (create reusable template)
    const newTemplate = await transferToPostTests(pool, pendingPostTest);

    // Delete from pending_post_tests (cascade will delete questions)
    await deletePendingPostTest(pool, pendingPostTestId);

    console.log(`✅ Post-test approved and converted to template: ${newTemplate.template_id}`);

    // Send email notifications (student may not exist for template submissions)
    try {
      // Send email to tutor
      const tutorEmailResult = await sendPostTestApprovalEmailToTutor(
        tutor.email,
        `${tutor.first_name} ${tutor.last_name}`,
        pendingPostTest.title,
        student ? `${student.first_name} ${student.last_name}` : null,
        sessionDate
      );

      // Send email to student if present
      if (student) {
        const studentEmailResult = await sendPostTestApprovalEmailToStudent(
          student.email,
          `${student.first_name} ${student.last_name}`,
          pendingPostTest.title,
          `${tutor.first_name} ${tutor.last_name}`,
          sessionDate
        );

        console.log('Email notifications sent:', {
          tutor: tutorEmailResult.success,
          student: studentEmailResult.success
        });
      } else {
        console.log('Email notification sent to tutor only:', { tutor: tutorEmailResult.success });
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
      // Don't fail the approval if email fails
    }
    
    res.json({
      success: true,
      message: 'Post-test approved and added to templates successfully',
      template: newTemplate
    });
  } catch (err) {
    console.error('Error approving post-test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reject pending post-test
app.put('/api/pending-post-tests/:id/reject', async (req, res) => {
  try {
    const pendingPostTestId = parseInt(req.params.id);
    const { rejected_by, comment } = req.body;
    
    // Validate that comment is provided
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection comment is required' 
      });
    }
    
    console.log(`Rejecting pending post-test ID: ${pendingPostTestId} with comment`);
    
    const pool = await db.getPool();
    
    // Update status to rejected with comment
    const updateSuccess = await updatePendingPostTestStatus(pool, pendingPostTestId, 'rejected', rejected_by, comment);
    
    if (!updateSuccess) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending post-test not found' 
      });
    }
    
    console.log(`✅ Post-test rejected: ${pendingPostTestId}`);
    
    res.json({
      success: true,
      message: 'Post-test rejected successfully'
    });
  } catch (err) {
    console.error('Error rejecting post-test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete pending post-test
app.delete('/api/pending-post-tests/:id', async (req, res) => {
  try {
    const pendingPostTestId = parseInt(req.params.id);
    console.log(`Deleting pending post-test with ID: ${pendingPostTestId}`);
    
    const pool = await db.getPool();
    const deleteSuccess = await deletePendingPostTest(pool, pendingPostTestId);
    
    if (!deleteSuccess) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending post-test not found' 
      });
    }
    
    console.log(`✅ Pending post-test deleted: ${pendingPostTestId}`);
    
    res.json({
      success: true,
      message: 'Pending post-test deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting pending post-test:', err);
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

    // Send approval email to the flashcard creator
    try {
      console.log(`Sending flashcard approval email to ${pendingFlashcard.creator_email}...`);
      
      const emailResult = await sendFlashcardApprovalEmail(
        pendingFlashcard.creator_email,
        pendingFlashcard.created_by_name,
        pendingFlashcard.title || 'Flashcard Set',
        'Admin'
      );
      
      if (emailResult.success) {
        console.log(`✅ Flashcard approval email sent successfully`);
      } else {
        console.log(`⚠️ Failed to send flashcard approval email: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.log(`⚠️ Error sending flashcard approval email: ${emailError.message}`);
    }

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

// ========== MATERIAL RATING ENDPOINTS ==========

// Get average rating for a material
app.get('/api/materials/:id/rating', async (req, res) => {
  try {
    const materialId = parseInt(req.params.id);
    
    if (!materialId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid material ID' 
      });
    }

    const pool = await db.getPool();
    const ratingData = await getMaterialAverageRating(pool, materialId);
    
    res.json({
      success: true,
      ...ratingData
    });
  } catch (err) {
    console.error('Error fetching material rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user's rating for a material
app.get('/api/materials/:id/rating/:userId', async (req, res) => {
  try {
    const materialId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!materialId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid material ID or user ID' 
      });
    }

    const pool = await db.getPool();
    const userRating = await getUserMaterialRating(pool, materialId, userId);
    
    res.json({
      success: true,
      userRating: userRating
    });
  } catch (err) {
    console.error('Error fetching user material rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Rate a material
app.post('/api/materials/:id/rating', async (req, res) => {
  try {
    const materialId = parseInt(req.params.id);
    const { userId, rating, comment } = req.body;
    
    if (!materialId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Material ID and user ID are required' 
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be between 1 and 5' 
      });
    }

    const pool = await db.getPool();
    
    // Check if material exists
    const material = await getStudyMaterialById(pool, materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }

    await upsertMaterialRating(pool, materialId, userId, rating, comment || null);
    
    // Get updated average rating
    const updatedRating = await getMaterialAverageRating(pool, materialId);
    
    // Update the studymaterials table with the new average
    await updateMaterialRating(pool, materialId, updatedRating.average_rating);
    
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      ...updatedRating
    });
  } catch (err) {
    console.error('Error rating material:', err);
    
    if (err.message.includes('completion')) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete user's rating for a material
app.delete('/api/materials/:id/rating/:userId', async (req, res) => {
  try {
    const materialId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!materialId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid material ID or user ID' 
      });
    }

    const pool = await db.getPool();
    const deleted = await deleteMaterialRating(pool, materialId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }

    // Get updated average rating
    const updatedRating = await getMaterialAverageRating(pool, materialId);
    
    // Update the studymaterials table with the new average
    await updateMaterialRating(pool, materialId, updatedRating.average_rating);
    
    res.json({
      success: true,
      message: 'Rating deleted successfully',
      ...updatedRating
    });
  } catch (err) {
    console.error('Error deleting material rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ========== QUIZ RATING ENDPOINTS ==========

// Get average rating for a quiz
app.get('/api/quizzes/:id/rating', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID is required' 
      });
    }
    
    const pool = await db.getPool();
    const ratingData = await getQuizAverageRating(pool, quizId);
    
    res.json({
      success: true,
      ...ratingData
    });
  } catch (err) {
    console.error('Error fetching quiz rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user's rating for a quiz
app.get('/api/quizzes/:id/rating/:userId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!quizId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID and user ID are required' 
      });
    }
    
    const pool = await db.getPool();
    const userRating = await getUserQuizRating(pool, quizId, userId);
    
    res.json({
      success: true,
      rating: userRating
    });
  } catch (err) {
    console.error('Error fetching user quiz rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create or update quiz rating
app.post('/api/quizzes/:id/rating', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { user_id, rating, comment } = req.body;
    
    if (!quizId || !user_id || !rating) {
      return res.status(400).json({ 
        success: false,
        error: 'Quiz ID, user ID, and rating are required' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const pool = await db.getPool();
    
    // Check if user has completed the quiz before allowing rating
    const [attempts] = await pool.query(
      'SELECT * FROM quizattempts WHERE quizzes_id = ? AND user_id = ?',
      [quizId, user_id]
    );
    
    if (attempts.length === 0) {
      return res.status(403).json({ 
        success: false,
        error: 'You must complete this quiz before rating it' 
      });
    }
    
    await upsertQuizRating(pool, quizId, user_id, rating, comment || null);
    
    // Get updated average rating
    const ratingData = await getQuizAverageRating(pool, quizId);
    
    res.json({
      success: true,
      message: 'Quiz rated successfully',
      ...ratingData
    });
  } catch (err) {
    console.error('Error rating quiz:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete quiz rating
app.delete('/api/quizzes/:id/rating/:userId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!quizId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid quiz ID and user ID are required' 
      });
    }
    
    const pool = await db.getPool();
    const deleted = await deleteQuizRating(pool, quizId, userId);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Rating not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting quiz rating:', err);
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

// Get top quiz performers (analytics)
app.get('/api/analytics/top-quiz-performers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    console.log(`Fetching top ${limit} quiz performers`);

    const pool = await db.getPool();
    const performers = await getTopQuizPerformers(pool, limit);

    console.log(`✅ Retrieved ${performers.length} top performers`);

    res.json({
      success: true,
      performers
    });
  } catch (err) {
    console.error('Error fetching top quiz performers:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
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

// ========== FLASHCARD RATING ENDPOINTS ==========

// Get average rating for a flashcard
app.get('/api/flashcards/:id/rating', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    
    if (!flashcardId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid flashcard ID is required' 
      });
    }
    
    const pool = await db.getPool();
    const ratingData = await getFlashcardAverageRating(pool, flashcardId);
    
    res.json({
      success: true,
      ...ratingData
    });
  } catch (err) {
    console.error('Error fetching flashcard rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get average rating for a flashcard set (by sub_id)
app.get('/api/flashcards/set/:subId/rating', async (req, res) => {
  try {
    const subId = parseInt(req.params.subId);
    
    if (!subId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid sub ID is required' 
      });
    }
    
    const pool = await db.getPool();
    const ratingData = await getFlashcardSetAverageRating(pool, subId);
    
    res.json({
      success: true,
      ...ratingData
    });
  } catch (err) {
    console.error('Error fetching flashcard set rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user's rating for a flashcard set
app.get('/api/flashcards/set/:subId/rating/:userId', async (req, res) => {
  try {
    const subId = parseInt(req.params.subId);
    const userId = parseInt(req.params.userId);
    
    if (!subId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid sub ID and user ID are required' 
      });
    }
    
    const pool = await db.getPool();
    const userRating = await getUserFlashcardSetRating(pool, subId, userId);
    
    res.json({
      success: true,
      rating: userRating
    });
  } catch (err) {
    console.error('Error fetching user flashcard set rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Rate a flashcard set (rates all cards in the set)
app.post('/api/flashcards/set/:subId/rating', async (req, res) => {
  try {
    const subId = parseInt(req.params.subId);
    const { user_id, rating, comment } = req.body;
    
    if (!subId || !user_id || !rating) {
      return res.status(400).json({ 
        success: false,
        error: 'Sub ID, user ID, and rating are required' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const pool = await db.getPool();
    
    // Check if user has completed the entire flashcard set before allowing rating
    // Get total cards in the set
    const [totalCards] = await pool.query(
      'SELECT COUNT(*) as total_cards FROM flashcards WHERE sub_id = ?',
      [subId]
    );
    
    if (totalCards[0].total_cards === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Flashcard set not found or empty' 
      });
    }
    
    // Check if user has completed all cards in the set
    const [completedCards] = await pool.query(`
      SELECT COUNT(*) as completed_cards
      FROM flashcardprogress fp
      INNER JOIN flashcards f ON fp.flashcard_id = f.flashcard_id
      WHERE f.sub_id = ? AND fp.user_id = ? AND fp.status = 'completed'
    `, [subId, user_id]);
    
    if (completedCards[0].completed_cards < totalCards[0].total_cards) {
      return res.status(403).json({ 
        success: false,
        error: 'You must complete all flashcards in this set before rating it',
        completed: completedCards[0].completed_cards,
        total: totalCards[0].total_cards
      });
    }
    
    const result = await rateFlashcardSet(pool, subId, user_id, rating, comment || null);
    
    // Get updated average rating
    const ratingData = await getFlashcardSetAverageRating(pool, subId);
    
    res.json({
      success: true,
      message: 'Flashcard set rated successfully',
      rated_count: result.rated_count,
      ...ratingData
    });
  } catch (err) {
    console.error('Error rating flashcard set:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user's rating for a single flashcard
app.get('/api/flashcards/:id/rating/:userId', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    if (!flashcardId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid flashcard ID and user ID are required' 
      });
    }
    
    const pool = await db.getPool();
    const userRating = await getUserFlashcardRating(pool, flashcardId, userId);
    
    res.json({
      success: true,
      rating: userRating
    });
  } catch (err) {
    console.error('Error fetching user flashcard rating:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create or update single flashcard rating
app.post('/api/flashcards/:id/rating', async (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id);
    const { user_id, rating, comment } = req.body;
    
    if (!flashcardId || !user_id || !rating) {
      return res.status(400).json({ 
        success: false,
        error: 'Flashcard ID, user ID, and rating are required' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const pool = await db.getPool();
    
    // Check if user has completed this specific flashcard before allowing rating
    const [progress] = await pool.query(
      'SELECT status FROM flashcardprogress WHERE flashcard_id = ? AND user_id = ?',
      [flashcardId, user_id]
    );
    
    if (progress.length === 0 || progress[0].status !== 'completed') {
      return res.status(403).json({ 
        success: false,
        error: 'You must complete this flashcard before rating it' 
      });
    }
    
    await upsertFlashcardRating(pool, flashcardId, user_id, rating, comment || null);
    
    // Get updated average rating
    const ratingData = await getFlashcardAverageRating(pool, flashcardId);
    
    res.json({
      success: true,
      message: 'Flashcard rated successfully',
      ...ratingData
    });
  } catch (err) {
    console.error('Error rating flashcard:', err);
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

// Get flashcard set statistics (unique users who completed)
app.get('/api/flashcards/set/statistics/:subId', async (req, res) => {
  try {
    const subId = parseInt(req.params.subId);
    
    if (!subId) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid sub_id is required' 
      });
    }
    
    console.log(`Fetching flashcard set statistics for sub_id: ${subId}`);
    
    const pool = await db.getPool();
    const statistics = await getFlashcardSetStatistics(pool, subId);
    
    console.log(`✅ Retrieved flashcard set statistics for sub_id ${subId}:`, statistics);
    
    res.json({
      success: true,
      statistics: statistics
    });
  } catch (err) {
    console.error('Error fetching flashcard set statistics:', err);
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
    const { startDate, endDate, studentId, requesterId } = req.query;

    console.log('=== AVAILABILITY REQUEST ===');
    console.log('Tutor ID:', tutorId);
    console.log('Student ID:', studentId);
    console.log('Requester ID:', requesterId);
    console.log('Date Range:', startDate, 'to', endDate);
    console.log('Request URL params:', req.query);

    if (!tutorId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: tutorId, startDate, endDate' 
      });
    }

    const pool = await db.getPool();
    
    // Get all existing bookings that could conflict:
    // 1. All bookings involving the target tutor (tutor conflicts)
    // 2. If studentId provided, all bookings involving that student (student conflicts)
    // 3. If requesterId provided, all bookings involving the requester as tutor or student (requester conflicts)
    let existingBookings = [];
    let allBookingQueries = [];
    
    // Always check target tutor conflicts
    allBookingQueries.push({
      query: `
        SELECT b.booking_id, b.start_date, b.end_date, b.preferred_time, b.status, 
               COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'Unknown') as student_name, 
               COALESCE(CONCAT(t.first_name, ' ', t.last_name), 'Unknown') as tutor_name,
               b.student_id, b.tutor_id, b.created_at, b.booked_by, 'tutor_conflict' as conflict_type
        FROM bookings b
        LEFT JOIN users s ON b.student_id = s.user_id
        LEFT JOIN users t ON b.tutor_id = t.user_id
        WHERE b.tutor_id = ? 
        AND (
          (DATE(b.start_date) <= DATE(?) AND DATE(b.end_date) >= DATE(?)) OR
          (DATE(b.start_date) >= DATE(?) AND DATE(b.start_date) <= DATE(?))
        )
        ORDER BY b.start_date, b.preferred_time
      `,
      params: [tutorId, endDate, startDate, startDate, endDate]
    });
    
    if (studentId) {
      // Check student conflicts when studentId is provided
      allBookingQueries.push({
        query: `
          SELECT b.booking_id, b.start_date, b.end_date, b.preferred_time, b.status, 
                 COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'Unknown') as student_name, 
                 COALESCE(CONCAT(t.first_name, ' ', t.last_name), 'Unknown') as tutor_name,
                 b.student_id, b.tutor_id, b.created_at, b.booked_by, 'student_conflict' as conflict_type
          FROM bookings b
          LEFT JOIN users s ON b.student_id = s.user_id
          LEFT JOIN users t ON b.tutor_id = t.user_id
          WHERE b.student_id = ? 
          AND (
            (DATE(b.start_date) <= DATE(?) AND DATE(b.end_date) >= DATE(?)) OR
            (DATE(b.start_date) >= DATE(?) AND DATE(b.start_date) <= DATE(?))
          )
          ORDER BY b.start_date, b.preferred_time
        `,
        params: [studentId, endDate, startDate, startDate, endDate]
      });
    }
    
    if (requesterId && requesterId !== tutorId) {
      // Check requester conflicts when requesterId is provided (e.g., tutor booking another tutor)
      // Only skip if requester is the same as the target tutor (self-booking)
      allBookingQueries.push({
        query: `
          SELECT b.booking_id, b.start_date, b.end_date, b.preferred_time, b.status, 
                 COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'Unknown') as student_name, 
                 COALESCE(CONCAT(t.first_name, ' ', t.last_name), 'Unknown') as tutor_name,
                 b.student_id, b.tutor_id, b.created_at, b.booked_by, 'requester_conflict' as conflict_type
          FROM bookings b
          LEFT JOIN users s ON b.student_id = s.user_id
          LEFT JOIN users t ON b.tutor_id = t.user_id
          WHERE (b.student_id = ? OR b.tutor_id = ?)
          AND (
            (DATE(b.start_date) <= DATE(?) AND DATE(b.end_date) >= DATE(?)) OR
            (DATE(b.start_date) >= DATE(?) AND DATE(b.start_date) <= DATE(?))
          )
          ORDER BY b.start_date, b.preferred_time
        `,
        params: [requesterId, requesterId, endDate, startDate, startDate, endDate]
      });
    }
    
    // Execute all booking queries
    for (const queryObj of allBookingQueries) {
      const [results] = await pool.query(queryObj.query, queryObj.params);
      existingBookings.push(...results);
    }
    
    // Remove duplicates based on booking_id
    existingBookings = existingBookings.reduce((acc, current) => {
      const exists = acc.find(booking => booking.booking_id === current.booking_id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

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
        booking_id: booking.booking_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        preferred_time: booking.preferred_time,
        status: booking.status,
        student_name: booking.student_name,
        tutor_name: booking.tutor_name,
        student_id: booking.student_id,
        tutor_id: booking.tutor_id,
        conflict_type: booking.conflict_type,
        booked_by: booking.booked_by
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

    const booking_id = await createSession({ tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time, booked_by: 'student' });
    console.log('Session created successfully with booking_id:', booking_id);

    res.status(201).json({ success: true, booking_id });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

// API endpoint: Tutor books a student (reverse booking)
app.post('/api/sessions/tutor-booking', async (req, res) => {
  try {
    const { student_id, tutor_id, preferred_dates, preferred_time } = req.body;

    console.log('Tutor booking request:', { student_id, tutor_id, preferred_dates, preferred_time });

    // Input validation
    if (!student_id || !tutor_id || !preferred_dates || !preferred_time) {
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

    console.log('Creating tutor-initiated session with details:', {
      tutor_id, tutor_name, student_id, student_name, start_date, end_date, preferred_time
    });

    const booking_id = await createSession({ 
      tutor_id, 
      tutor_name, 
      student_id, 
      student_name, 
      start_date, 
      end_date, 
      preferred_time, 
      booked_by: 'tutor',
      status: 'pending_student_approval'  // Special status for tutor-initiated bookings
    });
    
    console.log('Tutor-initiated session created successfully with booking_id:', booking_id);

    res.status(201).json({ 
      success: true, 
      booking_id,
      message: 'Booking request sent to student. Waiting for student approval.'
    });
  } catch (err) {
    console.error('Error creating tutor-initiated session:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

// API endpoint: Student accepts tutor booking request
app.put('/api/sessions/:booking_id/accept', async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { student_id } = req.body;

    console.log(`Student ${student_id} accepting booking ${booking_id}`);

    const pool = await db.getPool();
    
    // Verify the booking exists and is pending student approval
    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND student_id = ? AND status = "pending_student_approval"',
      [booking_id, student_id]
    );

    if (booking.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found or not pending approval' 
      });
    }

    // Update booking status to active
    await pool.query(
      'UPDATE bookings SET status = "active" WHERE booking_id = ?',
      [booking_id]
    );

    console.log(`✅ Booking ${booking_id} accepted by student`);

    res.json({ 
      success: true,
      message: 'Booking request accepted successfully!'
    });
  } catch (err) {
    console.error('Error accepting booking:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

// API endpoint: Student rejects tutor booking request
app.put('/api/sessions/:booking_id/reject', async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { student_id, rejection_reason } = req.body;

    console.log(`Student ${student_id} rejecting booking ${booking_id}`);

    const pool = await db.getPool();
    
    // Verify the booking exists and is pending student approval
    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND student_id = ? AND status = "pending_student_approval"',
      [booking_id, student_id]
    );

    if (booking.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found or not pending approval' 
      });
    }

    // Update booking status to rejected and add rejection reason
    await pool.query(
      'UPDATE bookings SET status = "rejected", remarks = ? WHERE booking_id = ?',
      [rejection_reason || 'Student rejected the booking request', booking_id]
    );

    console.log(`❌ Booking ${booking_id} rejected by student`);

    res.json({ 
      success: true,
      message: 'Booking request rejected.'
    });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})

// API endpoint: Get sessions for a student or tutor
app.get('/api/sessions', async (req, res) => {
  try {
    const { user_id, tutor_id } = req.query;
    const pool = await db.getPool();
    let sessions = [];
    
    if (tutor_id) {
      // Show sessions for specific tutor only (for availability checking)
      const query = `
        SELECT 
          b.*,
          t.subject_id,
          s.subject_name,
          s.subject_code
        FROM bookings b
        LEFT JOIN tutors t ON b.tutor_id = t.user_id
        LEFT JOIN subjects s ON t.subject_id = s.subject_id
        WHERE b.tutor_id = ?
      `;
      const [result] = await pool.query(query, [tutor_id]);
      sessions = result;
      if (sessions.length === 0) {
        console.log(`No sessions found for tutor_id: ${tutor_id}`);
      } else {
        console.log(`Found ${sessions.length} sessions for tutor_id: ${tutor_id}`);
      }
    } else if (user_id) {
      // Only show sessions for this user (student or tutor) with subject information from tutors table
      const query = `
        SELECT 
          b.*,
          t.subject_id,
          s.subject_name,
          s.subject_code
        FROM bookings b
        LEFT JOIN tutors t ON b.tutor_id = t.user_id
        LEFT JOIN subjects s ON t.subject_id = s.subject_id
        WHERE b.student_id = ? OR b.tutor_id = ?
      `;
      const [result] = await pool.query(query, [user_id, user_id]);
      sessions = result;
      if (sessions.length === 0) {
        console.log(`No sessions found for user_id: ${user_id}`);
      } else {
        console.log(`Found ${sessions.length} sessions for user_id: ${user_id}`);
      }
    } else {
      // No user_id: show all sessions (admin/faculty) with subject information from tutors table
      const query = `
        SELECT 
          b.*,
          t.subject_id,
          s.subject_name,
          s.subject_code
        FROM bookings b
        LEFT JOIN tutors t ON b.tutor_id = t.user_id
        LEFT JOIN subjects s ON t.subject_id = s.subject_id
      `;
      const [result] = await pool.query(query);
      let allSessions = result;
      
      // Check if request comes from faculty and filter sessions accordingly
      const requestingUserId = req.headers['x-user-id'];
      const requestingUserRole = req.headers['x-user-role'];
      
      if (requestingUserRole === 'Faculty' && requestingUserId) {
        // Get all subjects and their assigned faculty
        const [subjectsResult] = await pool.query('SELECT subject_id, user_id FROM subjects');
        const facultySubjects = [];
        
        // Find subjects assigned to this faculty member
        subjectsResult.forEach(subj => {
          if (subj.user_id) {
            try {
              const facultyIds = JSON.parse(subj.user_id);
              if (facultyIds.some(fid => String(fid) === String(requestingUserId))) {
                facultySubjects.push(subj.subject_id);
              }
            } catch {
              // Handle non-JSON user_id values
              if (String(subj.user_id) === String(requestingUserId)) {
                facultySubjects.push(subj.subject_id);
              }
            }
          }
        });
        
        // Filter sessions to only show those for subjects assigned to this faculty
        sessions = allSessions.filter(session => 
          session.subject_id && facultySubjects.includes(session.subject_id)
        );
        
        console.log(`Faculty ${requestingUserId}: Found ${sessions.length} sessions for their assigned subjects (${facultySubjects.length} subjects).`);
      } else {
        // Admin sees all sessions
        sessions = allSessions;
        console.log(`Admin: Found ${sessions.length} total sessions.`);
      }
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

    // Calculate average rating for this tutor from all completed bookings with a rating (regardless of subject)
    const [[avgResult]] = await pool.query('SELECT AVG(rating) AS avg_rating FROM bookings WHERE tutor_id = ? AND rating IS NOT NULL AND status = "Completed"', [tutor_id]);
    const avg_rating = avgResult.avg_rating ? parseFloat(avgResult.avg_rating).toFixed(2) : null;

    // Always update tutor's ratings column, regardless of subject/pre-test
    const [tutorUpdateResult] = await pool.query('UPDATE tutors SET ratings = ? WHERE user_id = ?', [avg_rating, tutor_id]);
    if (tutorUpdateResult.affectedRows === 0) {
      console.warn(`Warning: No tutor row updated for user_id ${tutor_id}. Check if tutor exists in tutors table.`);
    }

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
      
      // If trying to mark as completed, check if student has rated the session
      if (status.toLowerCase() === 'completed') {
        const [[booking]] = await pool.query(
          `SELECT b.rating, b.start_date, b.end_date, b.preferred_time, 
                  s.email as student_email, s.first_name as student_name, s.last_name as student_last, s.role as student_role,
                  t.first_name as tutor_name, t.last_name as tutor_last, t.role as tutor_role
           FROM bookings b
           JOIN users s ON b.student_id = s.user_id
           JOIN users t ON b.tutor_id = t.user_id
           WHERE b.booking_id = ?`,
          [booking_id]
        );

        if (!booking) {
          return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // If both users are tutors, require the student (tutor acting as student) to rate before completion
        if (booking.student_role && booking.tutor_role && booking.student_role.toLowerCase() === 'tutor' && booking.tutor_role.toLowerCase() === 'tutor') {
          if (!booking.rating) {
            return res.status(400).json({ success: false, error: 'The tutor acting as student must rate the session before marking as complete.' });
          }
        } else {
          // Default: require student rating before completion
          if (!booking.rating) {
            return res.status(400).json({ success: false, error: 'Student must rate the session before marking as complete.' });
          }
        }
      }
      
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

// ===== CHAT MESSAGES API ENDPOINTS =====

// Get all chat messages for a booking session
app.get('/api/sessions/:booking_id/chat', async (req, res) => {
  try {
    const booking_id = parseInt(req.params.booking_id);
    const user_id = req.query.user_id;
    
    if (!booking_id) {
      return res.status(400).json({ success: false, error: 'Valid booking_id is required' });
    }

    console.log(`Fetching chat messages for booking ${booking_id}`);
    
    const pool = await db.getPool();
    
    // First verify the user has access to this booking (either tutor or student)
    const [bookingRows] = await pool.query(
      'SELECT tutor_id, student_id, status FROM bookings WHERE booking_id = ?', 
      [booking_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const booking = bookingRows[0];
    if (user_id && booking.tutor_id !== parseInt(user_id) && booking.student_id !== parseInt(user_id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Get chat messages
    const messages = await getChatMessagesByBooking(pool, booking_id);
    
    // Mark messages as read by current user if user_id is provided
    if (user_id) {
      await markMessagesAsRead(pool, booking_id, user_id);
    }
    
    console.log(`✅ Found ${messages.length} chat messages for booking ${booking_id}`);
    
    res.json({
      success: true,
      messages: messages,
      total: messages.length
    });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Send a new chat message
app.post('/api/sessions/:booking_id/chat', async (req, res) => {
  try {
    const booking_id = parseInt(req.params.booking_id);
    const { sender_id, message } = req.body;
    
    if (!booking_id || !sender_id || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'booking_id, sender_id, and message are required' 
      });
    }

    console.log(`Creating chat message for booking ${booking_id} from user ${sender_id}`);
    
    const pool = await db.getPool();
    
    // Verify the user has access to this booking (either tutor or student)
    const [bookingRows] = await pool.query(
      'SELECT tutor_id, student_id, status FROM bookings WHERE booking_id = ?', 
      [booking_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const booking = bookingRows[0];
    if (booking.tutor_id !== sender_id && booking.student_id !== sender_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Only allow chat in accepted sessions
    if (booking.status?.toLowerCase() !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Chat is only available for accepted sessions' 
      });
    }
    
    // Get sender name
    const [userRows] = await pool.query(
      'SELECT CONCAT(first_name, " ", last_name) AS name FROM users WHERE user_id = ?', 
      [sender_id]
    );
    
    const sender_name = userRows[0]?.name || 'Unknown User';
    
    // Create the message
    const message_id = await createChatMessage(pool, {
      booking_id,
      sender_id,
      sender_name,
      message: message.trim()
    });
    
    console.log(`✅ Chat message created with ID: ${message_id}`);
    
    res.status(201).json({
      success: true,
      message_id: message_id,
      message: 'Message sent successfully'
    });
  } catch (err) {
    console.error('Error creating chat message:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get unread message count for a user in a booking
app.get('/api/sessions/:booking_id/chat/unread', async (req, res) => {
  try {
    const booking_id = parseInt(req.params.booking_id);
    const user_id = req.query.user_id;
    
    if (!booking_id || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'booking_id and user_id are required' 
      });
    }
    
    const pool = await db.getPool();
    
    // Verify user has access to this booking
    const [bookingRows] = await pool.query(
      'SELECT tutor_id, student_id FROM bookings WHERE booking_id = ?', 
      [booking_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const booking = bookingRows[0];
    if (booking.tutor_id !== parseInt(user_id) && booking.student_id !== parseInt(user_id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const unread_count = await getUnreadMessageCount(pool, booking_id, user_id);
    
    res.json({
      success: true,
      unread_count: unread_count
    });
  } catch (err) {
    console.error('Error getting unread message count:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete a chat message
app.delete('/api/sessions/:booking_id/chat/:message_id', async (req, res) => {
  try {
    const booking_id = parseInt(req.params.booking_id);
    const message_id = parseInt(req.params.message_id);
    const { user_id } = req.body;
    
    if (!booking_id || !message_id || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'booking_id, message_id, and user_id are required' 
      });
    }
    
    const pool = await db.getPool();
    
    // Delete the message (only sender can delete their own messages)
    const success = await deleteChatMessage(pool, message_id, user_id);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found or you can only delete your own messages' 
      });
    }
    
    console.log(`✅ Chat message ${message_id} deleted by user ${user_id}`);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting chat message:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Edit a chat message
app.put('/api/sessions/:booking_id/chat/:message_id', async (req, res) => {
  try {
    const booking_id = parseInt(req.params.booking_id);
    const message_id = parseInt(req.params.message_id);
    const { user_id, message } = req.body;
    
    if (!booking_id || !message_id || !user_id || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'booking_id, message_id, user_id, and message are required' 
      });
    }
    
    const pool = await db.getPool();
    
    // Update the message (only sender can edit their own messages)
    const success = await updateChatMessage(pool, message_id, user_id, message.trim());
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found or you can only edit your own messages' 
      });
    }
    
    console.log(`✅ Chat message ${message_id} updated by user ${user_id}`);
    
    res.json({
      success: true,
      message: 'Message updated successfully'
    });
  } catch (err) {
    console.error('Error updating chat message:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== POST-TEST API ENDPOINTS =====

// Get all post-tests with optional filters
app.get('/api/post-tests', async (req, res) => {
  try {
    const { tutor_id, student_id, booking_id, status } = req.query;
    
    console.log('Fetching post-tests with filters:', { tutor_id, student_id, booking_id, status });
    
    const pool = await db.getPool();
    const postTests = await getAllPostTests(pool, {
      tutor_id: tutor_id ? parseInt(tutor_id) : undefined,
      student_id: student_id ? parseInt(student_id) : undefined,
      booking_id: booking_id ? parseInt(booking_id) : undefined,
      status: status
    });
    
    console.log(`✅ Found ${postTests.length} post-tests`);
    
    res.json({
      success: true,
      postTests: postTests,
      total: postTests.length
    });
  } catch (err) {
    console.error('Error fetching post-tests:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get post-tests by tutor ID
app.get('/api/post-tests/tutor/:tutorId', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.tutorId);
    
    if (!tutorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid tutor ID is required' 
      });
    }
    
    console.log(`Fetching post-tests for tutor ${tutorId}`);
    
    const pool = await db.getPool();
    
    // Get post-tests created by this tutor with additional details
    const [postTests] = await pool.query(`
      SELECT 
        pt.post_test_id as id,
        pt.booking_id,
        pt.tutor_id,
        pt.student_id,
        pt.title,
        pt.description,
        pt.subject_id,
        pt.subject_name,
        pt.total_questions,
        pt.time_limit,
        pt.passing_score,
        pt.status,
        pt.created_at,
        pt.published_at,
        pt.completed_at,
        s.subject_name,
        s.subject_code,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        DATE_FORMAT(b.start_date, '%Y-%m-%d %H:%i') as session_date,
        (SELECT COUNT(*) FROM post_test_questions WHERE post_test_id = pt.post_test_id) as question_count
      FROM post_tests pt
      LEFT JOIN subjects s ON pt.subject_id = s.subject_id
      LEFT JOIN users u ON pt.student_id = u.user_id
      LEFT JOIN bookings b ON pt.booking_id = b.booking_id
      WHERE pt.tutor_id = ?
      ORDER BY pt.created_at DESC
    `, [tutorId]);
    
    console.log(`✅ Found ${postTests.length} post-tests for tutor ${tutorId}`);
    
    res.json({
      success: true,
      postTests: postTests,
      total: postTests.length
    });
  } catch (err) {
    console.error('Error fetching tutor post-tests:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get post-tests by student ID (available for student to take)
app.get('/api/post-tests/student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid student ID is required' 
      });
    }
    
    console.log(`Fetching available post-tests for student ${studentId}`);
    
    const pool = await db.getPool();
    
    // Get post-tests available for this student (approved and not completed)
    const [postTests] = await pool.query(`
      SELECT 
        pt.post_test_id as id,
        pt.booking_id,
        pt.tutor_id,
        pt.student_id,
        pt.title,
        pt.description,
        pt.subject_id,
        pt.subject_name,
        pt.total_questions,
        pt.time_limit,
        pt.passing_score,
        pt.status,
        pt.created_at,
        pt.published_at,
        pt.completed_at,
        s.subject_name,
        s.subject_code,
        CONCAT(tu.first_name, ' ', tu.last_name) as tutor_name,
        DATE_FORMAT(b.start_date, '%Y-%m-%d %H:%i') as session_date,
        (SELECT COUNT(*) FROM post_test_questions WHERE post_test_id = pt.post_test_id) as question_count,
        CASE 
          WHEN pt.completed_at IS NULL THEN 'available'
          ELSE 'completed'
        END as test_status
      FROM post_tests pt
      LEFT JOIN subjects s ON pt.subject_id = s.subject_id
      LEFT JOIN users tu ON pt.tutor_id = tu.user_id
      LEFT JOIN bookings b ON pt.booking_id = b.booking_id
      WHERE pt.student_id = ? AND pt.status = 'published'
      ORDER BY 
        CASE WHEN pt.completed_at IS NULL THEN 0 ELSE 1 END,
        pt.created_at DESC
    `, [studentId]);
    
    console.log(`✅ Found ${postTests.length} post-tests for student ${studentId}`);
    
    res.json({
      success: true,
      postTests: postTests,
      total: postTests.length
    });
  } catch (err) {
    console.error('Error fetching student post-tests:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get post-test by ID
app.get('/api/post-tests/:id', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    
    if (!postTestId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post-test ID is required' 
      });
    }
    
    console.log(`Fetching post-test ${postTestId}`);
    
    const pool = await db.getPool();
    const postTest = await getPostTestById(pool, postTestId);
    
    if (!postTest) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post-test not found' 
      });
    }
    
    // Also get questions for the post-test
    const questions = await getQuestionsByPostTestId(pool, postTestId);
    
    console.log(`✅ Found post-test ${postTestId} with ${questions.length} questions`);
    
    res.json({
      success: true,
      postTest: postTest,
      questions: questions
    });
  } catch (err) {
    console.error('Error fetching post-test:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create a new post-test (supports session-specific or reusable template submissions)
app.post('/api/post-tests', async (req, res) => {
  try {
    const { booking_id, tutor_id, student_id, title, description, subject_id, subject_name, time_limit, passing_score, questions } = req.body;

    console.log('Creating new pending post-test (template-aware):', req.body);

    // Validate required fields: tutor_id and title are mandatory. booking_id/student_id are optional for template submissions.
    if (!tutor_id || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'tutor_id and title are required' 
      });
    }

    const pool = await db.getPool();

    // If booking_id is provided, verify booking exists and tutor has access
    let booking = null;
    if (booking_id) {
      const [bookingRows] = await pool.query(
        'SELECT tutor_id, student_id, status FROM bookings WHERE booking_id = ?', 
        [booking_id]
      );
      if (bookingRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      booking = bookingRows[0];
      if (booking.tutor_id !== tutor_id) {
        return res.status(403).json({ success: false, error: 'Only the session tutor can create post-tests for this booking' });
      }
    }

    // Prevent duplicate post-tests
    if (booking_id) {
      const existingPostTests = await getAllPostTests(pool, { booking_id });
      const existingPendingPostTests = await getAllPendingPostTests(pool);
      const hasPendingForBooking = existingPendingPostTests.some(pt => pt.booking_id === booking_id);

      if (existingPostTests.length > 0) {
        // Return the existing post-test instead of conflict
        return res.status(200).json({
          success: true,
          message: 'A post-test already exists for this session',
          postTests: existingPostTests
        });
      }

      if (hasPendingForBooking) {
        // Find the pending post-test for this booking and attach questions if provided
        const existingPendingPostTests = await getAllPendingPostTests(pool);
        const pendingForBooking = existingPendingPostTests.find(pt => pt.booking_id === booking_id);
        if (pendingForBooking) {
          if (questions && Array.isArray(questions) && questions.length > 0) {
            await createPendingPostTestQuestions(pool, pendingForBooking.pending_post_test_id, questions);
            await updatePendingPostTestQuestionCount(pool, pendingForBooking.pending_post_test_id);
          }
          const updated = await getPendingPostTestById(pool, pendingForBooking.pending_post_test_id);
          return res.status(200).json({
            success: true,
            message: 'A pending post-test already exists for this session; questions have been merged',
            postTest: updated
          });
        }
      }
    } else {
      // For template submissions (no booking_id), avoid duplicate pending/template by same tutor and title
      const [duplicatePending] = await pool.query(
        'SELECT pending_post_test_id FROM pending_post_tests WHERE tutor_id = ? AND title = ? AND status = "pending" LIMIT 1',
        [tutor_id, title]
      );
      if (duplicatePending.length > 0) {
        // Attach questions to the existing pending template if provided
        const pendingId = duplicatePending[0].pending_post_test_id;
        if (questions && Array.isArray(questions) && questions.length > 0) {
          await createPendingPostTestQuestions(pool, pendingId, questions);
          await updatePendingPostTestQuestionCount(pool, pendingId);
        }
        const existing = await getPendingPostTestById(pool, pendingId);
        return res.status(200).json({ success: true, message: 'A similar pending template already exists; questions have been merged', postTest: existing });
      }
      const [duplicateTemplate] = await pool.query(
        'SELECT template_id FROM post_test_templates WHERE tutor_id = ? AND title = ? AND is_active = 1 LIMIT 1',
        [tutor_id, title]
      );
      if (duplicateTemplate.length > 0) {
        // Return the existing template
        const templateId = duplicateTemplate[0].template_id;
        const template = await getTemplateById(templateId);
        return res.status(200).json({ success: true, message: 'A template with the same title already exists', template });
      }
    }

    // Create the pending post-test (supports NULL booking_id/student_id)
    const pendingPostTest = await createPendingPostTest(pool, {
      booking_id: booking_id ? parseInt(booking_id) : null,
      tutor_id: parseInt(tutor_id),
      student_id: student_id ? parseInt(student_id) : null,
      title,
      description,
      subject_id: subject_id ? parseInt(subject_id) : null,
      subject_name,
      time_limit,
      passing_score
    });

    // Add questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const createdQuestions = await createPendingPostTestQuestions(pool, pendingPostTest.pending_post_test_id, questions);
      await updatePendingPostTestQuestionCount(pool, pendingPostTest.pending_post_test_id);
    }

    // Send notification to assigned faculty for review (based on subject)
    try {
      const subject = await getSubjectById(pool, pendingPostTest.subject_id);
      if (subject && subject.user_id) {
        let facultyIds = [];
        try {
          facultyIds = JSON.parse(subject.user_id);
          if (!Array.isArray(facultyIds)) {
            facultyIds = [facultyIds];
          }
        } catch {
          facultyIds = [subject.user_id];
        }
        for (const facultyId of facultyIds) {
          const faculty = await findUserById(pool, facultyId);
          if (faculty && faculty.role === 'Faculty') {
            // Send email notification to faculty
            await sendFacultyNewApplicationNotificationEmail(
              faculty.email,
              `${faculty.first_name} ${faculty.last_name}`,
              `Tutor Post-Test Pending Review`,
              subject.subject_name,
              subject.subject_code
            );
          }
        }
      }
    } catch (facultyEmailError) {
      console.error('Error sending faculty notification for pending post test:', facultyEmailError);
    }

    res.status(201).json({
      success: true,
      message: 'Post-test submitted for faculty review. Faculty have been notified.',
      postTest: pendingPostTest
    });
  } catch (err) {
    console.error('Error creating pending post-test:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update post-test
app.put('/api/post-tests/:id', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    const { title, description, time_limit, passing_score, status, tutor_id } = req.body;
    
    if (!postTestId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post-test ID is required' 
      });
    }
    
    console.log(`Updating post-test ${postTestId}:`, req.body);
    
    const pool = await db.getPool();
    
    // Verify the post-test exists and user has permission
    const postTest = await getPostTestById(pool, postTestId);
    if (!postTest) {
      return res.status(404).json({ success: false, error: 'Post-test not found' });
    }
    
    if (tutor_id && postTest.tutor_id !== tutor_id) {
      return res.status(403).json({ success: false, error: 'Only the creator can update this post-test' });
    }
    
    // Update the post-test
    const success = await updatePostTest(pool, postTestId, {
      title,
      description,
      time_limit,
      passing_score,
      status
    });
    
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to update post-test' });
    }
    
    console.log(`✅ Post-test ${postTestId} updated successfully`);
    
    res.json({
      success: true,
      message: 'Post-test updated successfully'
    });
  } catch (err) {
    console.error('Error updating post-test:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Publish post-test
app.put('/api/post-tests/:id/publish', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    const { tutor_id } = req.body;
    
    if (!postTestId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post-test ID is required' 
      });
    }
    
    console.log(`Publishing post-test ${postTestId}`);
    
    const pool = await db.getPool();
    
    // Verify the post-test exists and user has permission
    const postTest = await getPostTestById(pool, postTestId);
    if (!postTest) {
      return res.status(404).json({ success: false, error: 'Post-test not found' });
    }
    
    if (tutor_id && postTest.tutor_id !== tutor_id) {
      return res.status(403).json({ success: false, error: 'Only the creator can publish this post-test' });
    }
    
    // Publish the post-test
    const success = await publishPostTest(pool, postTestId);
    
    if (!success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot publish post-test. Make sure it has questions.' 
      });
    }
    
    console.log(`✅ Post-test ${postTestId} published successfully`);
    
    res.json({
      success: true,
      message: 'Post-test published successfully'
    });
  } catch (err) {
    console.error('Error publishing post-test:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete post-test
app.delete('/api/post-tests/:id', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    const { tutor_id } = req.body;
    
    if (!postTestId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post-test ID is required' 
      });
    }
    
    console.log(`Deleting post-test ${postTestId}`);
    
    const pool = await db.getPool();
    
    // Verify the post-test exists and user has permission
    const postTest = await getPostTestById(pool, postTestId);
    if (!postTest) {
      return res.status(404).json({ success: false, error: 'Post-test not found' });
    }
    
    if (tutor_id && postTest.tutor_id !== tutor_id) {
      return res.status(403).json({ success: false, error: 'Only the creator can delete this post-test' });
    }
    
    // Delete the post-test (cascades to questions and results)
    const success = await deletePostTest(pool, postTestId);
    
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to delete post-test' });
    }
    
    console.log(`✅ Post-test ${postTestId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Post-test deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting post-test:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get questions for a post-test
app.get('/api/post-tests/:id/questions', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    
    if (!postTestId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post-test ID is required' 
      });
    }
    
    const pool = await db.getPool();
    const questions = await getQuestionsByPostTestId(pool, postTestId);
    
    console.log(`✅ Found ${questions.length} questions for post-test ${postTestId}`);
    
    res.json({
      success: true,
      questions: questions,
      total: questions.length
    });
  } catch (err) {
    console.error('Error fetching post-test questions:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add questions to post-test
app.post('/api/post-tests/:id/questions', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    const { questions, tutor_id } = req.body;
    
    if (!postTestId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid post-test ID and questions array are required' 
      });
    }
    
    console.log(`Adding ${questions.length} questions to post-test ${postTestId}`);
    
    const pool = await db.getPool();
    
    // Verify the post-test exists and user has permission
    const postTest = await getPostTestById(pool, postTestId);
    if (!postTest) {
      return res.status(404).json({ success: false, error: 'Post-test not found' });
    }
    
    if (tutor_id && postTest.tutor_id !== tutor_id) {
      return res.status(403).json({ success: false, error: 'Only the creator can add questions' });
    }
    
    // Create the questions
    const createdQuestions = await createPostTestQuestions(pool, postTestId, questions);
    
    console.log(`✅ Added ${createdQuestions.length} questions to post-test ${postTestId}`);
    
    res.status(201).json({
      success: true,
      message: 'Questions added successfully',
      questions: createdQuestions
    });
  } catch (err) {
    console.error('Error adding post-test questions:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update a post-test question
app.put('/api/post-tests/questions/:questionId', async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const { question, type, options, correct_answer, points } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question ID is required' 
      });
    }
    
    console.log(`Updating post-test question ${questionId}`, { question, type, options, correct_answer, points });
    
    const pool = await db.getPool();
    
    // Update the question using correct database column names
    const updateQuery = `
      UPDATE post_test_questions 
      SET question_text = ?, 
          question_type = ?, 
          options = ?, 
          correct_answer = ?, 
          points = ?
      WHERE question_id = ?
    `;
    
    const optionsJson = options ? JSON.stringify(options) : null;
    
    await pool.query(updateQuery, [
      question,
      type,
      optionsJson,
      correct_answer,
      points,
      questionId
    ]);
    
    console.log(`✅ Updated question ${questionId}`);
    
    res.json({
      success: true,
      message: 'Question updated successfully'
    });
  } catch (err) {
    console.error('Error updating post-test question:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete a post-test question
app.delete('/api/post-tests/questions/:questionId', async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    
    if (!questionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question ID is required' 
      });
    }
    
    console.log(`Deleting post-test question ${questionId}`);
    
    const pool = await db.getPool();
    
    // Delete the question using correct column name
    const deleteQuery = 'DELETE FROM post_test_questions WHERE question_id = ?';
    await pool.query(deleteQuery, [questionId]);
    
    console.log(`✅ Deleted question ${questionId}`);
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting post-test question:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Submit post-test results
app.post('/api/post-tests/:id/submit', async (req, res) => {
  try {
    const postTestId = parseInt(req.params.id);
    const { student_id, answers, time_taken } = req.body;
    
    if (!postTestId || !student_id || !answers) {
      return res.status(400).json({ 
        success: false, 
        error: 'post-test ID, student_id, and answers are required' 
      });
    }
    
    console.log(`Submitting post-test ${postTestId} results for student ${student_id}`);
    
    const pool = await db.getPool();
    
    // Get the post-test and questions
    const postTest = await getPostTestById(pool, postTestId);
    if (!postTest) {
      return res.status(404).json({ success: false, error: 'Post-test not found' });
    }
    
    if (postTest.status !== 'published') {
      return res.status(400).json({ success: false, error: 'Post-test is not available for taking' });
    }
    
    if (postTest.student_id !== student_id) {
      return res.status(403).json({ success: false, error: 'You are not authorized to take this post-test' });
    }
    
    // Check if student already submitted
    const existingResult = await getResultByStudentAndPostTest(pool, student_id, postTestId);
    if (existingResult) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already submitted this post-test' 
      });
    }
    
    const questions = await getQuestionsByPostTestId(pool, postTestId);
    
    // Calculate score (exclude essay questions from scoring)
    let correctAnswers = 0;
    const scorableQuestions = questions.filter(q => q.question_type !== 'short_answer'); // Exclude essay questions
    const totalQuestions = scorableQuestions.length;
    
    // Convert answers array to object for easier lookup
    const answersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach(ans => {
        answersMap[ans.question_id] = ans.answer;
      });
    } else {
      // Handle case where answers is already an object
      Object.assign(answersMap, answers);
    }
    
    console.log('All Questions:', questions.map(q => ({ id: q.question_id, type: q.question_type, correct: q.correct_answer })));
    console.log('Scorable Questions (excluding essays):', scorableQuestions.map(q => ({ id: q.question_id, type: q.question_type, correct: q.correct_answer })));
    console.log('Student answers:', answersMap);
    
    scorableQuestions.forEach(question => {
      const studentAnswer = answersMap[question.question_id];
      const correctAnswer = question.correct_answer;
      
      console.log(`Question ${question.question_id} (${question.question_type}): Student="${studentAnswer}", Correct="${correctAnswer}"`);
      
      if (studentAnswer && studentAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase().trim()) {
        correctAnswers++;
        console.log(`✓ Correct answer for question ${question.question_id}`);
      } else {
        console.log(`✗ Wrong answer for question ${question.question_id}`);
      }
    });
    
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const passed = score >= postTest.passing_score;
    
    // Save the result
    const result = await createPostTestResult(pool, {
      post_test_id: postTestId,
      student_id,
      booking_id: postTest.booking_id,
      answers,
      score: parseFloat(score.toFixed(2)),
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      time_taken: time_taken || null,
      passed
    });
    
    console.log(`✅ Post-test ${postTestId} submitted by student ${student_id} with score ${score.toFixed(2)}%`);
    
    res.json({
      success: true,
      message: 'Post-test submitted successfully',
      result: {
        correctAnswers,
        totalQuestions,
        percentage: parseFloat(score.toFixed(2)),
        passed,
        passingScore: postTest.passing_score,
        timeTaken: time_taken || null
      }
    });
  } catch (err) {
    console.error('Error submitting post-test:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get post-test results
app.get('/api/post-test-results', async (req, res) => {
  try {
    const { student_id, tutor_id, post_test_id, booking_id } = req.query;
    
    console.log('Fetching post-test results with filters:', { student_id, tutor_id, post_test_id, booking_id });
    
    const pool = await db.getPool();
    const results = await getAllPostTestResults(pool, {
      student_id: student_id ? parseInt(student_id) : undefined,
      tutor_id: tutor_id ? parseInt(tutor_id) : undefined,
      post_test_id: post_test_id ? parseInt(post_test_id) : undefined,
      booking_id: booking_id ? parseInt(booking_id) : undefined
    });
    
    console.log(`✅ Found ${results.length} post-test results`);
    
    res.json({
      success: true,
      results: results,
      total: results.length
    });
  } catch (err) {
    console.error('Error fetching post-test results:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== POST-TEST TEMPLATES API ENDPOINTS =====

// Get all templates for a tutor
app.get('/api/post-test-templates/tutor/:tutorId', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.tutorId);
    const postTestTemplates = require('../queries/postTestTemplates');
    
    const templates = await postTestTemplates.getTemplatesByTutor(tutorId);
    
    res.json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get template by ID with questions
app.get('/api/post-test-templates/:templateId', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const postTestTemplates = require('../queries/postTestTemplates');
    
    const template = await postTestTemplates.getTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (err) {
    console.error('Error fetching template:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create new template
app.post('/api/post-test-templates', async (req, res) => {
  // Disabled direct creation of post test templates by tutors. Post tests must go to pending_post_tests for faculty approval.
  res.status(403).json({ success: false, error: 'Direct creation of post test templates is not allowed. Please use the post-test creation workflow for tutors.' });
});

// Update template
app.put('/api/post-test-templates/:templateId', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const postTestTemplates = require('../queries/postTestTemplates');
    
    await postTestTemplates.updateTemplate(templateId, req.body);
    
    res.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (err) {
    console.error('Error updating template:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete template (soft delete)
app.delete('/api/post-test-templates/:templateId', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const postTestTemplates = require('../queries/postTestTemplates');
    
    await postTestTemplates.deleteTemplate(templateId);
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting template:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get eligible students for template assignment
app.get('/api/post-test-templates/:templateId/eligible-students', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const { tutor_id, subject_id } = req.query;
    const postTestTemplates = require('../queries/postTestTemplates');
    
    const students = await postTestTemplates.getEligibleStudents(
      parseInt(tutor_id),
      parseInt(subject_id)
    );
    
    res.json({
      success: true,
      students
    });
  } catch (err) {
    console.error('Error fetching eligible students:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Assign template to students
app.post('/api/post-test-templates/:templateId/assign', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const { student_ids, booking_ids, assigned_by, due_date } = req.body;
    const postTestTemplates = require('../queries/postTestTemplates');
    const pool = await db.getPool();
    
    // Get template details for email
    const [templateRows] = await pool.query(`
      SELECT title, subject_name, tutor_id,
             CONCAT(u.first_name, ' ', u.last_name) as tutor_name
      FROM post_test_templates ptt
      LEFT JOIN users u ON ptt.tutor_id = u.user_id
      WHERE ptt.template_id = ?
    `, [templateId]);
    
    const template = templateRows[0];
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Create assignment array
    const assignments = student_ids.map((studentId, index) => ({
      template_id: templateId,
      student_id: studentId,
      booking_id: booking_ids[index],
      assigned_by,
      due_date
    }));
    
    const result = await postTestTemplates.assignTemplate(assignments);
    
    // Send email notifications to students
    try {
      for (let i = 0; i < student_ids.length; i++) {
        const studentId = student_ids[i];
        
        // Get student details
        const [studentRows] = await pool.query(`
          SELECT first_name, last_name, email FROM users WHERE user_id = ?
        `, [studentId]);
        
        const student = studentRows[0];
        if (student) {
          await sendPostTestAssignmentEmail(
            student.email,
            `${student.first_name} ${student.last_name}`,
            template.tutor_name,
            template.title,
            template.subject_name,
            due_date
          );
          console.log(`✅ Assignment email sent to ${student.email}`);
        }
      }
      
      // Send notifications to co-tutors (other tutors in the same bookings)
      for (let i = 0; i < booking_ids.length; i++) {
        const bookingId = booking_ids[i];
        const studentId = student_ids[i];
        
        // Get co-tutors for this booking (tutors who are not the assigner)
        const [coTutorRows] = await pool.query(`
          SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.email
          FROM bookings b
          INNER JOIN users u ON (
            u.user_id IN (
              SELECT tutor_id FROM bookings WHERE user_id = b.user_id AND subject_id = b.subject_id
            )
          )
          WHERE b.booking_id = ? AND u.user_id != ? AND u.role IN ('Tutor', 'Faculty')
        `, [bookingId, assigned_by]);
        
        // Get student name for co-tutor notification
        const [studentRows] = await pool.query(`
          SELECT first_name, last_name FROM users WHERE user_id = ?
        `, [studentId]);
        
        const student = studentRows[0];
        
        for (const coTutor of coTutorRows) {
          await sendPostTestAssignmentEmailToCoTutor(
            coTutor.email,
            `${coTutor.first_name} ${coTutor.last_name}`,
            template.tutor_name,
            template.title,
            template.subject_name,
            `${student.first_name} ${student.last_name}`,
            due_date
          );
          console.log(`✅ Co-tutor notification sent to ${coTutor.email}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending assignment notification emails:', emailError);
      // Don't fail the assignment if emails fail
    }
    
    res.json({
      success: true,
      message: `Template assigned to ${result.assignments_created} student(s)`,
      assignments_created: result.assignments_created
    });
  } catch (err) {
    console.error('Error assigning template:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get assignments for a template
app.get('/api/post-test-templates/:templateId/assignments', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const postTestTemplates = require('../queries/postTestTemplates');
    
    const assignments = await postTestTemplates.getTemplateAssignments(templateId);
    
    res.json({
      success: true,
      assignments,
      total: assignments.length
    });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get assignments for a student
app.get('/api/post-test-assignments/student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const bookingId = req.query.booking_id ? parseInt(req.query.booking_id) : null;
    
    const pool = await db.getPool();
    
    let query = `
      SELECT 
        a.*,
        t.title as template_title,
        t.description as template_description,
        t.subject_id,
        t.subject_name,
        t.time_limit,
        t.passing_score,
        t.total_questions
      FROM post_test_assignments a
      JOIN post_test_templates t ON a.template_id = t.template_id
      WHERE a.student_id = ?
    `;
    
    const params = [studentId];
    
    if (bookingId) {
      query += ' AND a.booking_id = ?';
      params.push(bookingId);
    }
    
    query += ' ORDER BY a.assigned_at DESC';
    
    const [assignments] = await pool.query(query, params);
    
    res.json({
      success: true,
      assignments
    });
  } catch (err) {
    console.error('Error fetching student assignments:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get questions for a template
app.get('/api/post-test-templates/:templateId/questions', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    
    const pool = await db.getPool();
    const [rows] = await pool.query(
      'SELECT * FROM post_test_questions WHERE template_id = ? ORDER BY order_number ASC',
      [templateId]
    );
    
    // Parse JSON options for each question
    const questions = rows.map(row => ({
      ...row,
      id: row.question_id,
      options: row.options ? JSON.parse(row.options) : null
    }));
    
    res.json({
      success: true,
      questions
    });
  } catch (err) {
    console.error('Error fetching template questions:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add question to template
app.post('/api/post-test-templates/:templateId/questions', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const { questions } = req.body;
    
    const pool = await db.getPool();
    
    for (const question of questions) {
      await pool.query(
        `INSERT INTO post_test_questions (
          post_test_id, template_id, question_text, question_type, options, 
          correct_answer, points, explanation, order_number
        ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          question.question_text || question.question,
          (question.question_type || question.type).replace(/-/g, '_'),
          question.options ? JSON.stringify(question.options) : null,
          question.correct_answer,
          question.points || 1,
          question.explanation || null,
          question.order_number || 1
        ]
      );
    }
    
    // Update total_questions count
    await pool.query(
      'UPDATE post_test_templates SET total_questions = (SELECT COUNT(*) FROM post_test_questions WHERE template_id = ?) WHERE template_id = ?',
      [templateId, templateId]
    );
    
    res.json({
      success: true,
      message: 'Questions added to template'
    });
  } catch (err) {
    console.error('Error adding questions to template:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Submit template-based post-test
app.post('/api/post-test-templates/:templateId/submit', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const { assignment_id, student_id, booking_id, time_taken, answers } = req.body;
    
    const pool = await db.getPool();
    
    // Get template questions with correct answers
    const [questions] = await pool.query(
      'SELECT question_id, correct_answer, points FROM post_test_questions WHERE template_id = ?',
      [templateId]
    );
    
    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswersCount = 0;
    
    questions.forEach(question => {
      totalPoints += question.points || 1;
      const userAnswer = answers.find((a) => a.question_id === question.question_id);
      
      if (userAnswer && userAnswer.answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()) {
        earnedPoints += question.points || 1;
        correctAnswersCount++;
      }
    });
    
    const totalQuestions = questions.length;
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    
    // Get template passing score
    const [templateData] = await pool.query(
      'SELECT passing_score FROM post_test_templates WHERE template_id = ?',
      [templateId]
    );
    const passingScore = templateData[0]?.passing_score || 70;
    const passed = percentage >= passingScore;
    
    // Insert result into post_test_results
    const [resultInsert] = await pool.query(
      `INSERT INTO post_test_results (
        post_test_id, template_id, assignment_id, student_id, booking_id,
        answers, score, total_questions, correct_answers, passed, time_taken, 
        started_at, completed_at
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        templateId, 
        assignment_id, 
        student_id, 
        booking_id, 
        JSON.stringify(answers),
        percentage,
        totalQuestions,
        correctAnswersCount,
        passed,
        time_taken
      ]
    );
    
    const resultId = resultInsert.insertId;
    
    // Update assignment status
    await pool.query(
      `UPDATE post_test_assignments 
       SET status = 'completed', completed_at = NOW() 
       WHERE assignment_id = ?`,
      [assignment_id]
    );
    
    // Return result
    res.json({
      success: true,
      result: {
        result_id: resultId,
        score: percentage,
        total_points: totalPoints,
        percentage: percentage,
        passed: passed,
        passing_score: passingScore,
        correctAnswers: correctAnswersCount,
        totalQuestions: totalQuestions
      }
    });
  } catch (err) {
    console.error('Error submitting template test:', err);
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
    
    // Log raw forum data to debug
    console.log('📋 Fetching forums, total count:', forums.length);
    if (forums.length > 0) {
      console.log('Sample forum (first):', {
        forum_id: forums[0].forum_id,
        created_at: forums[0].created_at,
        updated_at: forums[0].updated_at,
        is_edited: forums[0].is_edited,
        is_edited_type: typeof forums[0].is_edited
      });
    }
    
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
    
    console.log('✅ Transformed forums being sent to client');
    
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

// Update a forum
app.put('/api/forums/:id', async (req, res) => {
  try {
    const pool = await db.getPool();
    const forum_id = req.params.id;
    const { title, topic, subject_id, user_id } = req.body;
    
    // Check if user has permission to edit
    const forum = await getForumById(pool, forum_id);
    if (!forum) {
      return res.status(404).json({ success: false, error: 'Forum not found' });
    }
    
    // Get user role
    const [userRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [user_id]);
    const userRole = userRows[0]?.role?.toLowerCase();
    
    // Only allow creator or admin to edit
    if (forum.created_by !== parseInt(user_id) && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied. Only the creator or admin can edit this post.' });
    }
    
    const success = await updateForum(pool, forum_id, { title, topic, subject_id });
    if (success) {
      // Log the update for debugging
      console.log(`✅ Forum ${forum_id} updated successfully`);
      
      // Fetch the updated forum to return the latest data
      const updatedForum = await getForumById(pool, forum_id);
      console.log('Updated forum data:', {
        forum_id: updatedForum.forum_id,
        created_at: updatedForum.created_at,
        updated_at: updatedForum.updated_at,
        is_edited: updatedForum.updated_at > updatedForum.created_at ? 1 : 0
      });
      
      res.json({ 
        success: true, 
        message: 'Forum updated successfully',
        forum: updatedForum 
      });
    } else {
      res.status(404).json({ success: false, error: 'Forum not found' });
    }
  } catch (err) {
    console.error('Error updating forum:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete a forum
app.delete('/api/forums/:id', async (req, res) => {
  try {
    const pool = await db.getPool();
    const forum_id = req.params.id;
    const user_id = req.query.user_id;
    
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    // Check if user has permission to delete
    const forum = await getForumById(pool, forum_id);
    if (!forum) {
      return res.status(404).json({ success: false, error: 'Forum not found' });
    }
    
    // Get user role
    const [userRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [user_id]);
    const userRole = userRows[0]?.role?.toLowerCase();
    
    // Only allow creator or admin to delete
    if (forum.created_by !== parseInt(user_id) && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied. Only the creator or admin can delete this post.' });
    }
    
    const success = await deleteForum(pool, forum_id);
    if (success) {
      res.json({ success: true, message: 'Forum deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Forum not found' });
    }
  } catch (err) {
    console.error('Error deleting forum:', err);
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

// ===== PROFANITY VIOLATION ENDPOINTS =====

// Log a profanity violation attempt
app.post('/api/profanity-violations', async (req, res) => {
  try {
    const pool = await db.getPool();
    const violationData = {
      user_id: req.body.user_id,
      context_type: req.body.context_type || 'general',
      context_id: req.body.context_id || null,
      attempted_content: req.body.attempted_content,
      detected_words: req.body.detected_words || [],
      user_ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      severity: req.body.severity || 'medium'
    };

    const violationId = await logProfanityViolation(pool, violationData);
    
    res.json({ 
      success: true, 
      violation_id: violationId,
      message: 'Profanity violation logged successfully' 
    });
  } catch (err) {
    console.error('Error logging profanity violation:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get profanity violations for a specific user
app.get('/api/profanity-violations/user/:userId', async (req, res) => {
  try {
    const pool = await db.getPool();
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const violations = await getUserViolations(pool, userId, limit, offset);
    const violationCount = await getUserViolationCount(pool, userId);

    res.json({ 
      success: true, 
      violations,
      total_count: violationCount,
      limit,
      offset
    });
  } catch (err) {
    console.error('Error fetching user violations:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get violation count for a user
app.get('/api/profanity-violations/user/:userId/count', async (req, res) => {
  try {
    const pool = await db.getPool();
    const userId = req.params.userId;
    const timeframe = req.query.timeframe || 'all'; // day, week, month, all

    const violationCount = await getUserViolationCount(pool, userId, timeframe);

    res.json({ 
      success: true, 
      user_id: userId,
      timeframe,
      violation_count: violationCount
    });
  } catch (err) {
    console.error('Error fetching user violation count:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin endpoint: Get all profanity violations
app.get('/api/admin/profanity-violations', async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper admin authentication here)
    const requestingUserId = req.query.requesting_user_id;
    if (!requestingUserId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const pool = await db.getPool();
    
    // Check if requesting user is admin
    const [userRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [requestingUserId]);
    if (!userRows[0] || userRows[0].role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const violations = await getAllViolations(pool, limit, offset);

    res.json({ 
      success: true, 
      violations,
      limit,
      offset
    });
  } catch (err) {
    console.error('Error fetching all violations:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin endpoint: Get top violators
app.get('/api/admin/profanity-violations/top-violators', async (req, res) => {
  try {
    // Check if user is admin
    const requestingUserId = req.query.requesting_user_id;
    if (!requestingUserId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const pool = await db.getPool();
    
    // Check if requesting user is admin
    const [userRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [requestingUserId]);
    if (!userRows[0] || userRows[0].role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || 'month'; // day, week, month, all

    const topViolators = await getTopViolators(pool, limit, timeframe);

    res.json({ 
      success: true, 
      top_violators: topViolators,
      timeframe,
      limit
    });
  } catch (err) {
    console.error('Error fetching top violators:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== TUTOR STATISTICS ENDPOINTS =====

// Get completed sessions count for a tutor
app.get('/api/tutors/:tutorId/sessions/completed-count', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.tutorId);
    
    if (!tutorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid tutor ID is required' 
      });
    }
    
    console.log(`Fetching completed sessions count for tutor ${tutorId}`);
    
    const pool = await db.getPool();
    
    // Count completed sessions for this tutor
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as completed_count
      FROM bookings 
      WHERE tutor_id = ? 
      AND status = 'completed'
      AND rating IS NOT NULL
      AND remarks IS NOT NULL
      AND remarks != ''
    `, [tutorId]);
    
    const completedCount = countRows[0]?.completed_count || 0;
    
    console.log(`✅ Found ${completedCount} completed sessions for tutor ${tutorId}`);
    
    res.json({
      success: true,
      tutorId: tutorId,
      completedCount: completedCount
    });
  } catch (err) {
    console.error('Error fetching tutor completed sessions count:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get comments and ratings for a tutor from completed sessions
app.get('/api/tutors/:tutorId/sessions/comments', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.tutorId);
    const { rating_filter } = req.query;
    
    if (!tutorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid tutor ID is required' 
      });
    }
    
    console.log(`Fetching session comments for tutor ${tutorId}`, rating_filter ? `with rating filter: ${rating_filter}` : '');
    
    const pool = await db.getPool();
    
    // Build query with optional rating filter
    let query = `
      SELECT 
        b.booking_id,
        b.rating,
        b.remarks as feedback,
        b.end_date as completed_at,
        CONCAT(u.first_name, ' ', u.last_name) as student_name
      FROM bookings b
      JOIN users u ON b.student_id = u.user_id
      WHERE b.tutor_id = ? 
      AND b.status = 'completed'
      AND b.rating IS NOT NULL
      AND b.remarks IS NOT NULL
      AND b.remarks != ''
    `;
    
    const queryParams = [tutorId];
    
    // Add rating filter if specified
    if (rating_filter) {
      query += ` AND b.rating = ?`;
      queryParams.push(parseInt(rating_filter));
    }
    
    query += ` ORDER BY b.end_date DESC`;
    
    const [comments] = await pool.query(query, queryParams);
    
    console.log(`✅ Found ${comments.length} session comments for tutor ${tutorId}`);
    
    res.json({
      success: true,
      tutorId: tutorId,
      comments: comments,
      total: comments.length
    });
  } catch (err) {
    console.error('Error fetching tutor session comments:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// System Feedback API Endpoints

// Create system_feedback table if it doesn't exist
app.get('/api/system-feedback/init-table', async (req, res) => {
  try {
    const pool = await db.getPool();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS system_feedback (
        feedback_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        liked_most TEXT,
        suggestions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_rating (rating),
        INDEX idx_created_at (created_at)
      )
    `;
    
    await pool.query(createTableQuery);
    console.log('System feedback table initialized successfully');
    
    res.json({ 
      success: true, 
      message: 'System feedback table initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing system feedback table:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize system feedback table' 
    });
  }
});

// Submit system feedback
app.post('/api/system-feedback', async (req, res) => {
  try {
    const { user_id, rating, liked_most, suggestions } = req.body;
    
    console.log('=== SYSTEM FEEDBACK SUBMISSION ===');
    console.log('Request body:', req.body);
    
    // Validation
    if (!user_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'User ID and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    const pool = await db.getPool();
    
    // Check if user already submitted feedback recently (within 24 hours)
    const [existingFeedback] = await pool.query(`
      SELECT feedback_id, created_at 
      FROM system_feedback 
      WHERE user_id = ? 
      AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC 
      LIMIT 1
    `, [user_id]);
    
    if (existingFeedback.length > 0) {
      return res.status(429).json({
        success: false,
        error: 'You can only submit feedback once per day. Please try again later.'
      });
    }
    
    // Insert new feedback
    const [result] = await pool.query(`
      INSERT INTO system_feedback (user_id, rating, liked_most, suggestions)
      VALUES (?, ?, ?, ?)
    `, [user_id, rating, liked_most || null, suggestions || null]);
    
    console.log('Feedback submitted successfully:', {
      feedback_id: result.insertId,
      user_id,
      rating
    });
    
    res.json({
      success: true,
      message: 'Thank you for your feedback! Your input helps us improve the platform.',
      feedback_id: result.insertId
    });
    
  } catch (error) {
    console.error('Error submitting system feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback. Please try again.'
    });
  }
});

// Get system feedback statistics (for admins)
app.get('/api/system-feedback/stats', async (req, res) => {
  try {
    // Check if user has admin role
    const userRole = req.headers['x-user-role'];
    if (!userRole || userRole.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const pool = await db.getPool();
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_feedback,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
        COUNT(CASE WHEN liked_most IS NOT NULL AND liked_most != '' THEN 1 END) as has_positive_feedback,
        COUNT(CASE WHEN suggestions IS NOT NULL AND suggestions != '' THEN 1 END) as has_suggestions
      FROM system_feedback
    `);
    
    const [recentFeedback] = await pool.query(`
      SELECT 
        sf.feedback_id,
        sf.rating,
        sf.liked_most,
        sf.suggestions,
        sf.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.role
      FROM system_feedback sf
      LEFT JOIN users u ON sf.user_id = u.user_id
      ORDER BY sf.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      stats: stats[0],
      recent_feedback: recentFeedback
    });
    
  } catch (error) {
    console.error('Error fetching system feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback statistics'
    });
  }
});

// Get user's feedback history
app.get('/api/system-feedback/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await db.getPool();
    
    const [userFeedback] = await pool.query(`
      SELECT 
        feedback_id,
        rating,
        liked_most,
        suggestions,
        created_at
      FROM system_feedback
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      feedback: userFeedback
    });
    
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user feedback'
    });
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

  const response = await fetch('https://api.cictpeerlearninghub.com/api/signup', {
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
