# Demo Seed Data Guide

This guide explains how to seed the SIMS database with demo data for demonstration purposes.

## Overview

The seed data system creates:
- **Academic Structure**: Programs, Batches, Groups, Departments, Academic Periods
- **Users**: Admin, Registrar, Faculty (4 users), and Student users
- **Students**: Student records linked to user accounts
- **Timetable**: Sessions linking academic periods, groups, faculty, and departments

## Usage

### Seed Demo Data

```bash
# From the backend directory
cd backend

# Run with default settings (20 students)
python manage.py seed_demo

# Create more students
python manage.py seed_demo --students 50

# Clear existing data and reseed
python manage.py seed_demo --clear
```

### Using Docker Compose

```bash
# From the project root
cd /home/runner/work/fmu-platform/fmu-platform

# Run seed command
docker compose exec backend python manage.py seed_demo --students 30

# Clear and reseed
docker compose exec backend python manage.py seed_demo --clear
```

## Generated Login Credentials

### Administrative Users

**Admin**
- Username: `admin`
- Email: `admin@sims.edu`
- Password: `admin123`

**Registrar**
- Username: `registrar`
- Email: `registrar@sims.edu`
- Password: `registrar123`

**Faculty**
- Usernames: `faculty`, `faculty1`, `faculty2`, `faculty3`
- Email: `faculty@sims.edu`, `faculty1@sims.edu`, etc.
- Password: `faculty123` (for all faculty)

### Student Users

Each student gets a unique user account:

**Demo Student**
- Username: `student`
- Email: `student@sims.edu`
- Password: `student123`

**Other Students**
- Username format: `student{reg_no}` (e.g., `student2026mbbs101`)
- Email format: `student{reg_no}@sims.edu`
- Password format: `student{year}` where year is the batch year (e.g., `student2026`)

## Data Structure

### Academic Structure

**Programs:**
- MBBS (Bachelor of Medicine, Bachelor of Surgery)
- BDS (Bachelor of Dental Surgery)
- Doctor of Pharmacy (Pharm.D)

**Batches:**
- Created for each program
- Current year and previous year batches
- Example: "2026 Batch", "2025 Batch"

**Groups:**
- Group A and Group B for each batch

**Departments:**
- Anatomy (ANAT)
- Physiology (PHYS)
- Biochemistry (BIOCHEM)
- Medicine (MED)
- Surgery (SURG)
- Pediatrics (PED)

**Academic Periods:**
- Hierarchical structure: Year → Block → Module
- Example: "Year 1" → "Block 1" → "Module A"

**Sessions:**
- Timetable sessions linking academic periods, groups, faculty, and departments
- 5 sessions per group over 10 days

### Student Data

Each student has:
- Registration number (format: `{year}-{program_code}-{number}`)
- Name, email, phone, date of birth
- Assigned to a Program, Batch, and Group
- Linked user account for login
- Timetable sessions assigned to their groups

## Example Workflow

1. **Seed the database:**
   ```bash
   docker compose exec backend python manage.py seed_demo --students 30 --clear
   ```

2. **Access the application:**
   - Frontend: https://sims.alshifalab.pk or https://sims.pmc.edu.pk
   - Login with any of the generated credentials
   - Test different user roles (Admin, Faculty, Student)
   
3. **Check the seeded data:**
   The command will display login credentials for all users after completion.

## Testing Student Login

To test student login in the frontend:

1. Use the demo student account:
   - Username: `student` or Email: `student@sims.edu`
   - Password: `student123`

2. Or use any generated student account:
   - Username: `student2026mbbs101` (format: student{reg_no})
   - Email: `student2026mbbs101@sims.edu`
   - Password: `student2026` (format: student{year})

3. Students can view:
   - Their student profile and information
   - Academic program and batch details
   - Group assignments
   - Timetable sessions

## Notes

- **Default Passwords**: All default passwords follow predictable patterns for easy demo access
- **Production Warning**: Never use default passwords in production!
- **Data Relationships**: Students are properly linked to Programs, Batches, and Groups
- **User Accounts**: Each student has a corresponding User account for authentication
- **Batch Assignment**: Students are distributed across batches and groups
- **Random Data**: Student names, emails, and other details use Faker for realistic demo data

## Troubleshooting

### Clear All Data

If you need to start fresh:

```bash
docker compose exec backend python manage.py seed_demo --clear
```

### Check Seed Status

Verify seeded data:

```bash
# Check users
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(f'Users: {User.objects.count()}')"

# Check students
docker compose exec backend python manage.py shell -c "from sims_backend.students.models import Student; print(f'Students: {Student.objects.count()}')"

# Check programs
docker compose exec backend python manage.py shell -c "from sims_backend.academics.models import Program; print(f'Programs: {Program.objects.count()}')"
```

### Common Issues

1. **Missing Batch/Group**: Ensure seed_demo creates batches and groups before creating students
2. **User Already Exists**: Use `--clear` flag to remove existing data
3. **Password Not Working**: Verify you're using the correct format (username/email + password)

## Security Notes

⚠️ **IMPORTANT**: 
- These credentials are for **demonstration purposes only**
- Default passwords are intentionally simple for demo access
- **Always change passwords in production environments**
- Consider implementing password complexity requirements
- Use strong, unique passwords for all production accounts
