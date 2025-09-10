-- Add program column to studymaterials table
ALTER TABLE studymaterials 
ADD COLUMN IF NOT EXISTS program VARCHAR(255) AFTER subject;

-- Add program column to pendingmaterials table  
ALTER TABLE pendingmaterials 
ADD COLUMN IF NOT EXISTS program VARCHAR(255) AFTER subject;

-- Update existing records to have a default program if null
UPDATE studymaterials 
SET program = 'Bachelor of Science in Computer Science' 
WHERE program IS NULL OR program = '';

UPDATE pendingmaterials 
SET program = 'Bachelor of Science in Computer Science' 
WHERE program IS NULL OR program = '';
