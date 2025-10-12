-- Pre-assessments database setup script
-- Run this in your MySQL database to create the required tables

USE cplh_db;

-- Create pre_assessments table with multiple subjects support
CREATE TABLE IF NOT EXISTS pre_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject_ids JSON NULL,                    -- Multiple subject IDs as JSON array
  subject_id INT NULL,                      -- Keep for backward compatibility
  description TEXT,
  created_by INT NOT NULL,
  program VARCHAR(255),
  year_level VARCHAR(50),
  duration INT DEFAULT 30,
  duration_unit VARCHAR(20) DEFAULT 'minutes',
  difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create pre_assessment_questions table
CREATE TABLE IF NOT EXISTS pre_assessment_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pre_assessment_id INT NOT NULL,
  question_type ENUM('multiple-choice', 'true-false', 'enumeration', 'essay') NOT NULL,
  question TEXT NOT NULL,
  options JSON NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pre_assessment_id) REFERENCES pre_assessments(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pre_assessments_subject_id ON pre_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_created_by ON pre_assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_program ON pre_assessments(program);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_year_level ON pre_assessments(year_level);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_status ON pre_assessments(status);
CREATE INDEX IF NOT EXISTS idx_pre_assessment_questions_pre_assessment_id ON pre_assessment_questions(pre_assessment_id);

-- If you have existing pre_assessments table, run this to add the new column:
-- ALTER TABLE pre_assessments ADD COLUMN subject_ids JSON NULL AFTER title;

SELECT 'Pre-assessment tables created successfully!' as message;