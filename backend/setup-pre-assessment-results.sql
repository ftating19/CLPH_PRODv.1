-- Pre-Assessment Results Table
-- This table stores the results of pre-assessments taken by users

CREATE TABLE IF NOT EXISTS pre_assessment_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pre_assessment_id INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  correct_answers INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  time_taken_seconds INT DEFAULT NULL,
  started_at TIMESTAMP DEFAULT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  answers JSON DEFAULT NULL, -- Store user answers for detailed analysis
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (pre_assessment_id) REFERENCES pre_assessments(id) ON DELETE CASCADE,
  
  -- Indexes for better performance
  INDEX idx_user_id (user_id),
  INDEX idx_pre_assessment_id (pre_assessment_id),
  INDEX idx_completed_at (completed_at),
  INDEX idx_percentage (percentage),
  
  -- Unique constraint to prevent duplicate attempts (remove if multiple attempts allowed)
  UNIQUE KEY unique_user_assessment (user_id, pre_assessment_id)
);

-- Add some sample comments for documentation
ALTER TABLE pre_assessment_results COMMENT = 'Stores results of pre-assessments taken by users';