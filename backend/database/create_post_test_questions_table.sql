CREATE TABLE IF NOT EXISTS post_test_questions (
  question_id INT PRIMARY KEY AUTO_INCREMENT,
  post_test_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL,
  options JSON,
  correct_answer TEXT NOT NULL,
  points INT DEFAULT 1,
  explanation TEXT,
  order_number INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_test_id) REFERENCES post_tests(post_test_id) ON DELETE CASCADE,
  INDEX idx_post_test_id (post_test_id),
  INDEX idx_order_number (order_number)
);