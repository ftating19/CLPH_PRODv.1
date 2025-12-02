-- Add subject_id column to tutor_pre_assessments table
-- This makes assessments subject-specific for faculty management

ALTER TABLE tutor_pre_assessments 
ADD COLUMN IF NOT EXISTS subject_id INT,
ADD INDEX idx_tutor_pre_assessments_subject (subject_id);

-- Add foreign key constraint if subjects table exists
-- ALTER TABLE tutor_pre_assessments 
-- ADD CONSTRAINT fk_tutor_pre_assessments_subject 
-- FOREIGN KEY (subject_id) REFERENCES subjects(id);