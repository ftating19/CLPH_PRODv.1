-- Create pendingmaterials table if it doesn't exist
CREATE TABLE IF NOT EXISTS pendingmaterials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) DEFAULT 'General',
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) DEFAULT 'PDF',
  file_size BIGINT DEFAULT 0,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  download_count INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  view_count INT DEFAULT 0,
  INDEX idx_status (status),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_subject (subject),
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Add missing columns to pendingmaterials table if they don't exist
ALTER TABLE pendingmaterials 
  ADD COLUMN IF NOT EXISTS subject VARCHAR(100) DEFAULT 'General' AFTER description,
  ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0 AFTER file_type;

-- Create studymaterials table if it doesn't exist (for approved materials)
CREATE TABLE IF NOT EXISTS studymaterials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) DEFAULT 'General',
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) DEFAULT 'PDF',
  file_size BIGINT DEFAULT 0,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  download_count INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  view_count INT DEFAULT 0,
  INDEX idx_status (status),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_subject (subject),
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Add missing columns to studymaterials table if they don't exist
ALTER TABLE studymaterials 
  ADD COLUMN IF NOT EXISTS subject VARCHAR(100) DEFAULT 'General' AFTER description,
  ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0 AFTER file_type;
