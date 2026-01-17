# E2E Smoke Test Guide

This document provides step-by-step manual verification for the fixed E2E issues.

## Prerequisites

1. Start all services:
   ```bash
   docker compose up -d
   docker compose exec backend python manage.py migrate
   ```

2. Create admin user if needed:
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

3. Access frontend at `http://localhost:8080` (or configured port)
4. Login as Admin user

---

## Test Flow 1: Academic Structure CRUD

### 1.1 Create Batch
1. Navigate to `/academics/batches`
2. Click "Create Batch"
3. Fill in:
   - Batch Name: "2024 Batch"
   - Program: Select a program
   - Start Year: 2024
   - Active: ✓
4. Click "Create"
5. **Expected**: Batch appears in list, success toast shown

### 1.2 Create Academic Period
1. Navigate to `/academics/periods`
2. Click "Create Period"
3. Fill in:
   - Period Type: "YEAR"
   - Period Name: "Year 1"
   - Start Date: (optional)
   - End Date: (optional)
4. Click "Create"
5. **Expected**: Period appears in list, success toast shown

### 1.3 Create Group
1. Navigate to `/academics/groups`
2. Click "Create Group"
3. Fill in:
   - Group Name: "Group A"
   - Batch: Select a batch
4. Click "Create"
5. **Expected**: Group appears in list, success toast shown

### 1.4 Edit/Delete
1. For each entity (batch, period, group):
   - Click "Edit" → Modify → "Update" → Verify change
   - Click "Delete" → Confirm → Verify removal

---

## Test Flow 2: Department Create/Delete

1. Navigate to `/academics/departments`
2. Click "Create Department"
3. Fill in:
   - Department Name: "Test Department"
   - Code: "TEST"
   - Description: (optional)
4. Click "Create"
5. **Expected**: Department appears in list
6. Click "Delete" on the created department
7. **Expected**: Department removed, success message shown

---

## Test Flow 3: Program Delete with Batches

1. Navigate to `/academics/programs`
2. Create a program (if needed)
3. Create a batch for that program
4. Try to delete the program
5. **Expected**: Error message: "Cannot delete program. It has X batch(es) associated with it. Please delete the batches first."
6. Delete the batch first
7. Try to delete the program again
8. **Expected**: Program deleted successfully

### 3.1 Batch Change Reflection
1. Navigate to `/academics/programs/{id}`
2. Click "Batches" tab
3. **Expected**: See all batches for this program
4. Create a new batch for this program (from batches page)
5. Return to program detail page, refresh
6. **Expected**: New batch appears in batches tab

---

## Test Flow 4: Course Creation

1. Navigate to `/courses` (or course management page)
2. Click "Create Course" or "Add Course"
3. Fill in:
   - Course Code: "ANAT-101"
   - Course Name: "Human Anatomy"
   - Department: Select a department (dropdown)
   - Academic Period: (optional, select from dropdown)
   - Credits: 4
4. Click "Create"
5. **Expected**: Course created successfully, appears in list

---

## Test Flow 5: Section Creation with Course Dropdown

1. Navigate to `/sections` (or section management page)
2. Click "Create Section" or "Add Section"
3. Fill in:
   - Course: Select from dropdown (shows "CODE - Name")
   - Academic Period: Select from dropdown
   - Section Name: "Section A"
   - Capacity: 30
4. Click "Create"
5. **Expected**: Section created successfully
6. **Note**: Course field should be a dropdown, NOT a number input

---

## Test Flow 6: Student Registration Number

### 6.1 Manual Student Creation
1. Navigate to student creation page
2. Fill in student form including:
   - Registration Number: "2024-MBBS-001"
   - Name, Program, Batch, Group, etc.
3. Submit
4. **Expected**: Student created with reg_no saved
5. Edit the student
6. **Expected**: reg_no field shows the saved value

### 6.2 Bulk Upload
1. Navigate to bulk upload page
2. Upload CSV with students including `reg_no` column
3. Preview and commit
4. **Expected**: All students have reg_no saved correctly

---

## Test Flow 7: Notifications

1. Check top navigation bar for notification bell icon
2. **Expected**: Bell icon visible
3. If there are unread notifications:
   - **Expected**: Badge shows unread count
4. Click bell icon
5. **Expected**: Dropdown or page shows notifications
6. Mark notification as read
7. **Expected**: Badge count decreases

---

## Test Flow 8: Timetable Edit/Publish

### 8.1 Edit Timetable
1. Navigate to `/timetable` or timetable management
2. Find an existing timetable entry
3. Click "Edit"
4. **Expected**: Edit form opens (no 404)
5. Modify and save
6. **Expected**: Changes saved successfully

### 8.2 Publish with 3 Periods Constraint
1. Create/edit a timetable entry
2. Ensure it has exactly 3 periods
3. Click "Publish"
4. **Expected**: Publish succeeds
5. Create/edit another timetable entry with != 3 periods
6. Try to publish
7. **Expected**: Error: "Timetable must have exactly 3 periods before publishing"
8. Add/remove periods to make it exactly 3
9. Publish again
10. **Expected**: Publish succeeds

---

## Test Flow 9: Attendance Marking (Session-Based)

### 9.1 Mark Attendance
1. Navigate to attendance marking page (`/attendance/input` or `/attendance/bulk`)
2. **Select a timetable session** (not a course section)
   - Session list shows: Group, Date/Time, Faculty
3. Select date (defaults to today)
4. Click "Load Roster"
5. **Expected**: Student list appears with names and reg numbers
6. Mark students as Present/Absent using:
   - Individual toggle buttons
   - "Mark All Present" / "Mark All Absent" bulk actions
   - Search to filter students
7. Click "Submit Attendance"
8. Confirm the submission (shows present/absent counts)
9. **Expected**: Success message, attendance saved for session

### 9.2 View Attendance Summary
1. Navigate to attendance dashboard (`/attendance`)
2. **Select a timetable session** from dropdown
   - Shows: Group, Date/Time, Faculty
3. Click "Records" tab
4. **Expected**: List of attendance records with status (PRESENT/ABSENT/LATE/LEAVE)
5. Click "Summary" tab
6. **Expected**: Stats cards show:
   - Total records
   - Present count
   - Absent count
   - Late count
   - Attendance percentage
7. Verify percentage calculation is correct

### 9.3 Attendance Input Page (Advanced)
1. Navigate to `/attendance/input`
2. Select session from dropdown
3. Choose input method:
   - **Live**: Manual marking (same as bulk)
   - **CSV Upload**: Upload CSV file with attendance data
   - **Scanned Sheet**: Upload photo/PDF of attendance sheet
4. Test each method:
   - Live: Load roster, mark, submit
   - CSV: Upload → Preview → Commit
   - Sheet: Upload → Analyze → Commit
5. **Expected**: All methods save attendance correctly

---

## Test Flow 10: Bulk Upload Group Handling

1. Navigate to bulk student upload
2. Upload CSV that includes group names
3. If groups don't exist, they should be auto-created
4. **Expected**: Groups created without corrupting groups tab
5. Navigate to `/academics/groups`
6. **Expected**: All groups listed correctly, no duplicates
7. Upload same CSV again
8. **Expected**: Existing groups reused, no duplicates created

---

## Test Flow 11: Bulk Upload DOB Formats

1. Prepare CSV with DOB in different formats:
   - Row 1: `2024-01-15` (YYYY-MM-DD)
   - Row 2: `15/01/2024` (DD/MM/YYYY)
   - Row 3: `15/01/24` (DD/MM/YY)
   - Row 4: `24/01/15` (YY/MM/DD)
2. Upload CSV
3. Preview
4. **Expected**: All DOB values parsed correctly
5. Commit
6. **Expected**: All students created with correct DOB

---

## Health Check Verification

1. Check backend health:
   ```bash
   curl http://localhost:8010/api/health/
   ```
2. **Expected**: 
   ```json
   {
     "status": "ok" or "degraded",
     "checks": {
       "db": {"status": "ok", "latency_ms": <number>},
       "migrations": {"status": "ok"},
       "redis": {"status": "ok" or "fail"}
     }
   }
   ```
3. If Redis is down:
   - **Expected**: `"status": "degraded"` but service still functional

---

## Notes

- All tests assume Admin role permissions
- Some features may require specific data setup (programs, departments, etc.)
- If a test fails, check browser console and network tab for errors
- Backend logs: `docker compose logs -f backend`
- Frontend logs: Check browser console

---

## Quick Verification Checklist

- [ ] Batches CRUD works
- [ ] Academic Periods CRUD works
- [ ] Groups CRUD works
- [ ] Departments create/delete works
- [ ] Program delete shows proper error when batches exist
- [ ] Program batches tab shows batches correctly
- [ ] Course creation works with department dropdown
- [ ] Section creation uses course dropdown (not number input)
- [ ] Student reg_no persists in create and edit
- [ ] Notifications bell shows unread count
- [ ] Timetable edit doesn't 404
- [ ] Timetable publish enforces 3 periods
- [ ] Attendance marking works (session-based, not section)
- [ ] Attendance viewing and summary works
- [ ] Bulk upload doesn't corrupt groups
- [ ] Bulk upload accepts multiple DOB formats
- [ ] Health endpoint shows degraded when Redis is down
