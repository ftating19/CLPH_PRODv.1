-- Add quiz_view column to quizzes table
-- This migration adds the quiz_view column with default value 'Personal'

-- Check if column exists before adding it
SET @dbname = DATABASE();
SET @tablename = 'quizzes';
SET @columnname = 'quiz_view';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(20) DEFAULT 'Personal' AFTER program")
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the column was added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'quizzes'
  AND COLUMN_NAME = 'quiz_view';

-- Show sample of updated table structure
DESCRIBE quizzes;
