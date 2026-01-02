# Deploying Demo Data

This guide explains how to deploy demo data to your FMU Platform SIMS application.

## Quick Start

### Automatic Deployment (Recommended)

We've provided a deployment script that automates the entire process:

```bash
# Make sure you're in the project root directory
cd /path/to/fmu-platform

# Run the deployment script
./deploy_demo_data.sh
```

This script will:
1. Start the database container
2. Build and start the backend container
3. Run database migrations
4. Execute the `seed_demo_scenarios` command to create demo data

### Manual Deployment

If you prefer to run commands manually or need more control:

```bash
# 1. Start the Docker environment
docker compose up -d

# 2. Wait for services to be ready (about 15 seconds)
sleep 15

# 3. Run migrations
docker compose exec backend python manage.py migrate

# 4. Seed demo data
docker compose exec backend python manage.py seed_demo_scenarios --students 20
```

## Demo Data Created

The `seed_demo_scenarios` command creates:

### Users (22 total)
- **2 Faculty Users:**
  - Username: `demo_faculty1` / Password: `faculty123`
  - Username: `demo_faculty2` / Password: `faculty123`

- **20 Student Users:**
  - Usernames: `demo_student001` through `demo_student020`
  - Password (all): `demo123`

### Academic Structure
- 1 Program (MBBS by default)
- 1 Batch (current year)
- 3 Groups (A, B, C)
- 3 Departments (Anatomy, Physiology, Biochemistry)
- 1 Academic Period (Block-1 by default)
- 3 Courses (one per department)
- 3 Sections (with faculty assignments)

### Student Distribution (8 Workflow Stages)

Students are distributed across different workflow stages for testing:

1. **ENROLLED_ONLY** (3 students) - Just enrolled, no other activity
2. **ATTENDANCE_STARTED** (4 students) - Attendance marked for 4/5 sessions
3. **LOW_ATTENDANCE_AT_RISK** (3 students) - Low attendance (~65%)
4. **ASSESSMENT_SCORES_PARTIAL** (3 students) - Quiz scores entered
5. **ASSESSMENT_COMPLETE_RESULTS_DRAFT** (3 students) - Results in draft
6. **RESULTS_PUBLISHED** (2 students) - Published results
7. **RESULTS_FROZEN** (1 student) - Frozen/immutable results
8. **FEES_VOUCHER_GENERATED** (1 student) - Fee voucher created

## Access Points

After deployment, you can access:

- **Django Admin Panel:** http://localhost:8010/admin
- **API Endpoints:** http://localhost:8010/api
- **Frontend Application:** http://localhost:8080

### Admin Login
Use the superuser credentials from your `.env` file or create one:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Command Options

The `seed_demo_scenarios` command supports several options:

```bash
# Basic usage (default: 20 students, MBBS program, Block-1 term)
docker compose exec backend python manage.py seed_demo_scenarios

# Custom number of students (must be 20 for correct bucket distribution)
docker compose exec backend python manage.py seed_demo_scenarios --students 20

# Custom program and term
docker compose exec backend python manage.py seed_demo_scenarios --program "BDS" --term "Block-2"

# Custom number of sections
docker compose exec backend python manage.py seed_demo_scenarios --sections 3

# Reset (delete existing demo data and recreate)
docker compose exec backend python manage.py seed_demo_scenarios --reset

# Combine options
docker compose exec backend python manage.py seed_demo_scenarios --reset --students 20 --program "MBBS"
```

## Managing Demo Data

### Viewing Demo Data

All demo objects are tagged with the `DEMO_` prefix for easy identification:
- Students: `DEMO_2026-MBBS-001`, `DEMO_2026-MBBS-002`, etc.
- Faculty: `demo_faculty1`, `demo_faculty2`
- Courses: `DEMO_ANAT-101`, `DEMO_PHYS-101`, etc.

### Resetting Demo Data

To delete all demo data and start fresh:

```bash
docker compose exec backend python manage.py seed_demo_scenarios --reset --students 20
```

This will:
1. Delete all objects with the `DEMO_` prefix
2. Recreate fresh demo data

### Viewing Logs

To see what's happening during deployment:

```bash
# View all logs
docker compose logs -f

# View only backend logs
docker compose logs -f backend

# View only database logs
docker compose logs -f db
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

```bash
# Check if database is running
docker compose ps db

# Restart the database
docker compose restart db

# Wait a few seconds and try again
sleep 10
docker compose exec backend python manage.py migrate
```

### Backend Container Not Starting

If the backend container fails to start:

```bash
# Check logs for errors
docker compose logs backend

# Rebuild the container
docker compose build backend --no-cache

# Start it again
docker compose up -d backend
```

### SSL Certificate Errors During Build

If you encounter SSL certificate errors during Docker build:

1. Check your network/proxy settings
2. Try using a different network
3. Contact your system administrator

### Demo Data Already Exists

If you want to start fresh:

```bash
# Use the --reset flag
docker compose exec backend python manage.py seed_demo_scenarios --reset --students 20
```

## Testing the Deployment

After deployment, verify the demo data:

1. **Check Django Admin:**
   - Go to http://localhost:8010/admin
   - Login with superuser credentials
   - Navigate to Students, Faculty, Courses, etc.

2. **Check API:**
   - Go to http://localhost:8010/api
   - Browse available endpoints

3. **Check Student Login:**
   - Use credentials: `demo_student001` / `demo123`
   - Verify student can access their data

4. **Check Faculty Login:**
   - Use credentials: `demo_faculty1` / `faculty123`
   - Verify faculty can access course/section data

## Production Deployment

For production environments:

1. **Update .env file** with production values
2. **Use docker-compose.prod.yml:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
   docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo_scenarios --students 20
   ```

3. **Consider security:**
   - Change default passwords
   - Use strong credentials
   - Enable HTTPS
   - Configure proper firewall rules

## Support

For issues or questions:
- Check the main documentation: `backend/DEMO_SEED_USAGE.md`
- Review the implementation summary: `IMPLEMENTATION_SUMMARY_DEMO_SCENARIOS.md`
- Check the test suite: `backend/core/tests/test_seed_demo_scenarios.py`
