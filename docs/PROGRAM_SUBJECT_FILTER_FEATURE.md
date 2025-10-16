# Program-Based Subject Filter Feature

## Overview
Added a program filter to the tutor matching page that allows users to filter tutors and subjects by program.

## Changes Made

### File: `frontend/components/pages/tutor-matching.tsx`

#### 1. Program Filter Dropdown (Line ~800)
**Previously:** Only available for admins
**Now:** Available for ALL users (students, tutors, admins)

**Features:**
- Shows all CICT programs (BSIT, BSEMC, BSIS, BSCS)
- "All Programs" option to see everything
- When a program is selected, the subject filter updates automatically

#### 2. Dynamic Subject Filtering (Line ~820)
**New Behavior:**
- Subject dropdown shows only subjects that belong to the selected program
- Shows count of available subjects: "All Subjects (25 available)"
- Subjects are filtered by checking their `program` field (handles both array and string formats)
- Automatically resets to "All Subjects" when program changes

#### 3. Tutor Filtering Logic (Line ~1305)
**Updated Behavior:**
- When program filter is set: Shows only tutors from that program
- When "All Programs" is selected:
  - **Students:** Still only see tutors from their own program (for safety)
  - **Admins/Tutors:** See tutors from all programs

## How It Works

### For Students:
```
1. Select a program (e.g., BSIT)
2. Subject dropdown updates to show only BSIT subjects
3. Tutor list filters to show only BSIT tutors
4. If "All Programs" selected, still only see their own program's tutors
```

### For Admins/Tutors:
```
1. Select a program (e.g., BSIT)
2. Subject dropdown updates to show only BSIT subjects
3. Tutor list filters to show only BSIT tutors
4. If "All Programs" selected, see tutors from ALL programs
```

## User Flow Example

### Scenario 1: Admin wants to find BSIT tutors for Data Structures
1. Click "Filter by program" → Select "BSIT"
2. Subject dropdown now shows only BSIT subjects
3. Click "Filter by subject" → Select "Data Structures"
4. See only BSIT tutors who teach Data Structures

### Scenario 2: Student wants to see all available subjects for BSEMC
1. Click "Filter by program" → Select "BSEMC"
2. Subject dropdown shows: "All Subjects (18 available)"
3. Can browse all 18 BSEMC subjects
4. Tutors shown are only from BSEMC program

### Scenario 3: Admin wants to see ALL tutors across programs
1. Click "Filter by program" → Select "All Programs"
2. Subject dropdown shows ALL subjects from all programs
3. Tutor list shows tutors from ALL programs
4. Can filter by any subject across any program

## Technical Details

### Subject Program Matching
The code handles two data formats for `subject.program`:
```javascript
// Format 1: Array
subject.program = ["BSIT", "BSCS"]

// Format 2: JSON string
subject.program = '["BSIT", "BSCS"]'

// Format 3: Single string
subject.program = "BSIT"
```

All formats are correctly parsed and filtered.

### Filter Reset Behavior
When program filter changes:
```javascript
onValueChange={(value) => {
  setSelectedProgramFilter(value)
  setSelectedSubjectFilter('all') // Resets subject to "All"
}}
```

This prevents selecting a subject that doesn't exist in the new program.

## UI Components

### Program Filter
- Width: 200px
- Shows all CICT programs
- Positioned before subject filter

### Subject Filter
- Width: 280px (wider to accommodate count text)
- Shows program-specific subjects
- Displays count: "(X available)"
- Sorted alphabetically by subject_code

## Benefits

✅ **Better Organization:** Users can browse programs systematically
✅ **Reduced Clutter:** Only see relevant subjects for selected program
✅ **Clear Feedback:** Shows how many subjects are available
✅ **Intuitive:** Automatically resets subject when program changes
✅ **Flexible:** Students see their program, admins see everything
✅ **Consistent:** Works with existing search and filter logic

## Future Enhancements

Possible improvements:
- Add program icons/colors
- Show tutor count per program
- Remember last selected program (localStorage)
- Add "Quick Filters" for popular program-subject combinations
- Show program in tutor cards more prominently

## Testing Checklist

- [x] Program filter dropdown appears for all users
- [x] Selecting a program filters subjects correctly
- [x] Subject filter shows accurate count
- [x] Tutor list filters by selected program
- [x] Subject filter resets when program changes
- [x] "All Programs" shows appropriate results based on role
- [x] Search still works with program filter
- [x] Subject filter still works with program filter
- [x] No errors in console
- [x] Recommended tutors still appear first
