# Quiz View Feature Setup Guide

## Overview
This feature adds a "Quiz View" option to quizzes, allowing creators to mark quizzes as either "Personal" or "Public".

## Database Setup

### Option 1: Run the Migration Script (Recommended)
Run the following SQL script in your MySQL database:

```bash
mysql -u your_username -p your_database_name < backend/migrations/add_quiz_view_column.sql
```

Or manually execute the script in your database client (MySQL Workbench, phpMyAdmin, etc.)

### Option 2: Simple SQL Command
If you prefer a simple approach, run this SQL command directly:

```sql
ALTER TABLE quizzes ADD COLUMN quiz_view VARCHAR(20) DEFAULT 'Personal' AFTER program;
```

### Verify Installation
After running the migration, verify the column was added:

```sql
DESCRIBE quizzes;
```

You should see the `quiz_view` column in the table structure.

## How It Works

### Frontend (quizzes.tsx)
1. **Quiz Creation Form**: Users can select "Personal" or "Public" from a dropdown when creating a quiz
2. **Default Value**: New quizzes default to "Personal"
3. **Quiz Editing**: When editing a quiz, the current quiz_view value is loaded from the database
4. **State Management**: The `quizView` state variable manages the selected value

### Backend Integration

#### API Endpoints Updated:
1. **POST /api/quizzes** - Creates a new quiz with quiz_view
2. **PUT /api/quizzes/:id** - Updates a quiz including quiz_view
3. **GET /api/quizzes** - Retrieves all quizzes with quiz_view field
4. **GET /api/quizzes/:id** - Retrieves a single quiz with quiz_view field

#### Database Queries (queries/quizzes.js):
- `createQuiz()` - Inserts quiz_view into database
- `updateQuiz()` - Updates quiz_view in database
- `getAllQuizzes()` - Selects quiz_view from database with default fallback
- `getQuizById()` - Includes quiz_view in query results

## Usage

### Creating a New Quiz:
1. Click "Create Quiz" button
2. Fill in quiz details (title, subject, description, etc.)
3. Select "Personal" or "Public" from the "Quiz View" dropdown
4. Add questions and save

### Editing an Existing Quiz:
1. Click "Manage Quiz" on any quiz card
2. The "Quiz View" dropdown will show the current value
3. Change the value if needed
4. Save changes

## Default Behavior
- New quizzes: "Personal"
- Existing quizzes (before migration): "Personal" (applied as default)
- Missing quiz_view in database: Falls back to "Personal"

## Troubleshooting

### Error: "Unknown column 'quiz_view'"
Run the migration script to add the column to your database.

### Quiz View Not Saving
1. Check browser console for API errors
2. Check backend server logs
3. Verify the quiz_view column exists in your database
4. Ensure your MySQL user has ALTER table permissions

### Quiz View Not Loading When Editing
1. Verify the quiz has a quiz_view value in the database
2. Check browser console for any JavaScript errors
3. Ensure the GET /api/quizzes/:id endpoint is returning quiz_view

## Future Enhancements

Possible future improvements:
- Filter quizzes by Personal/Public view
- Different permissions for Personal vs Public quizzes
- Public quizzes visible to all students
- Personal quizzes visible only to creator
- Analytics based on quiz view type

## Technical Details

### Data Type
- Column: `quiz_view`
- Type: `VARCHAR(20)`
- Default: `'Personal'`
- Allowed Values: `'Personal'`, `'Public'`

### Database Position
The column is added after the `program` column in the quizzes table.

## Support
If you encounter any issues, check:
1. Database connection is working
2. Migration script ran successfully
3. Backend server restarted after changes
4. Frontend rebuilt/refreshed after code updates
