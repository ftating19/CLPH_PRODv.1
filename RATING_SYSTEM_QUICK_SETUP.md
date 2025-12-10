# Quick Setup Guide - Rating System

## Step 1: Create Database Tables

Run this SQL in your MySQL database:

```sql
-- Create quiz ratings table
CREATE TABLE IF NOT EXISTS quiz_ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
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
```

## Step 2: Verify Tables Created

```sql
-- Check quiz_ratings table
DESCRIBE quiz_ratings;

-- Check flashcard_ratings table
DESCRIBE flashcard_ratings;

-- Verify indexes
SHOW INDEX FROM quiz_ratings;
SHOW INDEX FROM flashcard_ratings;
```

## Step 3: Restart Backend Server

```bash
cd backend/server
node server.js
```

You should see the server start without errors. The new rating endpoints are automatically loaded.

## Step 4: Test the Feature

### Option A: Using MySQL
```sql
-- Insert a test quiz rating
INSERT INTO quiz_ratings (quiz_id, user_id, rating) 
VALUES (1, 1, 5);

-- Check the rating
SELECT * FROM quiz_ratings;

-- Get average rating for quiz 1
SELECT 
  COALESCE(AVG(rating), 0) as average_rating,
  COUNT(*) as total_ratings
FROM quiz_ratings
WHERE quiz_id = 1;
```

### Option B: Using the UI
1. Open the application
2. Go to Quizzes page
3. Click on any star (1-5) on a quiz card
4. You should see:
   - Toast notification: "Quiz rated successfully!"
   - Updated average rating on the card
   - Your rating highlighted

### Option C: Using API (Postman/curl)
```bash
# Rate a quiz
curl -X POST https://api.cictpeerlearninghub.com/api/quizzes/1/rating \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "rating": 5}'

# Get quiz rating
curl https://api.cictpeerlearninghub.com/api/quizzes/1/rating

# Get user's rating
curl https://api.cictpeerlearninghub.com/api/quizzes/1/rating/1
```

## Step 5: Verify Everything Works

### Checklist:
- [ ] Tables created in database
- [ ] Backend server running without errors
- [ ] Can see stars on quiz cards
- [ ] Can click stars to rate
- [ ] Toast notification appears after rating
- [ ] Average rating updates
- [ ] User's rating is highlighted
- [ ] Same functionality works for flashcard sets

## Troubleshooting

### Error: "Table 'quiz_ratings' doesn't exist"
**Solution:** Run the SQL commands in Step 1

### Error: "Cannot add foreign key constraint"
**Solution:** Make sure the quizzes and users tables exist with the correct primary keys

### Error: "Duplicate entry"
**Solution:** User already rated this item. They can update it by clicking a different star.

### Stars not showing in UI
**Solution:** 
1. Check browser console for errors
2. Verify backend is running
3. Check network tab for API responses
4. Clear browser cache and reload

### Rating doesn't update
**Solution:**
1. Check backend console for errors
2. Verify user is logged in
3. Check if item is pending (can't rate pending items)
4. Try refreshing the page

## Database Cleanup (if needed)

```sql
-- Remove all ratings (CAREFUL!)
DELETE FROM quiz_ratings;
DELETE FROM flashcard_ratings;

-- Remove tables (if you want to start over)
DROP TABLE IF EXISTS quiz_ratings;
DROP TABLE IF EXISTS flashcard_ratings;

-- Then run Step 1 again
```

## Sample Data for Testing

```sql
-- Add some test ratings for quiz 1
INSERT INTO quiz_ratings (quiz_id, user_id, rating) VALUES
(1, 1, 5),
(1, 2, 4),
(1, 3, 5),
(1, 4, 3),
(1, 5, 4);

-- Check average (should be 4.2)
SELECT AVG(rating) as average FROM quiz_ratings WHERE quiz_id = 1;

-- Add test ratings for flashcard set (sub_id = 1)
-- First, get flashcard IDs
SELECT flashcard_id, sub_id FROM flashcards WHERE sub_id = 1;

-- Then rate them (replace flashcard_id values with actual IDs)
INSERT INTO flashcard_ratings (flashcard_id, user_id, rating) VALUES
(1, 1, 5),
(2, 1, 5),
(3, 1, 5);
```

## Next Steps

After setup is complete:
1. Test with real users
2. Monitor rating distribution
3. Consider adding sort/filter by rating
4. Analyze which content gets highest ratings
5. Use ratings to improve content quality

---

**Setup Time:** ~5 minutes

**Status:** Ready to use! ⭐⭐⭐⭐⭐
