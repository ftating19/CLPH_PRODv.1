-- Fix: Make post_test_id nullable in post_test_questions table
-- This allows template questions to exist without being tied to a specific post_test

ALTER TABLE post_test_questions 
MODIFY COLUMN post_test_id INT NULL;

-- Verify the change
SELECT 
  COLUMN_NAME,
  IS_NULLABLE,
  COLUMN_TYPE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'post_test_questions'
  AND COLUMN_NAME = 'post_test_id';
