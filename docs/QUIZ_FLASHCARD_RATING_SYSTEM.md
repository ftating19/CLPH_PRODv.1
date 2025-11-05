# Quiz and Flashcard Rating System

## Overview
Users can now rate quizzes and flashcard sets with a 1-5 star rating system. Ratings are displayed on quiz and flashcard cards, showing the average rating and total number of ratings.

## Features Implemented

### 1. Database Tables
- **quiz_ratings**: Stores user ratings for quizzes
- **flashcard_ratings**: Stores user ratings for individual flashcards (grouped by set)

**Schema:**
```sql
- rating_id (PRIMARY KEY)
- quiz_id/flashcard_id (FOREIGN KEY)
- user_id (FOREIGN KEY)
- rating (1-5, CHECK constraint)
- created_at, updated_at (timestamps)
- UNIQUE constraint on (quiz_id/flashcard_id, user_id) - one rating per user per item
```

### 2. Backend API Endpoints

#### Quiz Ratings:
- `GET /api/quizzes/:id/rating` - Get average rating and total ratings
- `GET /api/quizzes/:id/rating/:userId` - Get user's rating for a quiz
- `POST /api/quizzes/:id/rating` - Create or update a rating
- `DELETE /api/quizzes/:id/rating/:userId` - Delete a rating

#### Flashcard Ratings:
- `GET /api/flashcards/set/:subId/rating` - Get average rating for a flashcard set
- `GET /api/flashcards/set/:subId/rating/:userId` - Get user's rating for a set
- `POST /api/flashcards/set/:subId/rating` - Rate all flashcards in a set
- `GET /api/flashcards/:id/rating` - Get rating for individual flashcard
- `POST /api/flashcards/:id/rating` - Rate individual flashcard

### 3. Frontend Components

#### StarRating Component (`components/ui/star-rating.tsx`)
Reusable star rating component with:
- Interactive hover effects
- Display of average rating and total count
- Shows user's current rating
- Readonly mode for pending items or non-logged-in users
- Configurable sizes (sm, md, lg)

#### Integration:
- **Quizzes Page**: Ratings displayed on each quiz card
- **Flashcards Page**: Ratings displayed on each flashcard set card

## How It Works

### Rating a Quiz/Flashcard Set:
1. User clicks on a star (1-5)
2. Frontend sends POST request to rating endpoint
3. Backend creates/updates rating in database
4. Backend returns updated average rating
5. Frontend updates UI with new rating

### Viewing Ratings:
- Average rating shown as filled stars
- Total number of ratings shown in parentheses
- User's own rating highlighted if they've rated

### Permissions:
- Only logged-in users can rate
- Pending items cannot be rated
- Users can update their rating by clicking a different star
- Each user can only have one rating per quiz/flashcard set

## Database Migration

Run the following SQL script to create the rating tables:

```bash
mysql -u your_username -p your_database < backend/migrations/create_ratings_tables.sql
```

Or run the SQL directly in your MySQL client.

## Testing the Feature

### 1. Rate a Quiz:
- Go to Quizzes page
- Click on any star (1-5) on a quiz card
- See the average rating update
- Your rating is highlighted

### 2. Rate a Flashcard Set:
- Go to Flashcards page (Tools section)
- Click on any star on a flashcard set card
- Rating applies to all flashcards in the set
- See updated average rating

### 3. Update Your Rating:
- Click on a different star value
- Rating updates automatically

### 4. View Other Users' Ratings:
- Average rating shown with star display
- Total number of ratings shown
- Example: "4.5 (23)" = 4.5 stars from 23 users

## Technical Details

### Rating Calculation:
- Average is calculated using SQL AVG() function
- Rounded to 1 decimal place
- 0 stars shown if no ratings exist

### Rating Storage:
- Flashcard set ratings store one rating per flashcard in the set
- This allows for individual flashcard ratings if needed in the future
- Average set rating calculated from all flashcard ratings in the set

### Performance:
- Ratings fetched in parallel using Promise.all()
- Cached in component state
- Refetched when quiz/flashcard lists change

## Future Enhancements

Possible additions:
- Filter/sort by rating
- Rating distribution chart (how many 5-star, 4-star, etc.)
- Comments/reviews with ratings
- Require completion before rating
- Report inappropriate ratings
- Admin moderation of ratings

## API Response Examples

### Get Quiz Rating:
```json
{
  "success": true,
  "average_rating": 4.5,
  "total_ratings": 23
}
```

### Rate a Quiz:
```json
POST /api/quizzes/123/rating
{
  "user_id": 456,
  "rating": 5
}

Response:
{
  "success": true,
  "message": "Quiz rated successfully",
  "average_rating": 4.6,
  "total_ratings": 24
}
```

## Troubleshooting

### Ratings Not Showing:
1. Check if database tables exist
2. Verify backend server is running
3. Check browser console for API errors
4. Ensure user is logged in

### Can't Rate Items:
1. Verify user is logged in
2. Check if item is pending (pending items can't be rated)
3. Ensure rating value is between 1-5

### Ratings Not Updating:
1. Check network tab for API response
2. Verify database connection
3. Check for unique constraint violations
4. Look at backend console logs
