-- Add subject_id and subject_name to bookings table if not present
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS subject_id INT NULL,
  ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) NULL;
