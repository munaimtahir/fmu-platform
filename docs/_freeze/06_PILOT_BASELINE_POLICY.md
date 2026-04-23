# Pilot Baseline Policy: FMU Platform

This document defines the configuration and verification rules for the pilot baseline.

## 1. Seeded Pilot Accounts
The following 8 accounts are pre-seeded in the baseline database:

| Username | Primary Role | Initial Password |
|---|---|---|
| `pilot_admin` | Admin | `password123` |
| `pilot_registrar` | Registrar | `password123` |
| `pilot_examcell` | ExamCell | `password123` |
| `pilot_coordinator` | Coordinator | `password123` |
| `pilot_faculty` | Faculty | `password123` |
| `pilot_finance` | Finance | `password123` |
| `pilot_student` | Student | `password123` |
| `pilot_office` | Office Asst | `password123` |

## 2. ⚠️ Credential Safety Policy
- **Baseline Only**: The default password `password123` is for **controlled baseline verification only**.
- **Non-Production**: It MUST NOT be used as the credential policy for any production, shared staging, or publicly accessible environment.
- **Rotation Required**: All pilot credentials must be rotated to unique, strong passwords before any real pilot exposure or shared environment usage.

## 3. Infrastructure Verification (Immediately Usable)
On a clean baseline, the following MUST work for all pilot accounts:
- Login via `POST /api/auth/login/`.
- Identity check via `GET /api/auth/me/`.
- Access to the base `/dashboard` (Role-specific dashboards may be empty).
- Logout via `POST /api/auth/logout/`.

## 3. Domain Workflow Verification (Requires Setup)
The baseline starts with **Zero Business Data**. Before verifying business workflows, additional setup is required:

### A. Academic Setup
- **Registrar** must create Programs, Batches, and Academic Periods.
- **Admin/Registrar** must create Departments and Courses.
- **Faculty** must be assigned to Sections.

### B. Student Setup
- **Registrar** must create or import Student records.
- Students must be linked to a `User` record to login and see personal data.

### C. Workflow Flow
1. Create Academic Period -> 2. Create Student -> 3. Mark Attendance -> 4. Publish Results.

## 4. Policy on Reset
- The baseline is intended to be **Reproducible**.
- Destructive resets should restore the system to exactly these 8 accounts and clean migrations.
- Demo data should only be seeded for "Showcase" purposes, never for "Pilot Baseline" verification.
