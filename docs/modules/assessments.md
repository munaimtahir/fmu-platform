# Assessments Module Specification

## Purpose + Boundaries

**Purpose:** Assessment definitions and score recording.

**Owns:**
- Assessment definitions per section
- Assessment types (quiz, midterm, final, project, etc.)
- Max scores and weights
- Score entry

**Locked Decision:** Weight sum must equal exactly 100% per section (not just ≤100%).

## Models

### Assessment
- `section`: ForeignKey(Section)
- `type`: CharField (quiz, midterm, final, project, assignment, etc.)
- `weight`: PositiveSmallIntegerField (percentage)
- `max_score`: DecimalField (optional, can be in AssessmentScore instead)

### AssessmentScore
- `assessment`: ForeignKey(Assessment)
- `student`: ForeignKey(Student)
- `score`: DecimalField
- `max_score`: DecimalField
- Unique constraint: (assessment, student)

## APIs

### `/api/assessments/assessments/`
- CRUD with `assessments.assessments.*` permissions
- Filters: `section`, `type`

### `/api/assessments/scores/`
- CRUD with `assessments.scores.*` permissions
- Filters: `assessment`, `student`

## Workflows / State Machines

**Weight Validation:**
- On create/update: Total weight for section must equal exactly 100%
- Validation runs in serializer

## Validations + Conflict Handling

- Weight sum must equal 100% per section (not less, not more)
- Score cannot exceed max_score
- Score cannot be negative

## Frontend Screens

### Admin Screens
- Assessment definitions per section
- Weight validation UI (show total, highlight if not 100%)
- Score entry interface

### Faculty Screens
- View/enter scores for own sections

### Student Screens
- View own scores

## Tests Required

1. CRUD tests
2. Weight validation tests (must equal 100%)
3. Score validation tests
4. Permission tests
