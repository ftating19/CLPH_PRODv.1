-- Add updated_at column to chat_messages table for tracking message edits
ALTER TABLE chat_messages 
ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL;