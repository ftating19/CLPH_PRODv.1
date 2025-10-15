-- Create pending_post_tests table for faculty approval workflow
-- Similar to post_tests but with approval status and review fields

CREATE TABLE IF NOT EXISTS `pending_post_tests` (
  `pending_post_test_id` INT NOT NULL AUTO_INCREMENT,
  `booking_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `subject_id` INT NOT NULL,
  `subject_name` VARCHAR(255) NOT NULL,
  `time_limit` INT DEFAULT 30 COMMENT 'Time limit in minutes',
  `passing_score` INT DEFAULT 70 COMMENT 'Passing score percentage',
  `total_questions` INT DEFAULT 0,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `reviewed_by` INT DEFAULT NULL COMMENT 'Faculty user_id who reviewed',
  `reviewed_at` DATETIME DEFAULT NULL,
  `comment` TEXT COMMENT 'Faculty review comments',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pending_post_test_id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_tutor_id` (`tutor_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_status` (`status`),
  KEY `idx_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_pending_post_test_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pending_post_test_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pending_post_test_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pending_post_test_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pending_post_test_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pending_post_test_questions table
-- Questions associated with pending post-tests

CREATE TABLE IF NOT EXISTS `pending_post_test_questions` (
  `pending_question_id` INT NOT NULL AUTO_INCREMENT,
  `pending_post_test_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') DEFAULT 'multiple_choice',
  `options` JSON DEFAULT NULL COMMENT 'JSON array of answer options for multiple choice',
  `correct_answer` TEXT NOT NULL,
  `points` INT DEFAULT 1,
  `explanation` TEXT COMMENT 'Explanation of correct answer',
  `order_number` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pending_question_id`),
  KEY `idx_pending_post_test_id` (`pending_post_test_id`),
  KEY `idx_order_number` (`order_number`),
  CONSTRAINT `fk_pending_question_post_test` FOREIGN KEY (`pending_post_test_id`) REFERENCES `pending_post_tests` (`pending_post_test_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
CREATE INDEX idx_created_at ON pending_post_tests(created_at);
CREATE INDEX idx_tutor_status ON pending_post_tests(tutor_id, status);
CREATE INDEX idx_subject_status ON pending_post_tests(subject_id, status);
