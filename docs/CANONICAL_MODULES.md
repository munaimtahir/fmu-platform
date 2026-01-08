# Canonical Modules (Single Source of Truth)

## Purpose
This file declares the authoritative modules for each business domain.
No new development should be added to non-canonical modules unless explicitly approved.

## Canonical Ownership

### Identity & Auth
- Canonical: core, people
- Notes: Unified auth endpoints are canonical (/api/auth/login, /refresh, /me)

### Student Registry (Enrolled Students)
- Canonical: students
- Non-canonical: admissions (must not store the long-term student record)

### Academic Structure
- Canonical: academics
- Notes: programs/courses/sections live here (or via academics-related feature modules)

### Attendance
- Canonical: attendance

### Exams + Marks + Publishing
- Canonical: exams + results
- Non-canonical: assessments (legacy; do not extend)

### Transcripts
- Canonical: transcripts
- Data source: results (single source of truth)

### Finance
- Canonical: finance (if enabled for current rollout)

### Audit
- Canonical: audit

### Public Intake / Apply
- Canonical: apps.intake
- Non-canonical: admissions (legacy; disable unless needed for unique workflows)

## UI Canonical Screens
- Keep: dashboards, students, academics, attendance, exams, results, transcripts, finance, audit, apply
- Remove from navigation: legacy screens and overlapping flows
