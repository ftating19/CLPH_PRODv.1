-- Add assessment result fields to tutorapplications table

ALTER TABLE tutorapplications 
ADD COLUMN assessment_result_id INT NULL,
ADD COLUMN assessment_score DECIMAL(5,2) NULL,
ADD COLUMN assessment_percentage DECIMAL(5,2) NULL,
ADD COLUMN assessment_passed BOOLEAN DEFAULT FALSE;

-- Add foreign key constraint to tutor_pre_assessment_results
-- ALTER TABLE tutorapplications 
-- ADD CONSTRAINT fk_tutorapplications_assessment_result 
-- FOREIGN KEY (assessment_result_id) REFERENCES tutor_pre_assessment_results(id);

-- Add index for better performance
ALTER TABLE tutorapplications ADD INDEX idx_assessment_result (assessment_result_id);