# Final Truth Map: FMU Platform

This document is the authoritative source for the system state during the freeze period.

## 1. Product Truth
- **Active workflows**: Auth, Academics, Student Registry, Attendance, Exams/Results, Transcripts, Finance, Admin/Audit.
- **Limited workflows**: Student Intake (form-only UI; API not mounted), Dashboard (data-dependent), Gradebook (informational).
- **Frozen workflows**: Leave, Rotations, Postings.

## 2. Frontend Truth
- **Base URL**: `/`
- **Login**: `/login`
- **Dashboard**: `/dashboard` (Auto-redirects to role-specific dashboard)
- **Primary Feature Routes**:
  - `/students`, `/academics/*`, `/attendance/*`, `/exams`, `/results`, `/transcripts`, `/finance/*`
- **Public Routes**:
  - `/apply` (Intake UI), `/verify/:token` (Transcript verification)
- **System/Admin Routes**:
  - `/system/users`, `/system/audit`, `/system/settings`, `/analytics`
- **Service Layer**:
  - `frontend/src/api/`: Auth, Dashboard, Users, Settings.
  - `frontend/src/services/`: Academics, Attendance, Results, Finance, Transcripts.

## 3. Backend Truth
- **Settings Module**: `sims_backend.settings`
- **Root URL Configuration**: `sims_backend.urls`
- **Health Endpoint**: `GET /api/health/` (Now returns `status: "ok"` after set conversion fix)
- **Authentication**: `POST /api/auth/login/` (Accepts `identifier` and `password`)
- **App Modules**:
  - `sims_backend.*` (Active domain logic: academics, students, results, etc.)
  - `core` (Auth and RBAC)
  - **Inactive**: `apps.intake` (Not mounted on active API surface)

## 4. Operational Truth
- **Runtime Environment**: Docker-based.
- **Backend Port**: `8010` (mapped from `8000`)
- **Frontend Port**: `8080` (mapped from `80`)
- **Pilot Baseline**: 8 seeded role accounts (`pilot_admin`, `pilot_student`, etc.) with default password `password123`.
- **Database**: PostgreSQL (Production-like) / Cleaned of all demo/test data.

## 5. Documentation Truth
- **Canonical Docs (Authoritative)**:
  - `docs/_freeze/*.md` (This pack)
  - `docs/_cleanup/*.md` (Baseline history)
  - `docs/_stabilization/*.md` (Stabilization details)
  - `README.md` (Root overview)
- **Historical Docs (Non-Authoritative)**:
  - `docs/verification/*` (Pre-reset reports)
  - `docs/legacy/*` (Removed module info)
  - `docs/reports/*` (Old audit reports)
