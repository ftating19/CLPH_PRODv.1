-- Create flashcardprogress table to track user progress on flashcards
CREATE TABLE IF NOT EXISTS flashcardprogress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    flashcard_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('completed', 'in_progress', 'not_started') DEFAULT 'not_started',
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(flashcard_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Unique constraint to ensure one progress record per user per flashcard
    UNIQUE KEY unique_user_flashcard (user_id, flashcard_id),
    
    -- Indexes for better performance
    INDEX idx_flashcard_id (flashcard_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
