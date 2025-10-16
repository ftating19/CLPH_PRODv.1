-- Script to clear old pre-assessment results
-- Run this if you want to reset and retake assessments with the new format

-- WARNING: This will DELETE all existing pre-assessment results!
-- Make sure you want to do this before running

-- Option 1: Delete all results
-- DELETE FROM pre_assessment_results;

-- Option 2: Delete results for a specific user (replace 157 with actual user_id)
-- DELETE FROM pre_assessment_results WHERE user_id = 157;

-- Option 3: View current results before deleting
SELECT 
    par.id,
    par.user_id,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    pa.title as assessment_title,
    par.score,
    par.total_questions,
    par.percentage,
    par.completed_at,
    CHAR_LENGTH(par.answers) as answers_size,
    JSON_VALID(par.answers) as answers_is_valid_json
FROM pre_assessment_results par
LEFT JOIN users u ON par.user_id = u.user_id
LEFT JOIN pre_assessments pa ON par.pre_assessment_id = pa.id
ORDER BY par.completed_at DESC;

-- To clear results and allow retaking:
-- UNCOMMENT the line below to execute
-- TRUNCATE TABLE pre_assessment_results;
