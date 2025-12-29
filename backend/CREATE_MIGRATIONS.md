# Create Migrations Guide

This guide explains how to create migrations for the MVP implementation.

## Prerequisites

1. Ensure Django environment is set up:
   ```bash
   cd backend
   # Activate virtual environment if using one
   pip install -r requirements.txt
   ```

2. Database should be configured in `.env` or environment variables

## Migration Creation Process

### Step 1: Create Migration Directories (Already Done)

Migration directories have been created for:
- `sims_backend/students/migrations/`
- `sims_backend/timetable/migrations/`
- `sims_backend/exams/migrations/`
- `sims_backend/finance/migrations/`

### Step 2: Create Migrations

Run makemigrations for all apps:

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

# Or create all at once
python manage.py makemigrations
```

### Step 3: Review Migration Files

Check that migrations include:
- All model fields
- Correct foreign key relationships
- Indexes
- Unique constraints
- Default values

### Step 4: Check for Conflicts

```bash
python manage.py makemigrations --dry-run
python manage.py check
```

### Step 5: Apply Migrations

**WARNING**: For clean installation, you may need to reset the database first.

```bash
# Option 1: Fresh database (development)
python manage.py migrate

# Option 2: Reset database (WILL DELETE ALL DATA)
# python manage.py flush --no-input
# python manage.py migrate
```

### Step 6: Create Role Groups

After migrations, create role groups:

```python
# In Django shell: python manage.py shell
from django.contrib.auth.models import Group

roles = ['ADMIN', 'COORDINATOR', 'FACULTY', 'FINANCE', 'STUDENT', 'OFFICE_ASSISTANT']
for role in roles:
    Group.objects.get_or_create(name=role)
    print(f"Created group: {role}")
```

### Step 7: Create Superuser

```bash
python manage.py createsuperuser
```

## Migration Dependencies

Ensure migrations are created in this order (Django handles dependencies automatically, but verify):

1. `core` - No dependencies
2. `academics` - No dependencies (Program, Batch, AcademicPeriod, Group, Department)
3. `students` - Depends on academics
4. `timetable` - Depends on academics
5. `attendance` - Depends on timetable and students
6. `exams` - Depends on academics
7. `results` - Depends on exams and students
8. `finance` - Depends on students and academics
9. `audit` - No dependencies

## Troubleshooting

### Issue: Migration conflicts with existing migrations

**Solution**: For clean MVP implementation, delete old migration files (except `__init__.py`) and create fresh migrations. See `MIGRATION_STRATEGY.md` for details.

### Issue: Foreign key errors

**Solution**: Check that referenced models exist and migrations are applied in correct order.

### Issue: Missing fields

**Solution**: Review model definitions and ensure all fields are defined before running makemigrations.

## Verification

After migrations are created and applied:

```bash
# Check for errors
python manage.py check

# Verify models
python manage.py shell
>>> from sims_backend.students.models import Student
>>> from sims_backend.exams.models import Exam
>>> from sims_backend.results.models import ResultHeader
>>> from sims_backend.finance.models import Charge
>>> print("All models import successfully")
```

## Next Steps

After successful migrations:

1. Create role groups (see Step 6 above)
2. Create superuser
3. Test API endpoints
4. Create seed data (optional)
5. Write tests

