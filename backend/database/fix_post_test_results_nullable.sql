-- Fix: Make post_test_id nullable in post_test_results table
-- This allows template-based results to exist without being tied to a specific post_test

ALTER TABLE post_test_results 
MODIFY COLUMN post_test_id INT NULL;

-- Verify the change
SELECT 
  COLUMN_NAME,
  IS_NULLABLE,
  COLUMN_TYPE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'post_test_results'
  AND COLUMN_NAME = 'post_test_id';
