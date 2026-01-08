# Enrollment Module Specification

## Purpose + Boundaries

**Purpose:** Academic binding between students and sections/terms.

**Owns:**
- Enrollment records
- Capacity enforcement
- Duplicate prevention
- Term validation
- Enrollment history

**Locked Decision:** Enrollment is transaction-safe, capacity-aware, and forbidden in closed terms.

## Models

### Enrollment
- `student`: ForeignKey(Student)
- `section`: ForeignKey(Section)
- `academic_period`: ForeignKey(AcademicPeriod)
- `status`: CharField (active, dropped, completed, withdrawn)
- `enrolled_at`: DateTimeField
- `enrolled_by`: ForeignKey(User)
- `dropped_at`: DateTimeField, optional
- `drop_reason`: TextField
- `grade`: CharField (if completed)
- Unique constraint: (student, section, academic_period)

## APIs

### `/api/enrollment/enrollments/`
- CRUD with task-based permissions
- Object-level: Students can view own enrollments
- Create uses `enroll_student()` method for transaction safety

### `/api/enrollment/enrollments/{id}/drop/`
- Drop an enrollment (POST)

### `/api/enrollment/enrollments/section/{id}/availability/`
- Check section capacity and availability

## Workflows / State Machines

**Enrollment Process:**
- Check term is open
- Check enrollment is open for term
- Lock section row (select_for_update)
- Check capacity (current_count < capacity)
- Check duplicate (student not already enrolled)
- Create enrollment (all in transaction)

**Status Transitions:**
- `active` → `dropped` (via drop action)
- `active` → `completed` (with grade)

## Validations + Conflict Handling

- Transaction safety: Uses `transaction.atomic()` and `select_for_update()`
- Capacity enforcement: Checks current count vs capacity
- Duplicate prevention: Unique constraint + explicit check
- Term validation: Must be open and enrollment enabled
- Clean error messages with codes (TERM_CLOSED, CAPACITY_EXCEEDED, DUPLICATE_ENROLLMENT)

## Tests Required

1. CRUD tests
2. Capacity enforcement tests
3. Transaction safety/concurrency tests
4. Term validation tests
5. Duplicate prevention tests
