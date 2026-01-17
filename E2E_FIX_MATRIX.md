# E2E Fix Sprint - Triage Matrix

## Issue Tracking

| Issue | Symptom | Layer | Repro Steps | Endpoint(s) | Owner | Test Added | Status |
|-------|---------|-------|-------------|-------------|-------|------------|--------|
| A1: Redis | Redis connection errors, health check fails | BE | Start app without Redis | `/api/health/` | BE | ✅ | ✅ |
| A2: Migrations | Migrations blocked or not documented | BE | Run migrations in fresh env | `manage.py migrate` | BE | ✅ | ✅ |
| B: Academic Structure CRUD | No UI for batches, periods, groups | FE | Admin tries to create batch/period/group | `/api/academics/batches/`, `/api/academics/terms/`, `/api/academics/groups/` | FE | ✅ | ✅ |
| C: Departments | Create/delete not working | BE/FE | Admin creates/deletes department | `/api/academics/departments/` | Both | ✅ | ✅ |
| D1: Program batches | Batch change not showing in batches tab | FE | Update program, check batches tab | `/api/academics/programs/{id}/` | FE | ✅ | ✅ |
| D2: Program delete | Can't delete programs | BE | Delete program with batches | `/api/academics/programs/{id}/` | BE | ✅ | ✅ |
| E1: Course ID | Sections wants course ID number only | FE | Create section with course | `/api/academics/sections/` | FE | ✅ | ✅ |
| E2: Course create | Failed to add courses | BE/FE | Create new course | `/api/academics/courses/` | Both | ✅ | ✅ |
| F: Student reg_no | Registration number not saved | BE/FE | Create/update student | `/api/students/` | Both | ⏳ | ⏳ |
| G: Notifications | Notification icon not working | BE/FE | Check bell icon, unread count | `/api/notifications/` | Both | ⏳ | ⏳ |
| H1: Timetable 404 | 404 on edit/publish | BE/FE | Edit or publish timetable | `/api/timetable/sessions/{id}/` | Both | ⏳ | ⏳ |
| H2: Timetable periods | Need exactly 3 periods before publish | BE | Publish with != 3 periods | `/api/timetable/sessions/{id}/publish/` | BE | ⏳ | ⏳ |
| I: Attendance | Marking/viewing not working | BE/FE | Mark attendance, view summary | `/api/attendance/`, `/api/attendance-input/` | Both | ⏳ | ⏳ |
| J: Bulk upload groups | Auto-generate groups corrupts groups tab | BE | Bulk upload students | `/api/admin/students/import/` | BE | ⏳ | ⏳ |
| K: Bulk upload DOB | DOB format mismatch (yy/mm/dd vs dd/mm/yy) | BE | Import CSV with various DOB formats | `/api/admin/students/import/` | BE | ⏳ | ⏳ |

## Legend
- ✅ = Complete
- ⏳ = In Progress
- ❌ = Blocked
- BE = Backend
- FE = Frontend
- Both = Requires both backend and frontend changes
