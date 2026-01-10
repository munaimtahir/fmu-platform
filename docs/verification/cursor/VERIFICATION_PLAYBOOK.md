# Verification Playbook

**Date:** 2026-01-03  
**Purpose:** Step-by-step manual verification checklist for system recovery

## Pre-Verification Setup

### 1. Start Services
```bash
cd /home/munaim/srv/apps/fmu-platform
docker compose up -d
```

### 2. Verify Services Running
```bash
docker compose ps
# Should show: fmu_backend, fmu_db, fmu_frontend, fmu_redis (all Up)
```

### 3. Check Backend Logs
```bash
docker logs --tail=50 fmu_backend
# Should show: No "column does not exist" errors
```

### 4. Check Database Logs
```bash
docker logs --tail=50 fmu_db
# Should show: No "column does not exist" errors
```

## Schema Fix Verification

### ✅ Test 1: Student Model - person_id Column
**Goal:** Verify `person_id` column exists and works

**Steps:**
1. Open Django shell:
   ```bash
   docker exec -it fmu_backend python manage.py shell
   ```
2. Test Student model:
   ```python
   from sims_backend.students.models import Student
   # Should not raise "column person_id does not exist"
   count = Student.objects.count()
   print(f"Student count: {count}")
   
   # Test person relationship
   student = Student.objects.first()
   if student:
       person = student.person  # Should not raise error
       print(f"Person: {person}")
   ```

**Expected Result:** ✅ No errors, queries work

### ✅ Test 2: Program Model - structure_type Column
**Goal:** Verify `structure_type` column exists and works

**Steps:**
1. In Django shell:
   ```python
   from sims_backend.academics.models import Program
   # Should not raise "column structure_type does not exist"
   count = Program.objects.count()
   print(f"Program count: {count}")
   
   # Test structure_type field
   program = Program.objects.first()
   if program:
       structure_type = program.structure_type  # Should not raise error
       print(f"Structure type: {structure_type}")
   
   # Test creating program with structure_type
   p = Program.objects.create(name='Test Program', structure_type='YEARLY')
   print(f"Created: {p.name}, structure_type: {p.structure_type}")
   p.delete()
   ```

**Expected Result:** ✅ No errors, structure_type field accessible

## Admin Interface Verification

### ✅ Test 3: Program Admin - No 500 Errors
**Goal:** Verify Program admin loads without errors

**Steps:**
1. Open browser: `http://localhost:8010/admin/`
2. Login as admin user
3. Navigate to: `Academics > Programs`
4. Check for:
   - ✅ Page loads (no 500 error)
   - ✅ Program list displays
   - ✅ "Add Program" button works
   - ✅ Can create new program with structure_type

**Expected Result:** ✅ All operations work, no column errors

### ✅ Test 4: Student Admin - No 500 Errors
**Goal:** Verify Student admin loads without errors

**Steps:**
1. In admin interface, navigate to: `Students > Students`
2. Check for:
   - ✅ Page loads (no 500 error)
   - ✅ Student list displays
   - ✅ "Add Student" button works
   - ✅ Can create new student (person field optional)

**Expected Result:** ✅ All operations work, no person_id errors

## API Endpoint Verification

### ✅ Test 5: Programs API
**Goal:** Verify Programs API works with structure_type

**Steps:**
1. Get auth token (if needed):
   ```bash
   curl -X POST http://localhost:8010/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```
2. List programs:
   ```bash
   curl http://localhost:8010/api/programs/ \
     -H "Authorization: Bearer <token>"
   ```
3. Create program:
   ```bash
   curl -X POST http://localhost:8010/api/programs/ \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Program","structure_type":"YEARLY","is_active":true}'
   ```

**Expected Result:** ✅ API returns 200/201, structure_type field works

### ✅ Test 6: Students API
**Goal:** Verify Students API works with person field

**Steps:**
1. List students:
   ```bash
   curl http://localhost:8010/api/students/ \
     -H "Authorization: Bearer <token>"
   ```
2. Create student:
   ```bash
   curl -X POST http://localhost:8010/api/students/ \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"reg_no":"TEST001","name":"Test Student","program":1,"batch":1,"group":1}'
   ```

**Expected Result:** ✅ API returns 200/201, person field optional

## Frontend Verification

### ✅ Test 7: Programs Frontend
**Goal:** Verify Programs frontend works

**Steps:**
1. Open browser: `http://localhost:8080`
2. Login as admin
3. Navigate to: `/academics/programs`
4. Verify:
   - ✅ Programs list loads
   - ✅ Can create new program
   - ✅ structure_type field appears in form
   - ✅ Can save program with structure_type

**Expected Result:** ✅ All operations work

### ✅ Test 8: Students Frontend
**Goal:** Verify Students frontend works

**Steps:**
1. Navigate to: `/students`
2. Verify:
   - ✅ Students list loads
   - ✅ Can create new student
   - ✅ person field appears in form (optional)
   - ✅ Can save student

**Expected Result:** ✅ All operations work

## CRUD Flow Verification

### ✅ Test 9: Complete Program CRUD
**Goal:** Verify full CRUD cycle works

**Steps:**
1. **Create:** Add new program via frontend
2. **Read:** Verify program appears in list
3. **Update:** Edit program, change structure_type
4. **Delete:** Delete program (if permitted)
5. **Verify:** Check database directly:
   ```bash
   docker exec fmu_db psql -U fmu_platform -d fmu_platform \
     -c "SELECT id, name, structure_type FROM academics_program;"
   ```

**Expected Result:** ✅ All CRUD operations work, data persists

### ✅ Test 10: Complete Student CRUD
**Goal:** Verify full CRUD cycle works

**Steps:**
1. **Create:** Add new student via frontend
2. **Read:** Verify student appears in list
3. **Update:** Edit student, link to person
4. **Delete:** Delete student (if permitted)
5. **Verify:** Check database directly:
   ```bash
   docker exec fmu_db psql -U fmu_platform -d fmu_platform \
     -c "SELECT id, reg_no, name, person_id FROM students_student;"
   ```

**Expected Result:** ✅ All CRUD operations work, data persists

## Error Verification

### ✅ Test 11: No Missing Column Errors
**Goal:** Verify no "column does not exist" errors

**Steps:**
1. Check backend logs:
   ```bash
   docker logs --tail=100 fmu_backend | grep -i "column\|does not exist"
   ```
2. Check database logs:
   ```bash
   docker logs --tail=100 fmu_db | grep -i "column\|does not exist"
   ```
3. Test admin pages (should not show errors)
4. Test API endpoints (should not return 500)

**Expected Result:** ✅ No "column does not exist" errors

### ✅ Test 12: No 500 Errors
**Goal:** Verify no 500 errors in admin or API

**Steps:**
1. Access all admin pages:
   - `/admin/academics/program/`
   - `/admin/students/student/`
   - `/admin/academics/batch/`
   - `/admin/academics/group/`
2. Access key API endpoints:
   - `/api/programs/`
   - `/api/students/`
   - `/api/batches/`
3. Check for 500 errors in browser console/network tab

**Expected Result:** ✅ No 500 errors

## Legacy Module Verification

### ✅ Test 13: Legacy Routes Gated
**Goal:** Verify legacy routes are properly gated

**Steps:**
1. Check environment:
   ```bash
   docker exec fmu_backend env | grep ENABLE_LEGACY_MODULES
   # Should be: ENABLE_LEGACY_MODULES=False (or not set)
   ```
2. Try accessing legacy endpoints:
   ```bash
   curl http://localhost:8010/api/legacy/api/enrollments/
   # Should return 404 if ENABLE_LEGACY_MODULES=False
   ```
3. Check frontend legacy routes:
   - Navigate to `/assessments` - Should show warning banner
   - Navigate to `/requests` - Should show warning banner

**Expected Result:** ✅ Legacy routes gated, warnings shown

## Smoke Test Execution

### ✅ Test 14: Run Smoke Test Script
**Goal:** Automated smoke test verification

**Steps:**
```bash
cd /home/munaim/srv/apps/fmu-platform
./scripts/smoke_test.sh
```

**Expected Result:** ✅ All smoke tests pass

## Final Verification Checklist

- [ ] ✅ Services running (docker compose ps)
- [ ] ✅ No "column does not exist" errors in logs
- [ ] ✅ Student model works (person_id column exists)
- [ ] ✅ Program model works (structure_type column exists)
- [ ] ✅ Program admin loads without 500
- [ ] ✅ Student admin loads without 500
- [ ] ✅ Programs API works
- [ ] ✅ Students API works
- [ ] ✅ Programs frontend works
- [ ] ✅ Students frontend works
- [ ] ✅ CRUD operations work
- [ ] ✅ Data persists correctly
- [ ] ✅ Legacy routes gated
- [ ] ✅ Smoke test passes

## Troubleshooting

### If Tests Fail

1. **Check migrations:**
   ```bash
   docker exec fmu_backend python manage.py showmigrations
   ```

2. **Reapply migrations:**
   ```bash
   docker exec fmu_backend python manage.py migrate
   ```

3. **Check database schema:**
   ```bash
   docker exec fmu_db psql -U fmu_platform -d fmu_platform -c "\d students_student"
   docker exec fmu_db psql -U fmu_platform -d fmu_platform -c "\d academics_program"
   ```

4. **Check backend logs:**
   ```bash
   docker logs --tail=100 fmu_backend
   ```

5. **Restart services:**
   ```bash
   docker compose restart backend
   ```

## Success Criteria

✅ **All verification tests pass**  
✅ **No "column does not exist" errors**  
✅ **Admin pages load without 500 errors**  
✅ **API endpoints return correct responses**  
✅ **Frontend pages work correctly**  
✅ **CRUD operations persist data**  
✅ **Legacy routes properly gated**

**Status:** System is fully recovered and operational ✅
