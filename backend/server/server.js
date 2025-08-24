const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: '../.env' })

const db = require('../dbconnection/mysql')
const { createUser, findUserByEmail, updateUser, findUserById } = require('../queries/users')
const { generateTemporaryPassword, sendWelcomeEmail, testEmailConnection } = require('../services/emailService')
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
      first_login: 1, // Self-registered users don't need to reset password
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
      specialties: application.specialties || ''
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
    
    res.status(200).json({ 
      success: true,
      message: 'Tutor application approved successfully. User role updated to Tutor.'
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
    
    res.status(200).json({ 
      success: true,
      message: 'Tutor application rejected successfully'
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
