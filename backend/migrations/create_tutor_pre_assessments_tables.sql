-- Create table for tutor pre-assessments
CREATE TABLE IF NOT EXISTS tutor_pre_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  program VARCHAR(255) NOT NULL,
  year_level VARCHAR(50) NOT NULL,
  duration INT NOT NULL DEFAULT 30,
  duration_unit ENUM('minutes', 'hours') DEFAULT 'minutes',
  difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
  status ENUM('active', 'inactive') DEFAULT 'active',
  assessment_type VARCHAR(50) DEFAULT 'tutor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_created_by (created_by),
  INDEX idx_program (program),
  INDEX idx_status (status),
  
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create table for tutor pre-assessment questions
CREATE TABLE IF NOT EXISTS tutor_pre_assessment_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pre_assessment_id INT NOT NULL,
  subject_id INT NULL,
  question_type ENUM('multiple-choice', 'true-false', 'short-answer', 'essay') NOT NULL DEFAULT 'multiple-choice',
  question TEXT NOT NULL,
  options JSON NULL, -- For multiple choice questions
  correct_answer TEXT NOT NULL,
  explanation TEXT NULL,
  points INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_pre_assessment (pre_assessment_id),
  INDEX idx_subject (subject_id),
  
  FOREIGN KEY (pre_assessment_id) REFERENCES tutor_pre_assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL
);

-- Create table for tutor pre-assessment results
CREATE TABLE IF NOT EXISTS tutor_pre_assessment_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pre_assessment_id INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  correct_answers INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  time_taken_seconds INT NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  answers JSON NULL, -- Store detailed answers
  passed BOOLEAN DEFAULT FALSE,
  
  INDEX idx_user (user_id),
  INDEX idx_pre_assessment (pre_assessment_id),
  INDEX idx_completed_at (completed_at),
  
  UNIQUE KEY unique_user_assessment (user_id, pre_assessment_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (pre_assessment_id) REFERENCES tutor_pre_assessments(id) ON DELETE CASCADE
);