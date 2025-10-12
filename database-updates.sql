-- Update pre_assessments table to support multiple subjects
-- First, backup the existing data if needed

-- Add new column for multiple subject IDs (as JSON)
ALTER TABLE pre_assessments ADD COLUMN subject_ids JSON;

-- Migrate existing single subject_id to the new subject_ids JSON array
UPDATE pre_assessments 
SET subject_ids = JSON_ARRAY(subject_id) 
WHERE subject_id IS NOT NULL;

-- You can optionally drop the old subject_id column after migration
-- ALTER TABLE pre_assessments DROP COLUMN subject_id;

-- Or keep it for backward compatibility and set a default
-- ALTER TABLE pre_assessments MODIFY COLUMN subject_id INT NULL;

-- Create a view to easily get subject names for pre-assessments
CREATE OR REPLACE VIEW pre_assessments_with_subjects AS
SELECT 
    pa.*,
    GROUP_CONCAT(s.subject_name SEPARATOR ', ') as subject_names,
    GROUP_CONCAT(s.subject_code SEPARATOR ', ') as subject_codes
FROM pre_assessments pa
LEFT JOIN subjects s ON JSON_CONTAINS(pa.subject_ids, CAST(s.subject_id AS JSON))
GROUP BY pa.id;

-- Add indexes for better performance
CREATE INDEX idx_pre_assessments_subject_ids ON pre_assessments((CAST(subject_ids AS CHAR(255))));