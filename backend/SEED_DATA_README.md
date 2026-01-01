# Demo Seed Data Guide

This guide explains how to seed the SIMS database with demo data for demonstration purposes.

## Overview

The seed data system creates:
- **Academic Structure**: Programs, Batches, Groups, Courses, Terms, Sections
- **Users**: Admin, Registrar, Faculty (4 users), and Student users
- **Students**: Student records linked to user accounts
- **Enrollments**: Students enrolled in various course sections
- **Attendance**: Attendance records for enrolled students
- **Assessments**: Assessment types and scores
- **Results**: Final grades based on assessment scores

## Usage

### Seed Demo Data

```bash
# From the backend directory or using docker compose
cd /home/munaim/srv/apps/fmu-platform/backend

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
cd /home/munaim/srv/apps/fmu-platform

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
- Username format: `student{reg_no}` (e.g., `student2024cs001`)
- Email format: `student{reg_no}@sims.edu`
- Password format: `student{year}` where year is the batch year (e.g., `student2024`)

### Generate Credentials Document

After seeding, generate a markdown document with all login credentials:

```bash
python manage.py generate_login_credentials

# Or with custom output file
python manage.py generate_login_credentials --output DEMO_CREDENTIALS.md
```

Using Docker:
```bash
docker compose exec backend python manage.py generate_login_credentials
```

## Data Structure

### Academic Structure

**Programs:**
- Bachelor of Science in Computer Science
- Bachelor of Science in Electrical Engineering
- Master of Business Administration

**Batches:**
- Created for each program
- Current year and previous year batches
- Example: "2024 Batch", "2025 Batch"

**Groups:**
- Group A and Group B for each batch

**Courses:**
- CS courses: CS101, CS201, CS301, CS401
- EE courses: EE101, EE201
- MBA courses: MBA501, MBA601

**Terms:**
- Fall {current_year}
- Spring {next_year}

**Sections:**
- 2 sections per course for the current term
- Assigned to faculty members

### Student Data

Each student has:
- Registration number (format: `{year}-{program_code}-{number}`)
- Name, email, phone, date of birth
- Assigned to a Program, Batch, and Group
- Linked user account for login
- Enrollment in 4-5 course sections
- Attendance records (10 per enrollment, ~80% attendance rate)
- Assessment scores (midterm, final, quiz, assignment)
- Final grades calculated from assessment scores

## Example Workflow

1. **Seed the database:**
   ```bash
   docker compose exec backend python manage.py seed_demo --students 30 --clear
   ```

2. **Generate credentials document:**
   ```bash
   docker compose exec backend python manage.py generate_login_credentials
   ```

3. **Access the application:**
   - Frontend: https://sims.alshifalab.pk or https://sims.pmc.edu.pk
   - Login with any of the generated credentials
   - Test different user roles (Admin, Faculty, Student)

## Testing Student Login

To test student login in the frontend:

1. Use the demo student account:
   - Username: `student` or Email: `student@sims.edu`
   - Password: `student123`

2. Or use any generated student account:
   - Username: `student2024cs001` (format: student{reg_no})
   - Email: `student2024cs001@sims.edu`
   - Password: `student2024` (format: student{year})

3. Students can view:
   - Their enrollment information
   - Attendance records
   - Assessment scores
   - Final grades and results
   - Academic progress

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
