# MVP Setup Guide

Complete setup guide for the FMU Platform MVP implementation.

## Prerequisites

- Docker & Docker Compose (recommended) OR
- Python 3.12+, PostgreSQL 14+, Node.js 20+ (local development)

## Quick Setup (Docker)

### Step 1: Clone and Configure

```bash
git clone <repository-url>
cd fmu-platform
cp .env.example .env
# Edit .env with your configuration (see ENV_CONTRACT.md)
```

### Step 2: Start Services

```bash
docker compose up -d --build
```

Wait for services to start (about 10-15 seconds).

### Step 3: Create Migrations

```bash
docker compose exec backend python manage.py makemigrations
```

This will create migrations for all new MVP apps:
- core (Profile, FacultyProfile)
- academics (Program, Batch, AcademicPeriod, Group, Department)
- students (Student)
- timetable (Session)
- attendance (Attendance)
- exams (Exam, ExamComponent)
- results (ResultHeader, ResultComponentEntry)
- finance (ChargeTemplate, Charge, StudentLedgerItem, Challan, PaymentLog)
- audit (AuditLog)

### Step 4: Apply Migrations

```bash
docker compose exec backend python manage.py migrate
```

### Step 5: Create Role Groups

```bash
docker compose exec backend python manage.py shell
```

In the Django shell:
```python
from django.contrib.auth.models import Group

roles = ['ADMIN', 'COORDINATOR', 'FACULTY', 'FINANCE', 'STUDENT', 'OFFICE_ASSISTANT']
for role in roles:
    Group.objects.get_or_create(name=role)
    print(f"Created group: {role}")

# Verify
for role in roles:
    assert Group.objects.filter(name=role).exists(), f"{role} group not found"
print("All role groups created successfully")
```

### Step 6: Create Superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

Follow the prompts to create an admin user.

### Step 7: Assign User to Role Group

In Django shell:
```python
from django.contrib.auth.models import User, Group

user = User.objects.get(username='admin')  # Replace with your username
admin_group = Group.objects.get(name='ADMIN')
user.groups.add(admin_group)
print(f"Added {user.username} to ADMIN group")
```

### Step 8: Verify Installation

1. **Check Health Endpoint:**
   ```bash
   curl http://localhost:8000/health/
   ```
   Should return: `{"status": "ok", "service": "SIMS Backend", ...}`

2. **Access Admin Panel:**
   - Open: http://localhost:8000/admin/
   - Login with superuser credentials

3. **Check API Endpoints:**
   ```bash
   # Get auth token (replace with your credentials)
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"identifier": "admin", "password": "yourpassword"}'
   
   # Use token to access API
   curl http://localhost:8000/api/academics/programs/ \
     -H "Authorization: Bearer <your_token>"
   ```

## Local Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create role groups (see Step 5 above)

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Verification Checklist

See `VERIFICATION_CHECKLIST.md` for comprehensive verification steps.

Quick verification:

- [ ] All migrations applied successfully
- [ ] Role groups created (6 groups: ADMIN, COORDINATOR, FACULTY, FINANCE, STUDENT, OFFICE_ASSISTANT)
- [ ] Superuser created
- [ ] Health endpoint returns OK: `/health/`
- [ ] Admin panel accessible: `/admin/`
- [ ] API endpoints respond (with authentication)

## Next Steps

1. **Create Sample Data:**
   - Create programs, batches, groups via admin or API
   - Create students
   - Create academic periods
   - Create sessions
   - Create exams

2. **Test Role Permissions:**
   - Create users for each role
   - Assign users to role groups
   - Test API access for each role
   - Verify OFFICE_ASSISTANT restrictions

3. **Test Workflow:**
   - Create exam with components
   - Enter results in DRAFT
   - Verify results (COORDINATOR/ADMIN)
   - Publish results (COORDINATOR/ADMIN)
   - Verify students can only see published results

4. **Test Finance Module:**
   - Create charge templates
   - Generate charges
   - Create ledger items
   - Generate challans
   - Log payments
   - Verify OFFICE_ASSISTANT cannot access

## Troubleshooting

### Migration Errors

If you encounter migration conflicts:

1. Check `MIGRATION_STRATEGY.md` for migration reset process
2. Ensure all model dependencies are correct
3. Verify INSTALLED_APPS includes all new apps

### Import Errors

If models cannot be imported:

1. Verify all apps are in INSTALLED_APPS
2. Check for circular imports
3. Ensure all `__init__.py` files exist

### Permission Errors

If API returns 403:

1. Verify user is assigned to correct role group
2. Check permission classes in views
3. Verify authentication token is valid

### Database Errors

If database operations fail:

1. Check database connection settings in `.env`
2. Verify PostgreSQL is running
3. Check database user permissions

## Documentation

- `ENV_CONTRACT.md` - Environment variables
- `CADDY.md` - Reverse proxy configuration
- `MIGRATION_STRATEGY.md` - Migration process
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `VERIFICATION_CHECKLIST.md` - Verification steps
- `CREATE_MIGRATIONS.md` - Migration creation guide

## Support

For issues or questions:
- Review documentation in `/docs` directory
- Check `IMPLEMENTATION_SUMMARY.md` for implementation details
- Review `VERIFICATION_CHECKLIST.md` for troubleshooting

