-- Migration: Add updated_at column to forums table
-- This allows tracking when a forum post was last edited

-- Add updated_at column if it doesn't exist
ALTER TABLE forums 
ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT NULL AFTER created_at;

-- Add index for better query performance
ALTER TABLE forums 
ADD INDEX IF NOT EXISTS idx_updated_at (updated_at);

-- Optional: You can uncomment this if you want to set initial values
-- UPDATE forums SET updated_at = created_at WHERE updated_at IS NULL;
