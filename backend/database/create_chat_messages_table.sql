-- Create chat_messages table for tutor-student communication in sessions
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  sender_id INT NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at)
);