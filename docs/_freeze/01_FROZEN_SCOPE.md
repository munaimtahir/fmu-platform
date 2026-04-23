# Frozen Scope: FMU Platform

This document defines the boundary of the active application surface under the current freeze.

## 🟢 Active Surface (In-Scope & Functional)
These workflows are intended to be functional and integrated in the pilot baseline.

- **Authentication & Identity**: Login, Me, Token Refresh, Logout.
- **Academic Management**: Programs, Batches, Academic Periods, Groups, Departments, Courses, Sections.
- **Student Registry**: Official student records (read/list).
- **Attendance**: Marking attendance (single/bulk), Eligibility reporting.
- **Exams & Results**: Exam definition, Result entry (draft), Publishing results, Freezing results.
- **Transcripts**: Official generation, Public QR verification.
- **Financial Operations**: Fee plans, Voucher generation, Payment tracking, Financial reports, Student own-read ledger.
- **System Administration**: User management, Audit logs, Dashboard stats, RBAC configuration.

## 🟡 Limited / Degraded Surface (In-Scope but with constraints)
- **Student Intake**: The public application form (`/apply`) exists as a **limited UI surface only**. The backend API (`apps.intake`) is **NOT MOUNTED** on the active API surface. Submission and review workflows are NOT part of the active pilot baseline.
- **Dashboard**: High-level stats work for admins; role-specific dashboard views exist but depend on specific domain data setup.
- **Gradebook**: Informational only; legacy write operations have been removed. Working with limits.

## 🔴 Inactive / Absent Surface (Out of Scope / Removed)
These were either removed during cleanup or never fully implemented.

- **Legacy Admissions**: Replaced by Phase 1 Student Intake.
- **Legacy Assessments**: Replaced by Exams/Results module.
- **Legacy Enrollment**: Tracking now handled directly via Student Registry.
- **Legacy Notifications**: Stale implementation removed.

## ❄️ Explicitly Frozen-Out (Disallowed for this sprint)
- **Leave Management**: NOT IN ACTIVE API SURFACE.
- **Rotations**: NOT IN ACTIVE API SURFACE.
- **Postings**: NOT IN ACTIVE API SURFACE.
- **Speculative Refactors**: Any change not required for truth alignment is deferred.
