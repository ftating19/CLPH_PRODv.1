-- ====================================================================
-- PRE-ASSESSMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- Multiple Subjects Support with Backward Compatibility
-- ====================================================================

-- Option 1: If creating tables from scratch
-- ====================================================================

-- 1. Create pre_assessments table (new installation)
CREATE TABLE IF NOT EXISTS pre_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject_ids JSON NULL,                    -- Multiple subject IDs as JSON array [123, 456, 789]
    subject_id INT NULL,                      -- Keep for backward compatibility
    description TEXT,
    created_by INT NOT NULL,
    program VARCHAR(100),
    year_level VARCHAR(20),
    duration INT DEFAULT 30,
    duration_unit VARCHAR(20) DEFAULT 'minutes',
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Option 2: If updating existing pre_assessments table
-- ====================================================================
-- Uncomment and run these if you already have a pre_assessments table:

-- -- Add the new subject_ids column to existing table
-- ALTER TABLE pre_assessments ADD COLUMN subject_ids JSON NULL AFTER title;
-- 
-- -- Migrate existing single subject_id to JSON array format
-- UPDATE pre_assessments 
-- SET subject_ids = JSON_ARRAY(subject_id) 
-- WHERE subject_id IS NOT NULL AND subject_ids IS NULL;
-- 
-- -- Make subject_id nullable for flexibility
-- ALTER TABLE pre_assessments MODIFY COLUMN subject_id INT NULL;

-- ====================================================================
-- PRE-ASSESSMENT QUESTIONS TABLE
-- ====================================================================

-- 2. Create pre_assessment_questions table
CREATE TABLE IF NOT EXISTS pre_assessment_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pre_assessment_id INT NOT NULL,
    question_type ENUM('multiple-choice', 'true-false', 'enumeration', 'essay') NOT NULL,
    question TEXT NOT NULL,
    options JSON NULL,                        -- For multiple-choice options: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pre_assessment_id) REFERENCES pre_assessments(id) ON DELETE CASCADE
);

-- ====================================================================
-- USEFUL DATABASE VIEW
-- ====================================================================

-- 3. Create comprehensive view for pre-assessments with all related data
CREATE OR REPLACE VIEW pre_assessments_with_subjects AS
SELECT 
    pa.id,
    pa.title,
    pa.subject_ids,
    pa.subject_id,
    pa.description,
    pa.created_by,
    pa.program,
    pa.year_level,
    pa.duration,
    pa.duration_unit,
    pa.difficulty,
    pa.status,
    pa.created_at,
    pa.updated_at,
    -- Get subject names for multiple subjects
    GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name SEPARATOR ', ') as subject_names,
    GROUP_CONCAT(DISTINCT s.subject_code ORDER BY s.subject_code SEPARATOR ', ') as subject_codes,
    GROUP_CONCAT(DISTINCT s.subject_id ORDER BY s.subject_id SEPARATOR ', ') as all_subject_ids,
    -- Get creator information
    CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
    u.first_name as creator_first_name,
    u.last_name as creator_last_name,
    u.role as creator_role,
    -- Count questions
    COUNT(DISTINCT q.id) as question_count,
    -- Calculate total points
    COALESCE(SUM(DISTINCT q.points), 0) as total_points
FROM pre_assessments pa
LEFT JOIN subjects s ON (
    -- Handle both JSON array and single subject_id
    (pa.subject_ids IS NOT NULL AND JSON_CONTAINS(pa.subject_ids, CAST(s.subject_id AS JSON))) OR
    (pa.subject_ids IS NULL AND pa.subject_id = s.subject_id)
)
LEFT JOIN users u ON pa.created_by = u.user_id
LEFT JOIN pre_assessment_questions q ON pa.id = q.pre_assessment_id
GROUP BY pa.id, pa.title, pa.subject_ids, pa.subject_id, pa.description, pa.created_by, 
         pa.program, pa.year_level, pa.duration, pa.duration_unit, pa.difficulty, 
         pa.status, pa.created_at, pa.updated_at, u.first_name, u.last_name, u.role;

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================

-- 4. Add comprehensive indexes for optimal performance
-- Pre-assessments indexes
CREATE INDEX IF NOT EXISTS idx_pre_assessments_subject_id ON pre_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_created_by ON pre_assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_program ON pre_assessments(program);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_year_level ON pre_assessments(year_level);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_status ON pre_assessments(status);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_difficulty ON pre_assessments(difficulty);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_created_at ON pre_assessments(created_at);

-- JSON field indexing for subject_ids queries
CREATE INDEX IF NOT EXISTS idx_pre_assessments_subject_ids ON pre_assessments((CAST(subject_ids AS CHAR(255))));

-- Pre-assessment questions indexes
CREATE INDEX IF NOT EXISTS idx_pre_assessment_questions_pre_assessment_id ON pre_assessment_questions(pre_assessment_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessment_questions_type ON pre_assessment_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_pre_assessment_questions_points ON pre_assessment_questions(points);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pre_assessments_program_year ON pre_assessments(program, year_level);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_status_created ON pre_assessments(status, created_at);

-- ====================================================================
-- SAMPLE DATA AND EXAMPLE QUERIES
-- ====================================================================

-- Example JSON data structures:
-- Single subject: {"subject_ids": [123]}
-- Multiple subjects: {"subject_ids": [123, 456, 789]}

-- Example queries you can run:

-- 1. Get all pre-assessments with their complete information:
-- SELECT * FROM pre_assessments_with_subjects ORDER BY created_at DESC;

-- 2. Get pre-assessments for specific program and year:
-- SELECT * FROM pre_assessments_with_subjects 
-- WHERE program = 'BSIT' AND year_level = '2nd Year';

-- 3. Get pre-assessments that include a specific subject (subject_id = 123):
-- SELECT * FROM pre_assessments_with_subjects 
-- WHERE JSON_CONTAINS(subject_ids, '123') OR subject_id = 123;

-- 4. Count pre-assessments by program:
-- SELECT program, COUNT(*) as assessment_count 
-- FROM pre_assessments 
-- GROUP BY program 
-- ORDER BY assessment_count DESC;

-- 5. Get pre-assessments with question count and total points:
-- SELECT id, title, subject_names, question_count, total_points, difficulty
-- FROM pre_assessments_with_subjects 
-- WHERE status = 'active'
-- ORDER BY created_at DESC;

-- 6. Find pre-assessments by multiple subjects:
-- SELECT * FROM pre_assessments_with_subjects 
-- WHERE JSON_CONTAINS(subject_ids, '[123, 456]');

-- 7. Get subjects used in pre-assessments:
-- SELECT DISTINCT s.subject_id, s.subject_name, s.subject_code
-- FROM subjects s
-- JOIN pre_assessments pa ON (
--     JSON_CONTAINS(pa.subject_ids, CAST(s.subject_id AS JSON)) OR
--     pa.subject_id = s.subject_id
-- );

-- ====================================================================
-- DATA VALIDATION AND CONSTRAINTS
-- ====================================================================

-- Add check constraints for data validation (MySQL 8.0+)
-- ALTER TABLE pre_assessments 
-- ADD CONSTRAINT chk_duration_positive CHECK (duration > 0);

-- ALTER TABLE pre_assessments 
-- ADD CONSTRAINT chk_duration_unit CHECK (duration_unit IN ('minutes', 'hours'));

-- ALTER TABLE pre_assessment_questions 
-- ADD CONSTRAINT chk_points_positive CHECK (points > 0);

-- ====================================================================
-- BACKUP AND MIGRATION NOTES
-- ====================================================================

-- Before running any updates on existing data:
-- 1. Backup your database: mysqldump -u username -p database_name > backup.sql
-- 2. Test on a copy first
-- 3. Run migration during low-traffic periods

-- Migration strategy for existing data:
-- 1. Add new columns
-- 2. Migrate data from old format to new format  
-- 3. Update application code
-- 4. Test thoroughly
-- 5. Optionally remove old columns after confirming everything works