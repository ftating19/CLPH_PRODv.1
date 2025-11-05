# Post-Test Templates - Reusable Post-Tests

## Overview
The post-test system has been upgraded to allow tutors to create reusable post-test templates that can be assigned to multiple students taking the same subject.

## Database Architecture

### Before (Old System)
- One post-test per student
- `post_tests` table had `student_id` and `booking_id` columns
- Questions directly linked to `post_test_id`
- Couldn't reuse tests across students

### After (New System)
Four main tables:

1. **`post_test_templates`** - Reusable test content
   - `template_id` (PK)
   - `tutor_id`
   - `title`, `description`
   - `subject_id`, `subject_name`
   - `time_limit`, `passing_score`
   - `is_active` (soft delete)

2. **`post_test_questions`** - Questions linked to templates
   - `question_id` (PK)
   - `template_id` (FK) - NEW: Questions now belong to templates
   - `post_test_id` (FK) - KEPT for backward compatibility
   - `question_text`, `question_type`, `options`, etc.

3. **`post_test_assignments`** - Student assignments
   - `assignment_id` (PK)
   - `template_id` (FK)
   - `student_id` (FK)
   - `booking_id` (FK)
   - `assigned_by` (tutor_id)
   - `status` (assigned, in_progress, completed, expired)
   - `due_date`

4. **`post_test_results`** - Student results
   - `result_id` (PK)
   - `assignment_id` (FK) - NEW: Links to specific assignment
   - `template_id` (FK) - NEW: For easier queries
   - `post_test_id` (FK) - KEPT for backward compatibility
   - `student_id`, `answers`, `score`, etc.

## Migration

### Running the Migration

```bash
mysql -u your_user -p your_database < backend/database/migrate_post_tests_to_templates.sql
```

### What the Migration Does

1. Creates `post_test_templates` table
2. Adds `template_id` column to `post_test_questions`
3. Creates `post_test_assignments` table
4. Migrates existing post-tests to templates
5. Updates all foreign key relationships
6. Keeps old `post_tests` table as backup

### Rollback Plan

The migration keeps the old `post_tests` table intact. To rollback:

```sql
-- Remove new columns and tables
DROP TABLE IF EXISTS post_test_assignments;
DROP TABLE IF EXISTS post_test_templates;
ALTER TABLE post_test_questions DROP COLUMN template_id;
ALTER TABLE post_test_results DROP COLUMN assignment_id, DROP COLUMN template_id;
```

## API Endpoints

### Template Management

```javascript
// Get all templates for a tutor
GET /api/post-test-templates/tutor/:tutorId
Response: { success: true, templates: [...], total: 5 }

// Get template with questions
GET /api/post-test-templates/:templateId
Response: { success: true, template: {...} }

// Create new template
POST /api/post-test-templates
Body: {
  tutor_id: 123,
  title: "Math Final Exam",
  description: "Covers chapters 1-5",
  subject_id: 10,
  subject_name: "Mathematics",
  time_limit: 60,
  passing_score: 75
}
Response: { success: true, template_id: 456 }

// Update template
PUT /api/post-test-templates/:templateId
Body: { title: "Updated Title", ... }
Response: { success: true, message: "Template updated" }

// Delete template (soft delete)
DELETE /api/post-test-templates/:templateId
Response: { success: true, message: "Template deleted" }
```

### Assignment Management

```javascript
// Get students who can be assigned (same subject bookings)
GET /api/post-test-templates/:templateId/eligible-students?tutor_id=123&subject_id=10
Response: { success: true, students: [...] }

// Assign template to students
POST /api/post-test-templates/:templateId/assign
Body: {
  student_ids: [100, 101, 102],
  booking_ids: [200, 201, 202],
  assigned_by: 123,
  due_date: "2025-12-01"
}
Response: { success: true, assignments_created: 3 }

// Get all assignments for a template
GET /api/post-test-templates/:templateId/assignments
Response: {
  success: true,
  assignments: [
    {
      assignment_id: 1,
      student_id: 100,
      first_name: "John",
      last_name: "Doe",
      status: "completed",
      score: 85,
      passed: true
    },
    ...
  ]
}
```

## Frontend Usage

### Managing Templates

```typescript
// Fetch tutor's templates
const response = await fetch(`/api/post-test-templates/tutor/${tutorId}`)
const { templates } = await response.json()

// Each template includes:
// - Basic info (title, description, subject)
// - times_assigned: How many students have been assigned
// - times_completed: How many have completed it
```

### Creating a Template

```typescript
// Step 1: Create template
const template = await fetch('/api/post-test-templates', {
  method: 'POST',
  body: JSON.stringify({
    tutor_id: currentUser.id,
    title: "Biology Quiz",
    subject_id: subjectId,
    subject_name: "Biology",
    time_limit: 30,
    passing_score: 70
  })
})

// Step 2: Add questions (use existing endpoint)
await fetch(`/api/post-tests/${template.template_id}/questions`, {
  method: 'POST',
  body: JSON.stringify({
    questions: [
      {
        question_text: "What is photosynthesis?",
        question_type: "multiple_choice",
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        points: 1
      }
    ]
  })
})
```

### Assigning to Students

```typescript
// Step 1: Get eligible students
const response = await fetch(
  `/api/post-test-templates/${templateId}/eligible-students?tutor_id=${tutorId}&subject_id=${subjectId}`
)
const { students } = await response.json()

// Step 2: Assign to selected students
await fetch(`/api/post-test-templates/${templateId}/assign`, {
  method: 'POST',
  body: JSON.stringify({
    student_ids: selectedStudents.map(s => s.user_id),
    booking_ids: selectedStudents.map(s => s.booking_id),
    assigned_by: tutorId,
    due_date: "2025-12-15"
  })
})
```

## Benefits

1. **Reusability** - Create once, assign to many students
2. **Consistency** - All students get the same test
3. **Efficiency** - No need to recreate tests for each student
4. **Analytics** - See how many times a test was assigned/completed
5. **Version Control** - Can update templates without affecting past results
6. **Batch Assignment** - Assign to multiple students at once

## UI Flow

### For Tutors

1. **Manage Post-Tests** page now shows:
   - "Templates" tab (reusable tests)
   - "Assignments" tab (student-specific instances)

2. **Creating a Template**:
   - Click "Create Template"
   - Fill in title, subject, settings
   - Add questions
   - Save as template (no student assigned yet)

3. **Assigning Template**:
   - Click "Assign" on a template
   - See list of eligible students (same subject)
   - Select multiple students
   - Set due date
   - Click "Assign to Students"

4. **Viewing Results**:
   - See all assignments per template
   - View which students completed/pending
   - See individual student scores

### For Students

- No change! Students still see "assigned post-tests"
- They take the test normally
- Results saved to their assignment

## Next Steps

1. **Run the migration** on your database
2. **Update the frontend** to use template endpoints
3. **Add UI** for template management and assignment
4. **Test** with multiple students in same subject
5. **Optional**: Add template sharing between tutors

## Notes

- Old `post_tests` table kept for backward compatibility
- Existing post-tests automatically converted to templates
- Questions can reference either `post_test_id` OR `template_id`
- Results link to both `assignment_id` and old `post_test_id`
