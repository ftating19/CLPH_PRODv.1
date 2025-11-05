# Post-Test Templates Setup Guide

## Quick Start

### 1. Run the Database Migration

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the migration
source backend/database/migrate_post_tests_to_templates.sql
```

Or use a GUI tool to execute the SQL file.

### 2. Restart the Backend Server

The new API endpoints are already added to `server.js`, so just restart:

```bash
cd backend/server
node server.js
```

### 3. Use the Feature

Navigate to **Manage Post-Tests** page as a tutor. You'll now see two tabs:

#### **Templates Tab**
- Shows all reusable post-test templates
- Each template displays:
  - Number of questions
  - Subject name
  - Time limit
  - How many times assigned/completed
- Actions:
  - **View Students**: See all students assigned to this template with their scores
  - **Questions**: View/edit the questions in the template

#### **Individual Post-Tests Tab**
- Original view of post-tests assigned to specific students
- Backward compatible with existing post-tests

## Features

### Template Card Shows:
- Title and description
- Number of questions
- Subject
- Time limit  
- Assignment statistics (X assigned, Y completed)

### Student List Shows:
- Student name and email
- Assignment date
- Completion status
- Score and pass/fail badge (if completed)
- Status badge (Pending/In Progress/Completed)

## API Endpoints Used

```
GET  /api/post-test-templates/tutor/:tutorId
GET  /api/post-test-templates/:templateId
GET  /api/post-test-templates/:templateId/questions
GET  /api/post-test-templates/:templateId/assignments
POST /api/post-test-templates
PUT  /api/post-test-templates/:templateId
DEL  /api/post-test-templates/:templateId
```

## Next Steps (Optional Enhancements)

1. **Create Template UI**: Add a flow to create new templates from scratch
2. **Assign to Students**: Add UI to assign existing templates to multiple students
3. **Bulk Operations**: Allow assigning one template to a class of students at once
4. **Template Editing**: Allow editing template questions
5. **Template Duplication**: Clone templates to create variations

## Database Schema

### Tables Created:
- `post_test_templates` - Reusable test content
- `post_test_assignments` - Student assignments

### Tables Modified:
- `post_test_questions` - Added `template_id` column
- `post_test_results` - Added `assignment_id` and `template_id` columns

## Troubleshooting

### Templates not showing?
- Check if migration ran successfully
- Verify `post_test_templates` table exists
- Check backend console for errors

### Questions not loading?
- Ensure questions have `template_id` set
- Migration should have copied existing questions

### Students not showing?
- Check `post_test_assignments` table
- Verify students have bookings with the tutor for that subject
