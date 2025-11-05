-- Migration: Make post-tests reusable across multiple students
-- This creates a template system where tutors can reuse post-tests

-- Step 1: Create post_test_templates table (the reusable post-test content)
CREATE TABLE IF NOT EXISTS post_test_templates (
  template_id INT PRIMARY KEY AUTO_INCREMENT,
  tutor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INT,
  subject_name VARCHAR(255),
  total_questions INT DEFAULT 0,
  time_limit INT DEFAULT 30,
  passing_score INT DEFAULT 70,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tutor_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_subject_id (subject_id)
);

-- Step 2: Make post_test_id nullable in post_test_questions table (for template questions)
ALTER TABLE post_test_questions 
MODIFY COLUMN post_test_id INT NULL;

-- Step 2.5: Make post_test_id nullable in post_test_results table (for template results)
ALTER TABLE post_test_results
MODIFY COLUMN post_test_id INT NULL;

-- Step 2.6: Modify post_test_questions to reference templates (only if column doesn't exist)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'post_test_questions' 
                   AND column_name = 'template_id');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE post_test_questions 
   ADD COLUMN template_id INT AFTER post_test_id,
   ADD FOREIGN KEY (template_id) REFERENCES post_test_templates(template_id) ON DELETE CASCADE,
   ADD INDEX idx_template_id (template_id)',
  'SELECT "Column template_id already exists, skipping..." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Create new post_test_assignments table (links templates to students)
CREATE TABLE IF NOT EXISTS post_test_assignments (
  assignment_id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  student_id INT NOT NULL,
  booking_id INT NOT NULL,
  assigned_by INT NOT NULL,
  status ENUM('assigned', 'in_progress', 'completed', 'expired') DEFAULT 'assigned',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  due_date TIMESTAMP NULL,
  FOREIGN KEY (template_id) REFERENCES post_test_templates(template_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_template_id (template_id),
  INDEX idx_student_id (student_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_student_template (template_id, student_id, booking_id)
);

-- Step 4: Migrate existing post_tests to templates
INSERT INTO post_test_templates (
  template_id, tutor_id, title, description, subject_id, subject_name,
  total_questions, time_limit, passing_score, created_at
)
SELECT 
  post_test_id, tutor_id, title, description, subject_id, subject_name,
  total_questions, time_limit, passing_score, created_at
FROM post_tests
WHERE status = 'draft' OR status = 'published';

-- Step 5: Update post_test_questions to use template_id
UPDATE post_test_questions pq
INNER JOIN post_tests pt ON pq.post_test_id = pt.post_test_id
SET pq.template_id = pt.post_test_id;

-- Step 6: Create assignments for existing post_tests
INSERT INTO post_test_assignments (
  template_id, student_id, booking_id, assigned_by, status, assigned_at, completed_at
)
SELECT 
  post_test_id, student_id, booking_id, tutor_id,
  CASE 
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'published' THEN 'assigned'
    ELSE 'assigned'
  END,
  created_at,
  completed_at
FROM post_tests;

-- Step 7: Update post_test_results to reference assignments (only if columns don't exist)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'post_test_results' 
                   AND column_name = 'assignment_id');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE post_test_results
   ADD COLUMN assignment_id INT AFTER result_id,
   ADD COLUMN template_id INT AFTER assignment_id',
  'SELECT "Columns assignment_id and template_id already exist, skipping..." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Populate assignment_id and template_id in post_test_results
UPDATE post_test_results ptr
INNER JOIN post_tests pt ON ptr.post_test_id = pt.post_test_id
INNER JOIN post_test_assignments pta ON pta.template_id = pt.post_test_id 
  AND pta.student_id = ptr.student_id 
  AND pta.booking_id = ptr.booking_id
SET ptr.assignment_id = pta.assignment_id,
    ptr.template_id = pt.post_test_id;

-- Step 9: Add foreign keys to post_test_results (only if they don't exist)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE table_schema = DATABASE() 
                  AND table_name = 'post_test_results' 
                  AND constraint_name LIKE '%assignment_id%');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE post_test_results
   ADD FOREIGN KEY (assignment_id) REFERENCES post_test_assignments(assignment_id) ON DELETE CASCADE,
   ADD FOREIGN KEY (template_id) REFERENCES post_test_templates(template_id) ON DELETE CASCADE,
   ADD INDEX idx_assignment_id (assignment_id),
   ADD INDEX idx_template_id (template_id)',
  'SELECT "Foreign keys already exist, skipping..." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 10: Remove old unique constraint and add new one (check if exists)
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                          WHERE table_schema = DATABASE() 
                          AND table_name = 'post_test_results' 
                          AND constraint_name = 'unique_student_test');

SET @sql = IF(@constraint_exists > 0,
  'ALTER TABLE post_test_results DROP INDEX unique_student_test',
  'SELECT "Constraint unique_student_test does not exist, skipping..." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @new_constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                              WHERE table_schema = DATABASE() 
                              AND table_name = 'post_test_results' 
                              AND constraint_name = 'unique_assignment_result');

SET @sql = IF(@new_constraint_exists = 0,
  'ALTER TABLE post_test_results ADD UNIQUE KEY unique_assignment_result (assignment_id)',
  'SELECT "Constraint unique_assignment_result already exists, skipping..." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Keep old post_tests table for now as backup
-- You can drop it later after verifying the migration worked:
-- DROP TABLE post_tests;
