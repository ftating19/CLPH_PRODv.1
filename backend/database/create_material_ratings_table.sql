-- Create material_ratings table for learning resource ratings
CREATE TABLE IF NOT EXISTS material_ratings (
  rating_id INT PRIMARY KEY AUTO_INCREMENT,
  material_id INT NOT NULL,
  user_id INT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_material_user (material_id, user_id),
  FOREIGN KEY (material_id) REFERENCES studymaterials(material_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);