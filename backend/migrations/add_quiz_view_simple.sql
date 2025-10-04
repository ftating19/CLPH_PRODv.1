-- Simple SQL to add quiz_view column to quizzes table
-- Run this if you get an error about the quiz_view column not existing

-- Add quiz_view column with default value 'Personal'
ALTER TABLE quizzes ADD COLUMN quiz_view VARCHAR(20) DEFAULT 'Personal' AFTER program;

-- Verify the column was added
DESCRIBE quizzes;

-- Optional: Update existing quizzes to have 'Personal' view
UPDATE quizzes SET quiz_view = 'Personal' WHERE quiz_view IS NULL;
