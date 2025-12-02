-- Create table to log profanity violation attempts
CREATE TABLE IF NOT EXISTS profanity_violations (
  violation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  context_type ENUM('forum_post', 'forum_comment', 'chat_message', 'general') NOT NULL DEFAULT 'general',
  context_id INT NULL, -- foreign key reference (forum_id, comment_id, etc.)
  attempted_content TEXT NOT NULL, -- the content that contained profanity
  detected_words JSON, -- array of profane words detected
  violation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_ip VARCHAR(45) NULL, -- for additional tracking
  user_agent TEXT NULL, -- for additional tracking
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  
  INDEX idx_user_violations (user_id),
  INDEX idx_context (context_type, context_id),
  INDEX idx_timestamp (violation_timestamp),
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);