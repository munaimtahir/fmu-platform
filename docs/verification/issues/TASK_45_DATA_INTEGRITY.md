# Issue: Data Integrity Check Script Missing

**Task**: Task 45 (Data integrity checks)  
**Severity**: Minor  
**Status**: Recommendation  
**Date**: 2026-01-09

## Description

While the database enforces referential integrity through foreign keys and constraints, there is no dedicated data integrity validation script or scheduled job to detect and report anomalies.

## Current State

**Database-Level Integrity** ✅:
- Foreign key constraints (ON DELETE PROTECT/CASCADE)
- Unique constraints on key fields (reg_no, email, etc.)
- NOT NULL constraints on required fields
- Check constraints on valid values
- Django model validation

**Code-Level Validation** ✅:
- Model clean() methods
- Serializer validation in DRF
- Form validation

**Missing** ⚠️:
- Scheduled integrity check script
- Orphan record detection
- Consistency validation across related entities
- Data quality reports

## Recommended Implementation

### Data Integrity Check Script

```python
# backend/core/management/commands/check_data_integrity.py
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from sims_backend.students.models import Student
from sims_backend.academics.models import Program, Batch
from sims_backend.people.models import Person

class Command(BaseCommand):
    help = 'Runs data integrity checks and reports issues'
    
    def handle(self, *args, **options):
        issues = []
        
        # Check 1: Students without person records
        students_no_person = Student.objects.filter(
            person__isnull=True
        ).count()
        if students_no_person > 0:
            issues.append(f"⚠️  {students_no_person} students without person records")
        
        # Check 2: Students in inactive programs
        students_inactive_programs = Student.objects.filter(
            program__is_active=False
        ).count()
        if students_inactive_programs > 0:
            issues.append(f"⚠️  {students_inactive_programs} students in inactive programs")
        
        # Check 3: Duplicate registration numbers
        duplicate_regnos = Student.objects.values('reg_no').annotate(
            count=Count('id')
        ).filter(count__gt=1)
        if duplicate_regnos.exists():
            issues.append(f"⚠️  {duplicate_regnos.count()} duplicate registration numbers")
        
        # Check 4: Students graduated but status not updated
        from django.utils import timezone
        current_year = timezone.now().year
        graduated_but_active = Student.objects.filter(
            actual_graduation_year__lt=current_year,
            status=Student.STATUS_ACTIVE
        ).count()
        if graduated_but_active > 0:
            issues.append(f"⚠️  {graduated_but_active} graduated students still marked active")
        
        # Check 5: Orphaned person records
        orphaned_persons = Person.objects.filter(
            student__isnull=True,
            user__isnull=True
        ).count()
        if orphaned_persons > 0:
            issues.append(f"ℹ️  {orphaned_persons} person records not linked to any entity")
        
        # Check 6: Batches with no students
        empty_batches = Batch.objects.annotate(
            student_count=Count('students')
        ).filter(student_count=0).count()
        if empty_batches > 0:
            issues.append(f"ℹ️  {empty_batches} batches with no students")
        
        # Report results
        if issues:
            self.stdout.write(self.style.WARNING(f"\n📊 Data Integrity Check Results: {len(issues)} issues found\n"))
            for issue in issues:
                self.stdout.write(issue)
        else:
            self.stdout.write(self.style.SUCCESS("\n✅ Data Integrity Check: All checks passed!\n"))
        
        # Write to log file
        with open('/tmp/data_integrity_check.log', 'a') as f:
            f.write(f"\n=== {timezone.now().isoformat()} ===\n")
            if issues:
                f.write('\n'.join(issues) + '\n')
            else:
                f.write('All checks passed\n')
```

### Usage

```bash
# Run manually
docker compose exec backend python manage.py check_data_integrity

# Schedule via cron (in production)
0 2 * * * cd /app && python manage.py check_data_integrity >> /var/log/data_integrity.log 2>&1

# Or use Django-Q/Celery for scheduled task
@periodic_task(run_every=timedelta(days=1))
def daily_integrity_check():
    call_command('check_data_integrity')
```

## Integrity Checks to Implement

### Critical Checks ⚠️
1. **Orphan Records**: Records referencing deleted entities
2. **Duplicate Keys**: Duplicate unique identifiers
3. **Invalid States**: Status/state field inconsistencies
4. **Missing Required Data**: NULL in critical fields
5. **Broken Relationships**: FK pointing to non-existent records

### Data Quality Checks ℹ️
1. **Empty Batches**: Batches with no students
2. **Inactive Entities**: Active records in inactive containers
3. **Date Anomalies**: Future birth dates, invalid date ranges
4. **Numeric Anomalies**: Negative ages, invalid percentages
5. **Format Validation**: Email, phone number formats

### Business Logic Checks ✔️
1. **Graduation Status**: Graduated students marked as active
2. **Attendance Thresholds**: Students below minimum attendance
3. **Grade Consistency**: Grade vs. marks consistency
4. **Enrollment Validity**: Enrollment dates vs. program dates

## Additional Features

### Auto-Repair Mode

```python
def handle(self, *args, **options):
    auto_fix = options.get('auto_fix', False)
    
    if auto_fix:
        # Example: Auto-update graduated students
        Student.objects.filter(
            actual_graduation_year__lt=current_year,
            status=Student.STATUS_ACTIVE
        ).update(status=Student.STATUS_GRADUATED)
        
        self.stdout.write(self.style.SUCCESS("✅ Auto-fixed issues"))
```

### Email Reports

```python
from django.core.mail import send_mail

if issues:
    send_mail(
        subject='Data Integrity Issues Detected',
        message='\n'.join(issues),
        from_email='system@example.com',
        recipient_list=['admin@example.com'],
    )
```

### Prometheus Metrics

```python
from prometheus_client import Gauge

integrity_issues = Gauge('data_integrity_issues', 'Number of data integrity issues')

def handle(self, *args, **options):
    # ... run checks
    integrity_issues.set(len(issues))
```

## Impact

**Current State**:
- ✅ Database enforces referential integrity
- ✅ Model/serializer validation prevents bad data entry
- ⚠️ No proactive detection of anomalies
- ⚠️ No automated reporting

**With Fix**:
- ✅ Proactive issue detection
- ✅ Regular integrity reports
- ✅ Early warning of data quality issues
- ✅ Audit trail of data health

## Testing

```bash
# Create test data with intentional issues
docker compose exec backend python manage.py shell
>>> from sims_backend.students.models import Student
>>> Student.objects.create(reg_no='TEST001', name='Test', program_id=999)  # Invalid program

# Run integrity check
docker compose exec backend python manage.py check_data_integrity

# Should report:
# ⚠️  1 students in non-existent programs
```

## Priority

**LOW** - Database constraints provide core integrity. This is a proactive monitoring enhancement.

## Implementation Time

- **Script**: 1-2 hours
- **Tests**: 30 minutes
- **Documentation**: 15 minutes
- **Scheduling**: 15 minutes

**Total**: ~3 hours

## Files to Create/Modify

- `backend/core/management/commands/check_data_integrity.py` - New command
- `backend/tests/test_data_integrity.py` - Unit tests
- `docs/OPERATIONS.md` - Add integrity check documentation
- `scripts/data_integrity_check.sh` - Wrapper script (optional)

## Status

**Open** - Recommendation for production operations

## Related Tasks

- Task 44 (Audit logging) - Integrity check results should be logged
- Task 46 (Backup/restore) - Run integrity check after restore

## Next Steps

1. Implement basic integrity check command
2. Add tests for each check
3. Document in operations guide
4. Schedule daily run in production
