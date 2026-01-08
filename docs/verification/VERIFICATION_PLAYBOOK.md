# VERIFICATION PLAYBOOK — FMU Platform Recovery

**Version**: 1.0  
**Date**: 2026-01-08  
**Purpose**: Step-by-step manual verification after migrations applied

## Prerequisites

Before starting verification:

1. ✅ Docker containers are running:
   ```bash
   docker compose ps
   # Should show: fmu_backend (healthy), fmu_db (healthy), fmu_frontend (healthy)
   ```

2. ✅ Migrations have been applied:
   ```bash
   docker compose exec backend python manage.py showmigrations
   # All migrations should show [X]
   ```

3. ✅ No errors in backend logs:
   ```bash
   docker compose logs backend --tail=50
   # Should show: "Starting development server", no tracebacks
   ```

4. ✅ Database is accessible:
   ```bash
   docker compose exec backend python manage.py dbshell
   # Should connect to Postgres, then \q to exit
   ```

---

## Phase 1: Backend Health Checks

### 1.1 Health Endpoint
```bash
curl http://localhost:8010/health/
```

**Expected Response**:
```json
{
  "status": "ok",
  "service": "SIMS Backend",
  "components": {
    "database": "ok",
    "redis": "ok",
    "rq_queue": "ok"
  }
}
```

**If Failed**:
- Check `components.database` - If error, verify DB connection
- Check `components.redis` - If error, verify Redis (non-critical)

---

### 1.2 Schema Verification (SQL)
Connect to database:
```bash
docker compose exec backend python manage.py dbshell
```

Run these checks:

#### Check students_student.person_id exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students_student'
  AND column_name = 'person_id';
```

**Expected**: One row showing `person_id | bigint | YES`

#### Check academics_program.structure_type exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'academics_program'
  AND column_name = 'structure_type';
```

**Expected**: One row showing `structure_type | character varying(16) | NO`

#### Check people_person table exists:
```sql
SELECT COUNT(*) FROM people_person;
```

**Expected**: `0` or positive number (no error)

#### Check academics_period table exists:
```sql
SELECT COUNT(*) FROM academics_period;
```

**Expected**: `0` or positive number (no error)

Exit dbshell: `\q`

---

### 1.3 ORM Smoke Test
```bash
docker compose exec backend python manage.py shell
```

```python
# Test People models
from sims_backend.people.models import Person
Person.objects.count()  # Should work, return 0 or number
print("✅ People.Person OK")

# Test Student with person field
from sims_backend.students.models import Student
Student.objects.count()  # Should work
s = Student.objects.first()
if s:
    print(f"Student person field: {s.person}")  # Should not error
print("✅ Students.Student OK")

# Test Program with structure_type
from sims_backend.academics.models import Program
Program.objects.count()  # Should work
p = Program.objects.first()
if p:
    print(f"Program structure: {p.structure_type}")  # Should not error
print("✅ Academics.Program OK")

# Test new academic models
from sims_backend.academics.models import Period, Track, LearningBlock, Module
Period.objects.count()  # Should work
Track.objects.count()  # Should work
LearningBlock.objects.count()  # Should work
Module.objects.count()  # Should work
print("✅ New academic models OK")

# Exit
exit()
```

**If Any Error**: Migration not applied correctly, check logs

---

## Phase 2: Django Admin Verification

### 2.1 Admin Access
1. Navigate to: http://localhost:8010/admin/
2. Login with superuser credentials
   - If no superuser: `docker compose exec backend python manage.py createsuperuser`

### 2.2 Program Admin Test
1. Click **Academics > Programs**
   - **Expected**: List loads without error
   - **If 500**: Check backend logs for `structure_type` error

2. Click **Add Program**
   - **Expected**: Form loads with all fields:
     - Name (required)
     - Description (optional)
     - Is active (checkbox)
     - **Structure type** (dropdown: YEARLY, SEMESTER, CUSTOM)
     - **Is finalized** (checkbox)
     - **Period length months** (number, optional)
     - **Total periods** (number, optional)

3. Fill form:
   ```
   Name: Test Program MBBS
   Description: Test program for verification
   Is active: Yes
   Structure type: YEARLY
   Is finalized: No
   ```

4. Click **Save**
   - **Expected**: Redirects to program list, shows success message
   - **If Error**: Check validation errors or backend logs

5. Click on created program
   - **Expected**: Change form loads with saved data
   - **Verify**: All fields show correct values

6. Click **Delete** (only if test program)
   - **Expected**: Confirmation page, then deletion succeeds

**Result**: ✅ Program admin works correctly

---

### 2.3 Student Admin Test
1. Click **Students > Students**
   - **Expected**: List loads without error
   - **If 500**: Check backend logs for `person_id` error

2. Click **Add Student**
   - **Expected**: Form loads with all fields:
     - Reg no (required)
     - Name (required)
     - Program (dropdown, required)
     - Batch (dropdown, required)
     - Group (dropdown, required)
     - **Person** (dropdown, optional) ← NEW FIELD
     - User (dropdown, optional)
     - Status (dropdown)
     - Email, Phone, Date of birth (optional)
     - **Enrollment year** (number, optional) ← NEW FIELD
     - **Expected graduation year** (number, optional) ← NEW FIELD
     - **Actual graduation year** (number, optional) ← NEW FIELD

3. **Prerequisites**: Must have Program, Batch, Group created first
   - If missing: Create via admin first

4. Fill form:
   ```
   Reg no: TEST-2024-001
   Name: Test Student
   Program: [Select existing]
   Batch: [Select existing]
   Group: [Select existing]
   Person: [Leave empty]
   Status: Active
   Enrollment year: 2024
   Expected graduation year: 2029
   ```

5. Click **Save**
   - **Expected**: Redirects to student list, shows success message
   - **If Error**: Check validation or backend logs

6. Click on created student
   - **Expected**: Change form loads with saved data
   - **Verify**: person field is present and nullable

7. Click **Delete** (only if test student)
   - **Expected**: Confirmation page, then deletion succeeds

**Result**: ✅ Student admin works correctly

---

### 2.4 People Admin Test
1. Click **People > People** (or **People > Persons**)
   - **Expected**: List loads without error
   - **If 404**: People not registered in admin, check admin.py

2. Click **Add Person**
   - **Expected**: Form loads with:
     - First name (required)
     - Middle name (optional)
     - Last name (required)
     - Date of birth (optional)
     - Gender (dropdown)
     - National ID (optional, unique)
     - Photo (file upload)
     - User (dropdown, optional)

3. Fill form:
   ```
   First name: Test
   Last name: Person
   Gender: Male
   National ID: 12345-1234567-1
   ```

4. Click **Save**
   - **Expected**: Success
   - **If Error**: Check admin registration

**Result**: ✅ People admin works correctly

---

### 2.5 Leave Period Admin Test (If Registered)
1. Check **Students > Leave periods**
   - **Expected**: List loads
2. Check fields match model
3. Test create/edit if desired

---

## Phase 3: API Endpoint Verification

### 3.1 Authentication Test
```bash
# 1. Login
curl -X POST http://localhost:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

**Expected Response**:
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    ...
  }
}
```

**Save access token for next steps**:
```bash
export TOKEN="<access_token_from_response>"
```

---

### 3.2 Program CRUD Test
#### List programs:
```bash
curl -X GET http://localhost:8010/api/academics/programs/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: JSON list of programs (may be empty)

#### Create program:
```bash
curl -X POST http://localhost:8010/api/academics/programs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Program",
    "description": "Created via API",
    "is_active": true,
    "structure_type": "SEMESTER",
    "is_finalized": false
  }'
```

**Expected Response**:
```json
{
  "id": 1,
  "name": "API Test Program",
  "structure_type": "SEMESTER",
  "is_finalized": false,
  ...
}
```

**Save program ID**:
```bash
export PROGRAM_ID=<id_from_response>
```

#### Retrieve program:
```bash
curl -X GET http://localhost:8010/api/academics/programs/$PROGRAM_ID/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Full program details

#### Update program:
```bash
curl -X PATCH http://localhost:8010/api/academics/programs/$PROGRAM_ID/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated via API"}'
```

**Expected**: Updated program object

#### Delete program:
```bash
curl -X DELETE http://localhost:8010/api/academics/programs/$PROGRAM_ID/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 204 No Content

**Result**: ✅ Program API CRUD works

---

### 3.3 Student API Test
Similar to program, test:
```bash
# List
curl -X GET http://localhost:8010/api/students/ \
  -H "Authorization: Bearer $TOKEN"

# Create (requires program, batch, group)
curl -X POST http://localhost:8010/api/students/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reg_no": "API-2024-001",
    "name": "API Test Student",
    "program": <program_id>,
    "batch": <batch_id>,
    "group": <group_id>,
    "status": "active",
    "enrollment_year": 2024
  }'
```

**Verify**: `person` field accepted (null or id)

**Result**: ✅ Student API CRUD works

---

### 3.4 People API Test
```bash
# List persons
curl -X GET http://localhost:8010/api/people/persons/ \
  -H "Authorization: Bearer $TOKEN"

# Create person
curl -X POST http://localhost:8010/api/people/persons/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "API",
    "last_name": "Person",
    "gender": "male"
  }'
```

**Expected**: Person created successfully

**Result**: ✅ People API works

---

## Phase 4: Frontend Verification

### 4.1 Frontend Access
Navigate to: http://localhost:8080/

**Expected**: Login page loads

**If Failed**:
- Check frontend container: `docker compose ps`
- Check nginx logs: `docker compose logs frontend`

---

### 4.2 Login Test
1. Enter credentials
2. Click **Login**

**Expected**: Redirects to dashboard

**If Failed**:
- Check browser console for errors
- Check Network tab for failed API calls
- Verify `VITE_API_URL` in frontend container

---

### 4.3 Programs Screen Test
1. Navigate to **Academics > Programs**
   - **Expected**: List of programs loads

2. Click **Create Program** or **+ New**
   - **Expected**: Form opens with all fields including:
     - Structure type dropdown
     - Is finalized checkbox
     - Period length, total periods

3. Fill form:
   ```
   Name: Frontend Test Program
   Structure type: YEARLY
   Is active: Yes
   ```

4. Click **Save** or **Submit**
   - **Expected**: Success message, redirect to list
   - **Verify**: Program appears in list

5. Click on created program
   - **Expected**: Detail view or edit form
   - **Verify**: Can see structure_type value

6. Edit program:
   - Change description
   - Click **Save**
   - **Expected**: Changes persist

7. (Optional) Delete program:
   - Click **Delete**
   - **Expected**: Confirmation, then deletion

**Result**: ✅ Program frontend works, data persists

---

### 4.4 Students Screen Test
1. Navigate to **Students** (or **Students > List**)
   - **Expected**: List loads (may require creating prerequisites first)

2. **Prerequisites Check**:
   - Need existing Program, Batch, Group
   - If missing: Create via Program screen first

3. Click **Import** or **Import Students**
   - **Expected**: Import page loads
   - **Test Import Flow**: Upload CSV, validate, commit
   - **Verify**: Students appear in database

4. (If manual create exists) Click **Create Student**
   - **Expected**: Form with person field dropdown
   - Fill form and save
   - **Verify**: Student persists

**Result**: ✅ Students frontend works

---

### 4.5 Console Errors Check
Open browser DevTools (F12) > Console

**Expected**: No errors related to:
- `person_id` or `structure_type`
- Failed API calls (500 errors)
- Missing field errors

**If Errors**: Investigate API response and backend logs

---

## Phase 5: Database Logs Check

### 5.1 Check for Missing Column Errors
```bash
docker compose logs fmu_db --tail=100 | grep -i "column.*does not exist"
```

**Expected**: No results

**If Errors Found**:
- Schema migration not applied
- Verify migration status again

---

### 5.2 Check Backend Error Logs
```bash
docker compose logs backend --tail=100 | grep -i "error\|exception\|traceback"
```

**Expected**: No errors (or only startup warnings)

**If Errors**:
- Review stack traces
- Check for migration issues
- Check for serializer validation errors

---

## Phase 6: Persistence Verification

### 6.1 Create and Verify Workflow

**Test**: Complete create flow from frontend, verify persistence

1. **Create Program via Frontend**:
   - Navigate to Programs
   - Create new program with structure_type = SEMESTER
   - Note the program ID (from URL or list)

2. **Verify via Admin**:
   - Open admin in new tab
   - Navigate to Programs
   - Find created program
   - **Verify**: structure_type is SEMESTER

3. **Verify via API**:
   ```bash
   curl -X GET http://localhost:8010/api/academics/programs/<id>/ \
     -H "Authorization: Bearer $TOKEN"
   ```
   - **Verify**: `"structure_type": "SEMESTER"` in response

4. **Verify via Database**:
   ```bash
   docker compose exec backend python manage.py dbshell
   ```
   ```sql
   SELECT id, name, structure_type FROM academics_program WHERE id = <id>;
   ```
   - **Verify**: structure_type column shows 'SEMESTER'

**Result**: ✅ Data persists across all layers (Frontend → API → DB)

---

### 6.2 Student with Person Link Test (If Person UI Exists)

1. **Create Person via Admin**:
   - Admin > People > Add Person
   - Create test person, note ID

2. **Create Student via Frontend** (if form exists) or Admin:
   - Link to created person
   - Save student

3. **Verify**:
   ```sql
   SELECT id, reg_no, name, person_id FROM students_student WHERE person_id = <person_id>;
   ```
   - **Verify**: person_id column populated

**Result**: ✅ Student-Person relationship works

---

## Phase 7: No 500 Errors Check

### 7.1 Admin Clickthrough
Go through admin and click on each model:
- [ ] Academics > Programs - List
- [ ] Academics > Programs - Add
- [ ] Academics > Batches - List
- [ ] Students > Students - List
- [ ] Students > Students - Add
- [ ] People > Persons - List
- [ ] Attendance > Attendance - List
- [ ] Exams > Exams - List
- [ ] Results > Results - List
- [ ] Finance > Vouchers - List

**Expected**: No 500 errors for any model list or form

---

### 7.2 Frontend Clickthrough
Navigate through frontend menus:
- [ ] Dashboard
- [ ] Academics > Programs
- [ ] Students (if exists)
- [ ] Attendance
- [ ] Finance
- [ ] Results

**Expected**: All pages load, no network 500 errors

---

## Verification Checklist

Use this checklist to track verification status:

### Backend Health
- [ ] Health endpoint returns "ok"
- [ ] students_student.person_id column exists in DB
- [ ] academics_program.structure_type column exists in DB
- [ ] people_person table exists
- [ ] academics_period table exists
- [ ] ORM smoke tests pass (no errors)

### Django Admin
- [ ] Admin login works
- [ ] Program list loads (no 500)
- [ ] Program add form shows structure fields
- [ ] Program create/save works
- [ ] Student list loads (no 500)
- [ ] Student add form shows person field
- [ ] Student create/save works
- [ ] People admin accessible and functional

### API Endpoints
- [ ] Auth login returns token
- [ ] Program list API works
- [ ] Program create API accepts structure_type
- [ ] Program retrieve API returns structure_type
- [ ] Student list API works
- [ ] Student create API accepts person field
- [ ] People API works

### Frontend
- [ ] Frontend loads (http://localhost:8080)
- [ ] Login works
- [ ] Dashboard loads
- [ ] Programs list loads
- [ ] Program create form shows structure fields
- [ ] Program create persists data
- [ ] Students pages load (if exist)
- [ ] No console errors for missing columns

### Data Persistence
- [ ] Program created via frontend persists in DB
- [ ] Program structure_type visible in admin
- [ ] Program structure_type returned by API
- [ ] Student person field accessible

### Logs
- [ ] No "column does not exist" errors in DB logs
- [ ] No 500 errors in backend logs
- [ ] No migration errors in logs

### Overall Status
- [ ] **ALL CHECKS PASSED** ✅
- [ ] System is fully recovered
- [ ] Schema aligned with code
- [ ] No missing column errors
- [ ] Admin works
- [ ] API works
- [ ] Frontend persistence works

---

## Troubleshooting Guide

### Issue: "column does not exist" error persists

**Solution**:
1. Check migration status:
   ```bash
   docker compose exec backend python manage.py showmigrations
   ```
2. If migrations not applied:
   ```bash
   docker compose exec backend python manage.py migrate
   ```
3. If migrations exist but not applied, check database connection
4. Verify correct database being used (not stale DB volume)

### Issue: 500 error on admin program page

**Solution**:
1. Check backend logs for exact error
2. If structure_type error: Migration not applied
3. If other error: Check serializer or admin configuration

### Issue: Frontend form missing fields

**Solution**:
1. Check API response for field availability
2. Verify frontend form component includes field
3. Check API serializer includes field
4. Rebuild frontend if needed

### Issue: Data not persisting

**Solution**:
1. Check network tab for failed API calls
2. Verify authorization token valid
3. Check backend logs for validation errors
4. Verify database constraints not violated

---

## Success Criteria

Verification is **COMPLETE** when:

1. ✅ No "column does not exist" errors in logs
2. ✅ Admin can create/edit Programs with structure fields
3. ✅ Admin can create/edit Students with person field
4. ✅ API accepts and returns new fields
5. ✅ Frontend can create resources and data persists
6. ✅ All admin model pages load without 500 errors
7. ✅ No console errors related to schema mismatch
8. ✅ Database schema matches model definitions
9. ✅ End-to-end workflow (Frontend → API → DB) works

**Sign Off**: _______________________ Date: _________
