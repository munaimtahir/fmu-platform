# 04. Codebase Architecture Map

**Date Executed**: Tue May 5 09:20 UTC 2026

## Backend Overview
The Django application is split between `sims_backend` (the primary set of active applications) and potentially older or core generic applications in `backend/apps/intake` and `modules/`.
- **sims_backend Apps**: academics, admin, attendance, audit, common, compliance, exams, faculty, finance, learning, notifications, people, results, settings_app, students, syllabus, timetable, transcripts.
- **Background Jobs**: Configured via `django-rq` and `redis`.

## Frontend Overview
React 19 with Vite, utilizing TypeScript.
- **`src/api`**: Axios configuration and service endpoints.
- **`src/components`**: Shared React components.
- **`src/features`**: Domain-specific logic.
- **`src/pages`**: Top-level route components.

## Data Layer
- **PostgreSQL**: Primary datastore.
- **Redis**: Caching and RQ queue backing.