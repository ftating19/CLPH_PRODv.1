-- Create quiz ratings table
CREATE TABLE IF NOT EXISTS quiz_ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quizzes_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_quiz_user_rating (quiz_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create flashcard ratings table
CREATE TABLE IF NOT EXISTS flashcard_ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  flashcard_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(flashcard_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_flashcard_user_rating (flashcard_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_quiz_ratings_quiz_id ON quiz_ratings(quiz_id);
CREATE INDEX idx_quiz_ratings_user_id ON quiz_ratings(user_id);
CREATE INDEX idx_flashcard_ratings_flashcard_id ON flashcard_ratings(flashcard_id);
CREATE INDEX idx_flashcard_ratings_user_id ON flashcard_ratings(user_id);
