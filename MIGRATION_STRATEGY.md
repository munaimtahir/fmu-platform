# Migration Strategy for MVP Implementation

This document outlines the migration strategy for implementing the MVP data model.

## Overview

The MVP requires a clean replacement of the existing academic structure. This means resetting migrations and creating new ones for the updated data model.

## Migration Reset Process

### Step 1: Backup Existing Database (if needed)

```bash
# Create database backup
pg_dump -U sims_user sims_db > backup_before_mvp.sql
```

### Step 2: Delete Old Migration Files

Delete all migration files except `__init__.py` from the following apps:
- `sims_backend.academics`
- `sims_backend.attendance`
- `sims_backend.results`
- `sims_backend.audit`

Keep migrations for legacy apps that will be removed later:
- `sims_backend.admissions`
- `sims_backend.enrollment`
- `sims_backend.assessments`
- `sims_backend.requests`
- `sims_backend.transcripts`

### Step 3: Create New Migration Files

```bash
cd backend

# Create migrations for new/updated apps
python manage.py makemigrations core
python manage.py makemigrations academics
python manage.py makemigrations students
python manage.py makemigrations timetable
python manage.py makemigrations attendance
python manage.py makemigrations exams
python manage.py makemigrations results
python manage.py makemigrations finance
python manage.py makemigrations audit
```

### Step 4: Review Migration Files

Review generated migration files to ensure:
- All model fields are correctly represented
- Foreign key relationships are correct
- Indexes are created
- Constraints are applied

### Step 5: Reset Database (Development)

**WARNING**: This will delete all data. Only use in development.

```bash
# Option 1: Drop and recreate database
dropdb sims_db
createdb sims_db

# Option 2: Flush database (keeps database structure)
python manage.py flush --no-input
```

### Step 6: Apply Migrations

```bash
python manage.py migrate
```

### Step 7: Create Role Groups

Create Django groups for roles:

```python
# In Django shell or management command
from django.contrib.auth.models import Group

roles = ['ADMIN', 'COORDINATOR', 'FACULTY', 'FINANCE', 'STUDENT', 'OFFICE_ASSISTANT']
for role in roles:
    Group.objects.get_or_create(name=role)
```

### Step 8: Create Superuser

```bash
python manage.py createsuperuser
```

## Migration Dependencies

Migration order matters. Ensure dependencies are correct:

1. `core` - Profile, FacultyProfile (no dependencies)
2. `academics` - Program, Batch, AcademicPeriod, Group, Department
3. `students` - Depends on academics
4. `timetable` - Depends on academics, students (for User)
5. `attendance` - Depends on timetable, students
6. `exams` - Depends on academics
7. `results` - Depends on exams, students
8. `finance` - Depends on students, academics
9. `audit` - No dependencies

## Data Migration Notes

If migrating existing data:

1. **Students**: Map existing Student records to new Program/Batch/Group structure
2. **Programs**: Convert existing Program records to new simplified structure
3. **Academic Structure**: Map Terms to AcademicPeriods
4. **Results**: Convert existing Result records to ResultHeader/ResultComponentEntry

**Note**: MVP scope does not include data migration scripts. Manual data entry or custom scripts required.

## Production Migration Strategy

For production deployments:

1. **Staging Environment**: Test migrations thoroughly in staging
2. **Backup**: Create full database backup before migration
3. **Maintenance Window**: Schedule migration during low-traffic period
4. **Rollback Plan**: Keep backup ready for rollback if needed
5. **Verification**: Verify all endpoints work after migration

## Rollback Procedure

If migration fails:

```bash
# Restore from backup
psql -U sims_user sims_db < backup_before_mvp.sql

# Or restore previous migration state
python manage.py migrate academics 0001_initial  # Use previous migration number
```

## Verification Checklist

After migrations:

- [ ] All migrations applied successfully
- [ ] All models accessible via Django admin
- [ ] API endpoints respond correctly
- [ ] Role groups created
- [ ] Superuser can log in
- [ ] Sample data can be created
- [ ] Relationships work correctly (Program → Batch → Group → Student)
- [ ] Foreign key constraints enforced
- [ ] Unique constraints working

## Common Issues

### Issue: Migration conflicts

**Solution**: Reset migrations and recreate from scratch

### Issue: Foreign key constraint errors

**Solution**: Check migration dependencies and order

### Issue: Missing role groups

**Solution**: Run role creation script or Django shell command

### Issue: Model import errors

**Solution**: Ensure all apps are in INSTALLED_APPS in correct order

## Next Steps

After successful migration:

1. Create seed data scripts for testing
2. Set up role-based access control
3. Test all API endpoints
4. Verify workflow state transitions
5. Test OFFICE_ASSISTANT permissions
6. Run acceptance tests

