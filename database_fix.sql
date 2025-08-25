-- COMPREHENSIVE DATABASE FIXES FOR QUIZ SYSTEM
-- Run these commands in your MySQL database

-- 1. First, let's check what columns currently exist in the quizzes table
-- DESCRIBE quizzes;

-- 2. Add subject_name column if it doesn't exist
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) AFTER subject_id;

-- 3. Add duration_unit column if it doesn't exist
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS duration_unit VARCHAR(10) DEFAULT 'minutes' AFTER duration;

-- 4. Update existing records to populate subject_name from subjects table
UPDATE quizzes q
INNER JOIN subjects s ON q.subject_id = s.subject_id
SET q.subject_name = s.subject_name
WHERE q.subject_name IS NULL OR q.subject_name = '';

-- 5. Update existing records to have 'minutes' as default duration unit
UPDATE quizzes SET duration_unit = 'minutes' WHERE duration_unit IS NULL OR duration_unit = '';

-- 6. Ensure all foreign key relationships are correct
-- Check if subject_id in quizzes table properly references subjects table
-- ALTER TABLE quizzes ADD CONSTRAINT fk_quiz_subject 
-- FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE;

-- 7. Check current structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'quizzes'
ORDER BY ORDINAL_POSITION;

-- 8. Test query to verify everything works
SELECT 
    q.quizzes_id,
    q.title,
    q.subject_id,
    q.subject_name,
    q.duration,
    q.duration_unit,
    s.subject_name as subjects_subject_name
FROM quizzes q
LEFT JOIN subjects s ON q.subject_id = s.subject_id
LIMIT 5;
