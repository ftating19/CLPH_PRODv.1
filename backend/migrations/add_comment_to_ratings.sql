-- Migration to add comment column to existing rating tables
-- Run this if you already have quiz_ratings and flashcard_ratings tables

-- Add comment column to quiz_ratings
ALTER TABLE quiz_ratings 
ADD COLUMN comment TEXT AFTER rating;

-- Add comment column to flashcard_ratings
ALTER TABLE flashcard_ratings 
ADD COLUMN comment TEXT AFTER rating;
