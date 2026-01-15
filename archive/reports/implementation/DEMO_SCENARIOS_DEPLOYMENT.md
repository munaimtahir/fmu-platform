# Demo Scenarios - Deployment Instructions

## Quick Start

Once your database connection is properly configured, run:

```bash
# 1. Ensure containers are running
docker compose ps

# 2. Run migrations (if needed)
docker compose exec backend python manage.py migrate

# 3. Seed demo scenarios
docker compose exec backend python manage.py seed_demo_scenarios --students 20 --reset
```

## Files Changed/Added

### ✅ New Files Created:
1. `backend/core/demo_scenarios.py` - Helper module (355 lines)
2. `backend/core/management/commands/seed_demo_scenarios.py` - Management command (367 lines)
3. `backend/tests/test_demo_scenarios.py` - Test suite (120 lines)
4. `DEMO_SCENARIOS_IMPLEMENTATION.md` - Implementation documentation
5. `DEMO_SCENARIOS_DEPLOYMENT.md` - This file

### ✅ No Existing Files Modified:
- Existing `seed_demo.py` command remains untouched
- All changes are additive only

## Command Usage

### Basic Usage
```bash
docker compose exec backend python manage.py seed_demo_scenarios --students 20 --reset
```

### With Custom Parameters
```bash
docker compose exec backend python manage.py seed_demo_scenarios \
  --students 20 \
  --program "MBBS" \
  --term "Block-1" \
  --sections 3 \
  --reset
```

### Parameters:
- `--students`: Total number of students (default: 20, minimum: 20 for all scenarios)
- `--program`: Program name (default: "MBBS")
- `--term`: Academic period name (default: "Block-1")
- `--sections`: Number of sections/groups (default: 3)
- `--reset`: Delete existing demo objects before creating new ones

## Expected Sample Output

```
Creating demo scenarios...
  ✓ Program: DEMO_MBBS
  ✓ Batch: DEMO_2026 Batch
  ✓ Academic Period: DEMO_Block-1
  ✓ Groups: 3
  ✓ Created 30 sessions
  ✓ Created exams: DEMO_Midterm Exam, DEMO_Quiz 1

================================================================================
✅ DEMO SCENARIOS CREATED SUCCESSFULLY
================================================================================

📚 ACADEMIC STRUCTURE:
  Program: DEMO_MBBS
  Batch: DEMO_2026 Batch
  Academic Period: DEMO_Block-1
  Groups/Sections: DEMO_Section 1, DEMO_Section 2, DEMO_Section 3

👨‍🏫 FACULTY USERS:
  - demofaculty1 (demofaculty1@sims.edu) - Password: faculty123
  - demofaculty2 (demofaculty2@sims.edu) - Password: faculty123

👥 STUDENTS BY SCENARIO:

  ENROLLED_ONLY (3 students):
    - DEMO-2026-MBBS-001: Alice Johnson
      Username: studentdemo2026mbbs001 | Password: student2026
    - DEMO-2026-MBBS-002: Bob Smith
      Username: studentdemo2026mbbs002 | Password: student2026
    - DEMO-2026-MBBS-003: Carol Williams
      Username: studentdemo2026mbbs003 | Password: student2026

  ATTENDANCE_STARTED (4 students):
    - DEMO-2026-MBBS-004: David Brown
      Username: studentdemo2026mbbs004 | Password: student2026
    ...

  LOW_ATTENDANCE_AT_RISK (3 students):
    ...

  ASSESSMENT_SCORES_PARTIAL (3 students):
    ...

  ASSESSMENT_COMPLETE_RESULTS_DRAFT (3 students):
    ...

  RESULTS_PUBLISHED (2 students):
    ...

  RESULTS_FROZEN (1 student):
    ...

  FEES_VOUCHER_GENERATED (1 student):
    ...

📊 TOTAL: 20 students created

🔗 KEY ENDPOINTS:
  - Admin: http://localhost:8000/admin/
  - API: http://localhost:8000/api/
  - Students API: http://localhost:8000/api/students/
  - Results API: http://localhost:8000/api/results/
  - Finance API: http://localhost:8000/api/finance/

================================================================================
```

## Scenario Breakdown

The command creates exactly 20 students distributed across 8 scenarios:

| Scenario | Count | Description |
|----------|-------|-------------|
| ENROLLED_ONLY | 3 | Enrollment exists, no attendance, no scores |
| ATTENDANCE_STARTED | 4 | 3-5 sessions marked, mixed present/absent |
| LOW_ATTENDANCE_AT_RISK | 3 | Attendance 60-74% (below threshold) |
| ASSESSMENT_SCORES_PARTIAL | 3 | Quiz scores only, midterm missing |
| ASSESSMENT_COMPLETE_RESULTS_DRAFT | 3 | All scores entered, results in DRAFT |
| RESULTS_PUBLISHED | 2 | Results published and visible |
| RESULTS_FROZEN | 1 | Results verified (frozen proxy) |
| FEES_VOUCHER_GENERATED | 1 | Challan generated, unpaid |
| **TOTAL** | **20** | |

## Key Assumptions Made

### 1. Model Structure
- **Student**: Uses `sims_backend.students.models.Student`
- **Enrollment**: Section model doesn't exist, using Groups as proxy
- **Results**: Using Exam-based system (not assessments)
- **Attendance**: Session-based (not section-based)

### 2. Results Workflow
- Status flow: DRAFT → VERIFIED → PUBLISHED
- **Frozen**: Using VERIFIED status as proxy (system has no explicit FROZEN)

### 3. Finance
- Using existing `Challan` model (represents fee voucher)
- Status: PENDING (unpaid) vs PAID

### 4. Demo Tagging
- All demo objects prefixed with `DEMO_`
- `--reset` only deletes DEMO-tagged objects
- Idempotent operations (get_or_create patterns)

## Database Setup

If you encounter database connection errors:

1. **Check Environment Variables**:
   ```bash
   # Ensure .env file has correct database credentials
   cat .env | grep DB_
   ```

2. **Verify Database Container**:
   ```bash
   docker compose ps db
   docker compose logs db
   ```

3. **Test Connection**:
   ```bash
   docker compose exec backend python manage.py dbshell
   ```

4. **Run Migrations**:
   ```bash
   docker compose exec backend python manage.py migrate
   ```

## Testing

Run the test suite to verify everything works:

```bash
# Run all demo scenario tests
docker compose exec backend pytest tests/test_demo_scenarios.py -v

# Run specific test
docker compose exec backend pytest tests/test_demo_scenarios.py::DemoScenariosCommandTest::test_command_creates_20_students -v
```

## Accessing Demo Data

### Admin Panel
- URL: http://localhost:8000/admin/ (or your public domain)
- Login: `admin` / `admin123`

### API Endpoints
- Students: `GET /api/students/`
- Results: `GET /api/results/`
- Attendance: `GET /api/attendance/`
- Finance: `GET /api/finance/challans/`

### Student Login
- Username: `studentdemo2026mbbs001` (format: `student{reg_no}`)
- Password: `student2026` (format: `student{year}`)

## Making Data Accessible on Public Domain

### 1. Ensure Containers Are Running
```bash
docker compose up -d
docker compose ps
```

### 2. Run Migrations (if needed)
```bash
docker compose exec backend python manage.py migrate
```

### 3. Seed Demo Data
```bash
docker compose exec backend python manage.py seed_demo_scenarios --students 20 --reset
```

### 4. Verify Data
```bash
# Check students
docker compose exec backend python manage.py shell -c "from sims_backend.students.models import Student; print(Student.objects.filter(reg_no__contains='DEMO-').count())"

# Check results
docker compose exec backend python manage.py shell -c "from sims_backend.results.models import ResultHeader; print(ResultHeader.objects.filter(exam__title__startswith='DEMO_').count())"
```

### 5. Configure Public Access
- Ensure reverse proxy (nginx/Caddy) is configured
- Update DNS settings
- Verify firewall rules allow traffic
- Check SSL certificates if using HTTPS

## Troubleshooting

### Command Not Found
```bash
# Rebuild container
docker compose build backend
docker compose restart backend
```

### Import Errors
- Ensure `core` is in `INSTALLED_APPS`
- Check all required apps are installed
- Verify Python path

### Database Errors
- Check `.env` file credentials
- Verify database container is running
- Check database logs: `docker compose logs db`

### Permission Errors
- Ensure user has proper permissions
- Check file ownership in container

## Cleanup

To remove all demo data:
```bash
docker compose exec backend python manage.py seed_demo_scenarios --reset --students 0
```

Or manually:
```python
# In Django shell
from core.demo_scenarios import delete_demo_objects
delete_demo_objects()
```

## Next Steps

1. ✅ Code implementation complete
2. ⏳ Fix database connection (environment issue)
3. ⏳ Run migrations
4. ⏳ Execute seed command
5. ⏳ Verify data in admin/API
6. ⏳ Configure public domain access

## Support

For issues:
1. Check test suite: `pytest tests/test_demo_scenarios.py -v`
2. Review command help: `python manage.py help seed_demo_scenarios`
3. Check logs: `docker compose logs backend`
4. Review implementation docs: `DEMO_SCENARIOS_IMPLEMENTATION.md`
