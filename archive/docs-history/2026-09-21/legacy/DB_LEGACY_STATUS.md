# Database Legacy Status

This document describes the database state after legacy module removal.

## Legacy Tables Status

The following legacy tables **may still exist** in the database but are **no longer queried** by the application:

### Admissions Module
- `admissions_student`
- `admissions_studentapplication`
- `admissions_applicationdraft`

### Enrollment Module
- `enrollment_enrollment`

### Assessments Module
- `assessments_assessment`
- `assessments_assessmentscore`

### Requests Module
- `requests_request` (and related tables if any)

### Documents Module
- `documents_documenttype`
- `documents_document`
- `documents_documentgenerationjob`

### Notifications Module
- `notifications_notificationtemplate`
- `notifications_notification`
- `notifications_notificationpreference`

## Migration Status

- Legacy app migrations remain in the codebase but are **not applied** to new databases
- Existing databases may have legacy tables from previous migrations
- **No destructive operations** were performed (tables were NOT dropped)

## Verification

To verify no legacy tables are being queried:

1. **ORM Smoke Test**: Import all canonical models and query counts
   ```python
   from sims_backend.students.models import Student
   from sims_backend.academics.models import Program, Section
   # ... etc
   ```

2. **Database Log Monitoring**: Tail database logs during admin + CRUD operations
   - Confirm no queries to legacy tables
   - Check for any foreign key references to legacy tables

3. **Application Boot**: Django should boot without warnings about missing apps

## Foreign Key Dependencies

If any canonical models have foreign keys pointing to legacy tables, they will need to be:
- Migrated to point to canonical models, OR
- Removed if the relationship is no longer needed

## Data Migration (Future)

If data migration from legacy to canonical modules is needed:
1. Export data from legacy tables
2. Transform data to canonical model format
3. Import into canonical tables
4. Verify data integrity
5. Drop legacy tables (if desired)

## Notes

- Legacy tables are **safe to leave** in the database
- They will not be queried by the application
- They can be dropped manually if disk space is a concern
- Foreign key constraints may prevent dropping until dependencies are resolved
