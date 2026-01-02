# Attendance Input Methods

This document describes the three input methods delivered for attendance along with the biometric placeholder. All endpoints live under the `/api/attendance-input/` namespace and reuse existing authentication/authorization (JWT).

> **Data governance:** Attendance data follows the existing retention policy (7 years). The services avoid logging PII and only persist summary counts and minimal metadata for uploads.

## Live Tap Form

- **Roster** – `GET /api/attendance-input/live/roster/?session_id=<id>`
  - Returns the roster for the session’s group with any existing marks.
  - Response fields: `session`, `section` (group id), `date`, `default_status`, `students[{student_id, reg_no, name, status}]`
- **Submit** – `POST /api/attendance-input/live/submit/`
  - Payload: `session_id`, `date` (ISO, optional), `default_status` (defaults to `P`/present), `records` (list of `{student_id|reg_no, status}`).
  - If only absentees are sent, the service treats all other enrolled students as present.
  - Past-date edits require admin/coordinator; faculty can mark today/upcoming only.
  - Response: `{created, updated, total, absent, audit_summary}`

## CSV Upload Workflow (Dry-run then Commit)

- **Dry-run** – `POST /api/attendance-input/csv/dry-run/` (multipart)
  - Fields: `session_id`, `date`, `file`
  - Accepts headers: `reg_no,status` **or** `reg_no,roll_no,status` (status tokens: `P/A/present/absent/1/0/true/false`).
  - Validates unknown students for the session’s group, duplicate reg_nos in the file, and returns structured errors.
  - Response: `{job_id, matched, unknown, errors[], duplicates[], summary{total_rows, matched, errors}}`
- **Commit** – `POST /api/attendance-input/csv/commit/`
  - Payload: `job_id` from dry-run.
  - Upserts attendance for the linked session/date and finalizes the `AttendanceInputJob` as `COMMITTED`.

## Scanned Tick-Sheet Workflow (Phase 1 assisted)

- **Template PDF** – `GET /api/attendance-input/sheet/template/?session_id=<id>`
  - Generates a printable roster with large present/absent checkboxes.
- **Dry-run** – `POST /api/attendance-input/sheet/dry-run/` (multipart)
  - Fields: `session_id`, `date`, `file`
  - Current implementation stubs auto-detection and returns `UNKNOWN` for each student so faculty can review quickly.
  - Response: `{job_id, results[{student_id, reg_no, name, detected_status, confidence}], warnings[]}`
- **Commit** – `POST /api/attendance-input/sheet/commit/`
  - Payload: `job_id`, optional `records[{student_id, status}]` after manual review. Falls back to dry-run results if not provided.

## Biometric Placeholder

- **Punch import** – `POST /api/attendance-input/biometric/punches/`
  - Payload: `punches` array of `{student_id|reg_no, device_id?, punched_at?, raw_identifier?}`
  - Persists `BiometricPunch` rows; future mapping to attendance will correlate punches to session windows.
  - Models scaffolded: `BiometricDevice`, `BiometricPunch`.

## Demo / Seed Notes

1. Ensure demo data is loaded (`seed_demo`) to create programs, groups, sessions, faculty, and students.
2. Use `/api/timetable/sessions/` to find a session id for the roster and uploads.
3. Live flow:
   - Call roster, tap absentees in UI, submit.
4. CSV flow:
   - Download or craft `reg_no,status` CSV, dry-run, review errors, commit with `job_id`.
5. Scanned flow:
   - Download template, tick boxes on paper, scan/upload, review `UNKNOWN` entries, commit after toggling statuses on the review screen.

## Curl Examples

```bash
# Roster
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/attendance-input/live/roster/?session_id=1"

# Live submit with only absentees
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"session_id":1,"records":[{"reg_no":"REG-002","status":"A"}]}' \
  http://localhost:8000/api/attendance-input/live/submit/

# CSV dry-run
curl -X POST -H "Authorization: Bearer <token>" -F "session_id=1" -F "file=@attendance.csv" \
  http://localhost:8000/api/attendance-input/csv/dry-run/

# Sheet template
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/attendance-input/sheet/template/?session_id=1" -o sheet.pdf
```
