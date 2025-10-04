-- Check the structure of pending tables to see actual column names

DESCRIBE pending_quizzes;

DESCRIBE pending_flashcards;

-- Show sample data to understand the structure
SELECT * FROM pending_quizzes LIMIT 1;
SELECT * FROM pending_flashcards LIMIT 1;
