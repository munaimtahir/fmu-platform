# Phase 1 Development Kickoff Plan

## 1. Product Context & Success Criteria
- **Problem & users.** SIMS digitizes student lifecycle workflows for FMU stakeholders (admins, coordinators, exam cell, faculty, finance, students) to replace paper processes.【F:Docs/APP_DESCRIPTION.md†L1-L14】
- **Phase 1 scope.** Deliver core academic digitization—program setup, student registry, course/term management, attendance, assessments, reports, RBAC, and audit/logging within 6–8 weeks.【F:Docs/ROADMAP.md†L1-L8】
- **MVP goals.** Pilot with ~500 students and 10 teachers; ensure reliable attendance and results reporting with exportable outputs; lay groundwork for later integrations.【F:Docs/GOALS.md†L1-L4】

## 2. Architecture & Foundational Decisions
- **Stack alignment.** Confirm Django REST backend, React SPA frontend, Postgres, and Nginx proxy. Plan for background worker (Django-Q/RQ) to handle PDFs, backups, and notifications; local storage now, S3 later.【F:Docs/ARCHITECTURE.md†L1-L7】
- **Environment setup.** Finalize Docker-based dev workflow using provided compose file; enforce .env secrets handling, migrations via Docker exec, and superuser bootstrap steps.【F:Docs/SETUP.md†L1-L9】
- **Data model blueprint.** Validate initial schema entities (programs, cohorts, courses, students, admissions, attendance, assessments, results, transcripts, documents, requests) before migration scaffolding.【F:Docs/DATAMODEL.md†L1-L15】

## 3. Workstream Breakdown (First 3 Sprints ~2 weeks each)
### Sprint 0 – Project Foundations (Week 0–1)
1. **Repo scaffolding.** Initialize Django project/app structure and Vite React app with shared lint/test configs; wire GitHub Actions per CI/CD expectations.【F:Docs/CI-CD.md†L1-L7】【F:Docs/TASKS.md†L1-L3】
2. **Dev tooling.** Configure pre-commit (ruff, black, mypy), pytest, coverage, and frontend ESLint/Prettier/Test tooling; document in CONTRIBUTING.
3. **RBAC strategy.** Design role hierarchy and permission matrix aligning with stakeholder list; capture in ADR or docs for implementation guidance.【F:Docs/APP_DESCRIPTION.md†L5-L11】
4. **Database migrations plan.** Translate data model into Django models, including constraints for admissions, attendance, assessments, and transcripts; prepare seed data fixtures for pilot scale.【F:Docs/DATAMODEL.md†L1-L15】【F:Docs/TESTS.md†L1-L6】
5. **Backlog refinement.** Break Phase 1 checklist into user stories with acceptance criteria referencing QA checklist, ensuring traceability for later testing.【F:Docs/TASKS.md†L1-L9】【F:Docs/QA-CHECKLIST.md†L1-L7】

### Sprint 1 – Core Entities & Authentication (Week 1–2)
1. **Auth & RBAC implementation.** Set up JWT auth, role-based permissions, and audit logging endpoints aligning with QA expectations.【F:Docs/TASKS.md†L2-L5】【F:Docs/QA-CHECKLIST.md†L1-L7】
2. **Program & student registry.** Build CRUD APIs and React forms for university, programs, cohorts, terms, courses, and student admission profiles with document uploads.【F:Docs/ROADMAP.md†L2-L7】【F:Docs/API.md†L1-L6】
3. **Data import/export foundations.** Establish CSV template validation service for student and attendance data to de-risk later attendance import work.【F:Docs/ROADMAP.md†L2-L7】【F:Docs/API.md†L5-L7】
4. **Testing baseline.** Implement backend unit/API tests for auth and core CRUD, plus frontend component tests for forms; set up seed fixtures for 500 students.【F:Docs/TESTS.md†L1-L10】

### Sprint 2 – Attendance & Assessment Workflows (Week 3–4)
1. **Attendance management.** Deliver CSV import endpoint, manual entry UI, and eligibility reporting baseline per roadmap and API design.【F:Docs/ROADMAP.md†L4-L7】【F:Docs/API.md†L5-L8】
2. **Assessment schema & marks.** Implement assessment scheme/component models, batch marks entry API, and frontend flows for coordinators and exam cell.【F:Docs/DATAMODEL.md†L7-L11】【F:Docs/API.md†L7-L9】
3. **Reporting outputs.** Generate attendance eligibility and defaulter reports (CSV/PDF), with smoke tests for PDF generation and audit logging.【F:Docs/API.md†L6-L10】【F:Docs/TESTS.md†L3-L6】
4. **Quality gates.** Run end-to-end Playwright scenario for attendance capture and marks publication; align QA checklist coverage.【F:Docs/TESTS.md†L8-L10】【F:Docs/QA-CHECKLIST.md†L2-L5】

## 4. Cross-Cutting Concerns
- **Security & compliance.** Enforce strict env-based secrets, RBAC, input validation, and audit logs in line with agent guardrails and QA list.【F:Docs/QA-CHECKLIST.md†L1-L7】
- **Documentation.** Maintain updated setup guide, API docs, and changelog; capture decisions in lightweight ADRs to support future phases.
- **Deployment readiness.** Prepare Docker images and GitHub Actions pipeline for staging deployment once core features stabilize.【F:Docs/CI-CD.md†L1-L7】

## 5. Immediate Next Actions
1. Conduct stakeholder walkthrough to confirm Phase 1 acceptance criteria and prioritize Sprint 0 backlog items.
2. Kick off Sprint 0 with pairing sessions to scaffold backend/frontend repos and establish shared component library patterns.
3. Schedule architecture review checkpoint at end of Sprint 0 to validate data model, RBAC design, and CI/CD pipeline readiness before feature build-out.
