-- Add duration_unit column to quizzes table
-- This column will store whether the original duration was entered in 'minutes' or 'hours'
-- The duration column will always store the value in minutes for consistency

ALTER TABLE quizzes 
ADD COLUMN duration_unit ENUM('minutes', 'hours') DEFAULT 'minutes' AFTER duration;

-- Update existing records to have 'minutes' as default duration unit
UPDATE quizzes SET duration_unit = 'minutes' WHERE duration_unit IS NULL;

-- Optional: You can also add an index if you plan to query by duration_unit frequently
-- CREATE INDEX idx_duration_unit ON quizzes(duration_unit);
