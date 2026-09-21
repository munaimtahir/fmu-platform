# Web ↔ Android Parity Matrix

The versioned, machine-validated source of truth is [`../parity/register.json`](../parity/register.json).
It records each in-scope role workflow, its API contract, mutation types, Android model/test
artifacts and release status. `android/scripts/check_parity_register.py` runs in Android CI and
fails when the Android schema copy drifts from the backend schema or when a registered path/artifact
is stale. Public intake, QR verification, and internal demo/style-guide routes are explicitly out
of Android scope.

The register validates the defined Android release scope; it is not a claim of complete web-product
parity. In particular, Office Assistant has no dedicated Android workflow yet, and several
Registrar, Coordinator, Faculty, and Admin web operations remain scheduled mobile work.

| Domain | Web capability | Android status | Notes |
|---|---|---|---|
| Authentication | Login, refresh, logout, profile | FOUNDATION | Native secure session implemented; profile/password parity is registered for Student release |
| Dashboard/notifications | Student dashboard, inbox, materials, fees, compliance | IMPLEMENTED | Document upload/download, statement PDF, authenticated file handling, system-viewer handoff, and tests are implemented |
| Students/academics/people | Records, programmes, batches, groups and people subrecords | IMPLEMENTED | Searchable mobile list/detail editors with server-authoritative validation |
| Timetable/attendance | Timetable, marking, eligibility | IMPLEMENTED | Student/faculty delivery plus staff timetable lifecycle and Coordinator eligibility |
| Exams/results/transcripts | Exams, components, result lifecycle, corrections, transcripts | IMPLEMENTED | Sensitive transitions require explicit confirmation; server workflow remains authoritative |
| Finance | Vouchers, payments, ledger, adjustments, reports | IMPLEMENTED | Immediate online writes with confirmations; no offline financial writes |
| Admin/audit/settings | Dashboard, users, RBAC, audit/export, settings, impersonation | IMPLEMENTED | Secure token swap blocks nesting and provides a persistent acting-as banner |
| Learning/compliance/syllabus | Materials, requirements, syllabus | IMPLEMENTED | Student materials/compliance, Faculty file/link/audience management, and Admin syllabus are implemented |
