-- Migration: Make booking_id and student_id nullable in pending_post_tests
-- Adjust FK constraints to ON DELETE SET NULL to allow template submissions

SET autocommit=0;
START TRANSACTION;

-- Drop existing foreign keys if they exist
ALTER TABLE pending_post_tests
  DROP FOREIGN KEY IF EXISTS fk_pending_post_test_booking;

ALTER TABLE pending_post_tests
  DROP FOREIGN KEY IF EXISTS fk_pending_post_test_student;

-- Modify columns to be nullable
ALTER TABLE pending_post_tests
  MODIFY COLUMN booking_id INT NULL,
  MODIFY COLUMN student_id INT NULL;

-- Recreate foreign keys with ON DELETE SET NULL
ALTER TABLE pending_post_tests
  ADD CONSTRAINT fk_pending_post_test_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_pending_post_test_student FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE SET NULL;

COMMIT;
SET autocommit=1;

-- Note: If your MySQL version does not support DROP FOREIGN KEY IF EXISTS, you may need to lookup the actual constraint names
-- and drop them explicitly. Always backup the database before running migrations.
