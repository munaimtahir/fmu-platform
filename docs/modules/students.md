# Students Module Specification

## Purpose + Boundaries

**Purpose:** Student registry and lifecycle record.

**Owns:**
- Student profile linked to Person
- Academic bindings (enrollment_year, expected_graduation_year, actual_graduation_year)
- Status management
- LeavePeriod model

**Locked Decision:** Absence leave does NOT count toward time-to-graduation; students cannot directly edit authoritative fields.

## Models

### Student
- `person`: ForeignKey(people.Person) - REQUIRED
- `user`: OneToOneField(User), optional
- `reg_no`: CharField, unique
- `program`: ForeignKey(academics.Program)
- `batch`: ForeignKey(academics.Batch)
- `group`: ForeignKey(academics.Group)
- `status`: CharField (active, inactive, graduated, suspended, on_leave)
- `enrollment_year`: IntegerField (year student enrolled)
- `expected_graduation_year`: IntegerField
- `actual_graduation_year`: IntegerField, optional
- `created_at`, `updated_at`: DateTimeField

### LeavePeriod
- `student`: ForeignKey(Student)
- `start_date`: DateField
- `end_date`: DateField
- `type`: CharField (medical, academic, personal, absence)
- `reason`: TextField
- `approved_by`: ForeignKey(User)
- `approved_at`: DateTimeField
- `created_at`, `updated_at`: DateTimeField
- Constraint: No overlapping leave periods
- Note: Absence leave type does NOT count toward time-to-graduation

## APIs

### `/api/students/students/`
- CRUD with `students.students.*` permissions
- Object-level: Students can view own record
- Filters: `program`, `batch`, `group`, `status`, `reg_no`

### `/api/students/students/me/`
- GET: Get current student's profile
- Permission: `IsAuthenticated` (must be a student)
- Response: Full student profile with person details

### `/api/students/leave-periods/`
- CRUD with `students.leave_periods.*` permissions
- Object-level: Students can view own leave periods
- Filters: `student`, `type`, `start_date`, `end_date`
- Validation: No overlapping periods

## Workflows / State Machines

**Student Status:**
- `active`: Normal enrollment
- `inactive`: Not currently enrolled
- `graduated`: Completed program
- `suspended`: Temporarily suspended
- `on_leave`: On approved leave

**Status Transitions:**
- Any → `graduated` (with actual_graduation_year)
- `active` → `on_leave` (via LeavePeriod)
- `active` → `suspended`
- `suspended` → `active` (reinstatement)

## Validations + Conflict Handling

- LeavePeriod dates cannot overlap for same student
- LeavePeriod type "absence" does not affect time-to-graduation calculation
- Student cannot directly edit: reg_no, enrollment_year, program, batch (admin only)
- actual_graduation_year must be >= enrollment_year

## Frontend Screens

### Admin Screens
- Student list/search
- Student detail/edit
- Leave period management
- Bulk operations

### Student Screens
- Profile view (`/profile`)
- View own leave periods
- View academic progress

## Tests Required

1. CRUD tests
2. Permission tests (object-level)
3. LeavePeriod overlap validation tests
4. Status transition tests
5. Time-to-graduation calculation (excluding absence leave)
