# Web ↔ Android Parity Matrix

The versioned, machine-validated source of truth is [`../parity/register.json`](../parity/register.json).
It records each in-scope role workflow, its API contract, mutation types, Android model/test
artifacts and release status. `android/scripts/check_parity_register.py` runs in Android CI and
fails when the Android schema copy drifts from the backend schema or when a registered path/artifact
is stale. Public intake, QR verification, and internal demo/style-guide routes are explicitly out
of Android scope.

| Domain | Web capability | Android status | Notes |
|---|---|---|---|
| Authentication | Login, refresh, logout, profile | FOUNDATION | Native secure session implemented; profile/password parity is registered for Student release |
| Dashboard/notifications | Student dashboard, inbox, materials, fees, compliance | IMPLEMENTED | Document upload/download, statement PDF, authenticated file handling, system-viewer handoff, and tests are implemented |
| Students/academics/people | Records, programmes, courses, sections | PLANNED | Future parity sprint |
| Timetable/attendance | Timetable, marking, eligibility | IN PROGRESS | Student timetable and Faculty live attendance are implemented; eligibility remains planned |
| Exams/results/transcripts | Gradebook, results, publication, transcripts | PLANNED | Server workflow remains authoritative |
| Finance | Vouchers, payments, reports | PLANNED | No offline financial writes |
| Admin/audit/settings | Users, roles, audit, configuration | PLANNED | Foundation only |
| Learning/compliance/syllabus | Materials, requirements, syllabus | IN PROGRESS | Student materials/compliance implemented; Faculty management and syllabus remain planned |
