-- Migration: Add flashcard_view column to flashcards and pending_flashcards tables
-- Date: 2025-10-04
-- Description: Adds flashcard_view column (Personal, Public) to control visibility

-- Add flashcard_view column to flashcards table
ALTER TABLE flashcards 
ADD COLUMN flashcard_view ENUM('Personal', 'Public') DEFAULT 'Personal' NOT NULL
AFTER program;

-- Add flashcard_view column to pending_flashcards table  
ALTER TABLE pending_flashcards 
ADD COLUMN flashcard_view ENUM('Personal', 'Public') DEFAULT 'Personal' NOT NULL
AFTER program;

-- Update existing records to have 'Personal' view (default)
UPDATE flashcards SET flashcard_view = 'Personal' WHERE flashcard_view IS NULL OR flashcard_view = '';
UPDATE pending_flashcards SET flashcard_view = 'Personal' WHERE flashcard_view IS NULL OR flashcard_view = '';

-- Verify the changes
SELECT 'flashcards table updated' AS message;
SELECT 'pending_flashcards table updated' AS message;
