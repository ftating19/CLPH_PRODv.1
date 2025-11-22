-- Add class card image field to tutor applications table
ALTER TABLE tutorapplications 
ADD COLUMN class_card_image_url VARCHAR(500) NULL AFTER specialties;

-- Add index for faster queries
CREATE INDEX idx_tutorapplications_image ON tutorapplications(class_card_image_url);
