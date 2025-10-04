-- Migration: Add status column to pending_quizzes and pending_flashcards tables
-- Date: 2025-10-04
-- Description: Adds status column (pending, approved, rejected) to pending tables

-- Add status column to pending_quizzes table
ALTER TABLE pending_quizzes 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL
AFTER created_by;

-- Add status column to pending_flashcards table  
ALTER TABLE pending_flashcards 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL
AFTER created_by;

-- Update existing records to have 'pending' status
UPDATE pending_quizzes SET status = 'pending' WHERE status IS NULL OR status = '';
UPDATE pending_flashcards SET status = 'pending' WHERE status IS NULL OR status = '';

-- Verify the changes
SELECT 'pending_quizzes table updated' AS message;
SELECT 'pending_flashcards table updated' AS message;
