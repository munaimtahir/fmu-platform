# FMU Platform Constitution (Repo Rules)

## Goal
One deployable platform repo (main branch) with feature modules developed in branches and merged only when complete.

## Portals (3 faces)
Every module must ship:
1. **Student/Public portal** (student-facing pages/APIs)
2. **Admin/Faculty portal** (data entry, verification, approvals, dashboards)
3. **IT/Server portal** (ops console: roles, provisioning tools, logs, exports)

And must use shared **Bridge/Core** services:
- Single Identity (Google SSO)
- Roles & Permissions
- Audit Logs
- Notifications
- Files/Documents
- API standards

## Branching rules
- `main`: always deployable
- `core/*`: identity, roles, notifications, audit, files
- `module/<name>`: one module at a time (intake, results, attendance, etc.)
- `hotfix/*`: urgent fixes to main

## Merge gate (Definition of Done)
A module branch can merge into `main` only if it has:
- Student pages working
- Admin pages working
- IT/ops minimum (roles + audit + basic exports)
- API endpoints documented (README)
- Smoke tests (login + permissions + CRUD happy path)
- Seed/demo data or fixtures for review

## API standards (DRF)
- Use versioned API prefix: `/api/v1/`
- Consistent response envelope:
  - success: `{ "ok": true, "data": ... }`
  - error: `{ "ok": false, "error": { "code": "...", "message": "...", "details": ... } }`
- All write actions must produce audit log events.

## Identity policy
- **Google = authentication**
- **FMU Platform = authorization (roles/permissions)**

Email (Workspace) is the primary unique key.
