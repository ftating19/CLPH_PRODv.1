-- Add first_login column to users table
-- 0 = First time login (needs password reset)
-- 1 = Has already set their own password

ALTER TABLE users ADD COLUMN first_login TINYINT DEFAULT 1;

-- Update existing users to have first_login = 1 (assuming they've already set passwords)
UPDATE users SET first_login = 1 WHERE first_login IS NULL;

-- use for table migration in database 