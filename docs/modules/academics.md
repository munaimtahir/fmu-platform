# Academics Module Specification

## Purpose + Boundaries

**Purpose:** Academic structure definition (the skeleton). Defines programs, courses, terms, and sections.

**Owns:**
- Program, Course/Batch, Term/TimePeriod, Section
- Faculty assignment, capacity
- Term open/close status

**Locked Decision:** Terms may overlap (parallel blocks/rotations allowed); closed terms block academic writes.

## Models

### Program
- `name`: CharField
- `code`: CharField, unique
- `description`: TextField, optional
- `duration_years`: IntegerField
- `is_active`: BooleanField
- `created_at`, `updated_at`: DateTimeField

### Batch (Course Batch)
- `program`: ForeignKey(Program)
- `name`: CharField (e.g., "2024", "2024-2025")
- `start_year`: IntegerField
- `end_year`: IntegerField
- `is_active`: BooleanField

### Term / TimePeriod
- `name`: CharField (e.g., "Fall 2024", "Block 1")
- `code`: CharField, unique
- `type`: CharField (YEAR, BLOCK, MODULE, SEMESTER)
- `start_date`: DateField
- `end_date`: DateField
- `is_open`: BooleanField (controls if academic writes allowed)
- `is_active`: BooleanField
- Note: Terms can overlap (parallel blocks allowed)

### Section
- `name`: CharField (e.g., "Section A")
- `code`: CharField
- `term`: ForeignKey(Term/TimePeriod)
- `course`: ForeignKey(Course) or related to Batch
- `faculty`: ForeignKey(User), optional
- `capacity`: IntegerField
- `enrolled_count`: IntegerField (computed or maintained)
- `is_active`: BooleanField
- Unique constraint: (term, code)

### Course
- `name`: CharField
- `code`: CharField, unique
- `credit_hours`: IntegerField
- `program`: ForeignKey(Program), optional
- `is_active`: BooleanField

## APIs

### `/api/academics/programs/`
- CRUD with `academics.programs.*` permissions

### `/api/academics/batches/`
- CRUD with `academics.batches.*` permissions
- Filters: `program`, `is_active`

### `/api/academics/terms/`
- CRUD with `academics.terms.*` permissions
- Filters: `type`, `is_open`, `start_date`, `end_date`
- Special: `close_term/{id}/` - Close term (blocks writes)
- Special: `open_term/{id}/` - Reopen term

### `/api/academics/sections/`
- CRUD with `academics.sections.*` permissions
- Filters: `term`, `course`, `faculty`
- Object-level: Faculty can view/edit own sections
- Capacity validation on enrollment

### `/api/academics/courses/`
- CRUD with `academics.courses.*` permissions

## Workflows / State Machines

**Term Status:**
- `is_open=True`: Academic writes allowed
- `is_open=False`: Academic writes blocked (enrollment, result entry, etc.)

## Validations + Conflict Handling

- Term dates can overlap (by design)
- Closed terms block: enrollment, result entry, attendance entry
- Section capacity cannot be exceeded
- Term close must be reversible (if policy allows)

## Frontend Screens

### Admin Screens
- Program/Batch management
- Term management with open/close controls
- Section management with capacity tracking

### Faculty Screens
- View assigned sections
- View section enrollment

## Tests Required

1. CRUD tests
2. Permission tests
3. Term open/close workflow tests
4. Capacity enforcement tests
5. Overlapping terms validation tests
