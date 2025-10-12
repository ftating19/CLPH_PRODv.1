-- Pre-assessments database setup script
-- Run this in your MySQL database to create the required tables

USE cplh_db;

-- Create pre_assessments table
CREATE TABLE IF NOT EXISTS pre_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject_id INT,
  description TEXT,
  created_by INT,
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
  options JSON,
  correct_answer TEXT,
  explanation TEXT,
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pre_assessment_id) REFERENCES pre_assessments(id) ON DELETE CASCADE
);

-- Insert some sample data (optional)
INSERT INTO pre_assessments (title, subject_id, description, created_by, program, year_level, difficulty) VALUES
('Programming Fundamentals Assessment', 1, 'Basic programming concepts assessment', 1, 'Bachelor of Science in Information Technology', '1st Year', 'Easy'),
('Database Systems Assessment', 2, 'Database design and SQL assessment', 1, 'Bachelor of Science in Information Technology', '2nd Year', 'Medium');

SELECT 'Pre-assessment tables created successfully!' as message;