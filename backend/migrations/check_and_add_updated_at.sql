-- Quick check and migration script for forums.updated_at column
-- Run this to safely add the column if it doesn't exist

-- Step 1: Check if column exists
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'forums'
    AND COLUMN_NAME = 'updated_at';

-- If the above query returns no rows, the column doesn't exist
-- Run the commands below to add it:

-- Step 2: Add the column (safe - won't error if already exists)
ALTER TABLE forums 
ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT NULL 
COMMENT 'Timestamp of last edit' 
AFTER created_at;

-- Step 3: Add index for performance (safe - won't error if already exists)
CREATE INDEX IF NOT EXISTS idx_updated_at ON forums(updated_at);

-- Step 4: Verify the changes
DESCRIBE forums;

-- Step 5: Check a sample of data
SELECT 
    forum_id,
    title,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at IS NOT NULL AND updated_at > created_at THEN 'Edited'
        ELSE 'Original'
    END AS edit_status
FROM forums
ORDER BY created_at DESC
LIMIT 5;

-- Optional: Set updated_at to created_at for all existing posts
-- Uncomment if you want to initialize the field
-- UPDATE forums SET updated_at = created_at WHERE updated_at IS NULL;
