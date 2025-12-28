# 🧠 FMU SIMS — Autonomous Release Execution Prompt

**Version:** 1.0.0  
**Date:** October 2025  
**Status:** Production-Ready Operational Guide

---

## Mission

Complete the FMU Student Information Management System (SIMS) project and prepare it for public release. The agent will use the pre-launch checklist as its operational roadmap to ensure every module works end-to-end.

---

## 🎯 Objectives

1. Validate backend (Django REST) functionality for all modules.
2. Complete and verify frontend integration for every API.
3. Run, fix, and pass all test suites (≥80% backend, ≥70% frontend coverage).
4. Harden security, environment, and deployment configuration.
5. Produce a stable, demo-ready, documented release.

---

## 🧩 Key Context

- **Repository:** `github.com/munaimtahir/Fmu`
- **Architecture:** Django REST Framework + React (Vite) + Postgres + Nginx + Docker
- **Documentation directory:** `/Docs`
- **Environments:** dev (Docker), staging, production
- **Reference Documents:**
  - `ACCEPTANCE_CHECKLIST.md` - PR acceptance criteria
  - `FINAL_AI_DEVELOPER_PROMPT.md` - Development guidelines
  - `CI-CD.md` - Pipeline configuration
  - `DATA-GOVERNANCE.md` - Privacy and compliance
  - `COMPLETION_REPORT.md` - Current status

---

## 🗺️ Roadmap (Action Plan)

### Phase 1 — Backend Verification

**Goal:** Ensure all Django apps are functional and database migrations are in sync.

#### Checklist

1. **Environment Setup**
   - [ ] Load `.env` file (copy from `.env.example` if needed)
   - [ ] Verify all required environment variables are set
   - [ ] Start backend locally with Docker or `python manage.py runserver`

2. **Critical Apps Verification**
   - [ ] Verify `academics` app (Programs, Courses, Terms, Sections)
   - [ ] Verify `admissions` app (Students)
   - [ ] Verify `enrollment` app (Student-Section binding)
   - [ ] Verify `attendance` app (Tracking with eligibility)
   - [ ] Verify `assessments` app (Grade components)
   - [ ] Verify `results` app (Publish/Freeze workflow)
   - [ ] Verify `transcripts` app (PDF generation with QR verification)
   - [ ] Verify `requests` app (Administrative requests)
   - [ ] Verify `audit` app (Write operation logging)

3. **Model & Migration Check**
   For each app:
   - [ ] Review `models.py` for completeness
   - [ ] Review `serializers.py` for field coverage
   - [ ] Review `views.py` for endpoint implementation
   - [ ] Review `urls.py` for route registration
   - [ ] Run `python manage.py makemigrations` (should show no changes)
   - [ ] Run `python manage.py migrate` (should apply cleanly)
   - [ ] Resolve any migration conflicts or errors

4. **Backend Tests**
   - [ ] Run test suite:
     ```bash
     cd backend
     export DB_ENGINE=django.db.backends.sqlite3
     export DB_NAME=:memory:
     pytest tests --cov=. --cov-report=term-missing --cov-fail-under=80
     ```
   - [ ] Ensure all tests pass (target: ≥220 tests)
   - [ ] Verify coverage meets 80% threshold (target: ≥90%)
   - [ ] Add missing tests for uncovered API endpoints
   - [ ] Add missing tests for model methods

5. **Backend Quality Checks**
   - [ ] Run ruff linter: `cd backend && ruff check .`
   - [ ] Run mypy type checker: `cd backend && mypy .`
   - [ ] Verify audit logging is working
   - [ ] Verify permission classes on all viewsets
   - [ ] Verify JWT token handling (obtain, refresh, verify)

6. **API Documentation**
   - [ ] Start backend server
   - [ ] Access `/api/docs` and verify Swagger UI loads
   - [ ] Access `/api/schema/` and verify OpenAPI schema is up-to-date
   - [ ] Test token authentication endpoints at `/api/auth/token/`

**Deliverables:**
- ✅ All migrations applied successfully
- ✅ All backend tests passing (≥80% coverage)
- ✅ `/api/docs` schema accessible and current
- ✅ Server logs show no errors on startup
- ✅ All linters and type checkers passing

---

### Phase 2 — Frontend Completion & Integration

**Goal:** Make every backend endpoint accessible via a working page/form.

#### Checklist

1. **Environment Setup**
   - [ ] Navigate to `/frontend` directory
   - [ ] Install dependencies: `npm ci`
   - [ ] Copy `.env.example` to `.env` if needed
   - [ ] Configure API base URL in environment

2. **Page Mapping Review**
   Review `/frontend/src/pages/` and map to API endpoints:
   - [ ] Auth pages (Login, Logout, Token Refresh)
   - [ ] Student management pages
   - [ ] Enrollment pages
   - [ ] Attendance pages
   - [ ] Assessment pages
   - [ ] Results pages
   - [ ] Transcript pages
   - [ ] Request management pages

3. **API Integration**
   For each module:
   - [ ] Verify Axios/fetch service configured with token interceptor
   - [ ] Implement missing CRUD forms with field validation
   - [ ] Implement data tables with pagination
   - [ ] Implement modals for create/edit operations
   - [ ] Add role-based view restrictions using user context
   - [ ] Test complete workflow: create → update → fetch → delete → list

4. **Frontend Tests**
   - [ ] Run test suite: `npm test -- --run`
   - [ ] Verify all tests pass (target: ≥26 tests)
   - [ ] Achieve ≥70% coverage (target: 100%)
   - [ ] Add missing component tests
   - [ ] Add missing API integration tests

5. **Frontend Quality Checks**
   - [ ] Run ESLint: `npm run lint`
   - [ ] Run TypeScript type check: `npm run type-check`
   - [ ] Fix all linting errors
   - [ ] Fix all TypeScript errors
   - [ ] Verify no console errors in browser

6. **Build Verification**
   - [ ] Run production build: `npm run build`
   - [ ] Verify build completes without errors
   - [ ] Check `dist/` output for proper assets

**Deliverables:**
- ✅ All API endpoints accessible via UI
- ✅ Dashboard, tables, and forms fully functional
- ✅ Frontend tests passing (≥70% coverage)
- ✅ ESLint and TypeScript checks passing
- ✅ Production build successful
- ✅ `FRONTEND_QA_CHECKLIST.md` updated

---

### Phase 3 — Integration & End-to-End Testing

**Goal:** Ensure frontend and backend communicate flawlessly.

#### Checklist

1. **Full Stack Startup**
   - [ ] Start all services via Docker Compose:
     ```bash
     docker compose up --build
     ```
   - [ ] Wait for all services to be healthy (database, backend, frontend)
   - [ ] Verify backend accessible at http://localhost:8000
   - [ ] Verify frontend accessible at http://localhost:5173
   - [ ] Verify Nginx proxy accessible at http://localhost

2. **Database Seeding**
   - [ ] Run migrations in Docker:
     ```bash
     docker compose exec backend python manage.py migrate
     ```
   - [ ] Seed demo data:
     ```bash
     docker compose exec backend python manage.py seed_demo --students 30
     ```
   - [ ] Verify demo users created (admin, faculty, student)

3. **End-to-End User Journey**
   Test complete workflow:
   - [ ] Login as Admin (admin / admin123)
   - [ ] Create new Student record
   - [ ] Enroll student in a section
   - [ ] Mark attendance for the student
   - [ ] Add assessment components
   - [ ] Enter scores for student
   - [ ] Publish results
   - [ ] View and verify transcript
   - [ ] Verify QR code on transcript

4. **Error Handling**
   - [ ] Test and fix any 400 Bad Request errors
   - [ ] Test and fix any 401 Unauthorized errors
   - [ ] Test and fix any 403 Forbidden errors
   - [ ] Test and fix any 404 Not Found errors
   - [ ] Test and fix any 500 Internal Server errors
   - [ ] Verify CORS headers are properly configured
   - [ ] Check browser console for JavaScript errors
   - [ ] Check Django logs for backend errors

5. **Integration Test Script**
   - [ ] Run integration test script if available:
     ```bash
     ./test_integration.sh
     ```
   - [ ] Fix any failing integration tests
   - [ ] Document any known limitations

6. **Cypress/Playwright E2E (if available)**
   - [ ] Run automated E2E test suite
   - [ ] Fix failing E2E tests
   - [ ] Record test execution logs

**Deliverables:**
- ✅ Successful end-to-end functional run
- ✅ No console or server errors
- ✅ All user workflows tested and working
- ✅ `COMPLETION_REPORT.md` updated with integration results

---

### Phase 4 — Security & Data Governance

**Goal:** Ensure compliance and privacy standards are enforced.

#### Checklist

1. **Secrets Management**
   - [ ] Verify no secrets in source code
   - [ ] Verify `.env.example` contains placeholder values only
   - [ ] Verify all secrets loaded from environment variables
   - [ ] Check `.gitignore` excludes `.env` file
   - [ ] Verify `DJANGO_SECRET_KEY` is properly externalized

2. **Production Configuration**
   - [ ] Verify `DEBUG=False` in production settings
   - [ ] Verify `ALLOWED_HOSTS` properly configured
   - [ ] Verify `SECURE_SSL_REDIRECT` enabled for production
   - [ ] Verify `SESSION_COOKIE_SECURE=True` for HTTPS
   - [ ] Verify `CSRF_COOKIE_SECURE=True` for HTTPS

3. **Authentication & Authorization**
   - [ ] Verify JWT tokens have short expiry times
   - [ ] Verify refresh tokens are rotated
   - [ ] Test role-based permissions on each API viewset
   - [ ] Verify admin endpoints require admin role
   - [ ] Verify faculty endpoints require faculty role
   - [ ] Verify student endpoints require student role
   - [ ] Test unauthorized access attempts are blocked

4. **Audit & Logging**
   - [ ] Verify audit middleware is active
   - [ ] Verify all write operations are logged
   - [ ] Check audit logs include: actor, timestamp, action, summary
   - [ ] Verify no PII in error logs
   - [ ] Verify no sensitive data in debug output

5. **Vulnerability Scanning**
   - [ ] Run Trivy on Docker images:
     ```bash
     trivy image fmu-backend:latest
     trivy image fmu-frontend:latest
     ```
   - [ ] Address any HIGH or CRITICAL vulnerabilities
   - [ ] Run CodeQL analysis (via GitHub Actions or locally)
   - [ ] Review and fix any security alerts
   - [ ] Check for dependency vulnerabilities: `npm audit`

6. **Data Governance Compliance**
   - [ ] Review `DATA-GOVERNANCE.md` requirements
   - [ ] Verify data retention policies are implemented
   - [ ] Verify GDPR/privacy compliance if applicable
   - [ ] Verify audit trail functionality matches requirements

**Deliverables:**
- ✅ Security scan clean (no HIGH/CRITICAL issues)
- ✅ No PII in error logs
- ✅ RBAC verified and functional
- ✅ Audit trail operational
- ✅ All secrets externalized

---

### Phase 5 — CI/CD & Deployment

**Goal:** Create a stable build and run it in staging.

#### Checklist

1. **Backend CI Pipeline**
   - [ ] Review `.github/workflows/backend-ci.yml`
   - [ ] Verify pipeline runs on push to backend files
   - [ ] Verify ruff linting job passes
   - [ ] Verify mypy type checking job passes
   - [ ] Verify pytest job passes with ≥80% coverage
   - [ ] Fix any CI failures

2. **Frontend CI Pipeline**
   - [ ] Review `.github/workflows/frontend-ci.yml`
   - [ ] Verify pipeline runs on push to frontend files
   - [ ] Verify ESLint job passes
   - [ ] Verify test job passes
   - [ ] Verify build job passes
   - [ ] Fix any CI failures

3. **Docker Build**
   - [ ] Build backend image: `docker build -t fmu-backend:latest backend/`
   - [ ] Build frontend image: `docker build -t fmu-frontend:latest frontend/`
   - [ ] Verify both images build successfully
   - [ ] Tag images with version: `docker tag fmu-backend:latest fmu-backend:v1.0.0`

4. **Staging Deployment**
   - [ ] Review `docker-compose.staging.yml`
   - [ ] Start staging environment:
     ```bash
     docker compose -f docker-compose.staging.yml up --build -d
     ```
   - [ ] Verify all services start successfully
   - [ ] Run migrations in staging
   - [ ] Seed staging data

5. **Nginx Configuration**
   - [ ] Verify Nginx routes frontend (port 3000 or 5173)
   - [ ] Verify Nginx routes API (port 8000)
   - [ ] Test reverse proxy functionality
   - [ ] Verify static file serving

6. **Health Checks & Smoke Tests**
   - [ ] Test API health endpoint: `curl http://localhost:8000/api/health/` or `/healthz`
   - [ ] Verify API responds with 200 OK
   - [ ] Test frontend loads in browser
   - [ ] Test login functionality
   - [ ] Test basic API operations

7. **HTTPS Setup (Production)**
   - [ ] Configure Let's Encrypt certificates (for production)
   - [ ] Test certificate validity
   - [ ] Verify HTTPS redirect works
   - [ ] Test certificate auto-renewal

**Deliverables:**
- ✅ CI pipeline green (all jobs passing)
- ✅ Docker images built successfully
- ✅ Staging environment running
- ✅ Health checks passing
- ✅ Release-ready artifacts

---

### Phase 6 — Documentation & Showcase

**Goal:** Make the system demonstrable and maintainable.

#### Checklist

1. **Core Documentation Updates**
   - [ ] Review and update `Docs/SETUP.md`
   - [ ] Review and update `Docs/ARCHITECTURE.md`
   - [ ] Review and update `Docs/API.md`
   - [ ] Review and update `Docs/DATAMODEL.md`
   - [ ] Review and update `Docs/SHOWCASE.md`
   - [ ] Review and update `README.md`

2. **API Documentation**
   - [ ] Verify OpenAPI schema is current: `Docs/openapi-schema.yaml`
   - [ ] Update API examples in documentation
   - [ ] Document all authentication endpoints
   - [ ] Document all CRUD endpoints per module
   - [ ] Include request/response examples

3. **Screenshots & Visual Documentation**
   Create screenshots/GIFs for:
   - [ ] Login page
   - [ ] Admin dashboard
   - [ ] Student management interface
   - [ ] Attendance entry page
   - [ ] Assessment configuration
   - [ ] Result publication workflow
   - [ ] Transcript generation
   - [ ] Transcript verification with QR code
   - [ ] Audit log viewer

4. **Usage Examples**
   - [ ] Add "Quick Start" guide to README
   - [ ] Add Docker setup instructions
   - [ ] Add local development setup
   - [ ] Add demo user credentials
   - [ ] Add common use cases

5. **Changelog**
   - [ ] Update `CHANGELOG.md` with version `v1.0.0`
   - [ ] List all major features
   - [ ] List breaking changes (if any)
   - [ ] List bug fixes
   - [ ] List known issues

6. **Acceptance Checklist**
   - [ ] Review `ACCEPTANCE_CHECKLIST.md`
   - [ ] Verify all items completed
   - [ ] Mark checklist as 100% complete

**Deliverables:**
- ✅ All documentation updated
- ✅ Screenshots captured and documented
- ✅ CHANGELOG.md updated to v1.0.0
- ✅ ACCEPTANCE_CHECKLIST.md 100% complete
- ✅ README.md reflects current state

---

### Phase 7 — Release & Verification

**Goal:** Tag and finalize public release.

#### Checklist

1. **Pre-Release Verification**
   - [ ] Verify all CI/CD pipelines are green
   - [ ] Verify all tests passing locally
   - [ ] Verify all linters passing
   - [ ] Verify documentation is complete
   - [ ] Verify no open critical bugs

2. **Version Tagging**
   - [ ] Update version in relevant files (package.json, etc.)
   - [ ] Commit all pending changes
   - [ ] Create git tag:
     ```bash
     git tag -a v1.0.0 -m "Release version 1.0.0"
     ```
   - [ ] Push tag to origin:
     ```bash
     git push origin v1.0.0
     ```

3. **Release Artifacts**
   - [ ] Verify GitHub Actions builds release artifacts
   - [ ] Upload Docker images to registry (if applicable)
   - [ ] Create GitHub release from tag
   - [ ] Attach release notes (from CHANGELOG)
   - [ ] Attach any binary artifacts (if applicable)

4. **Release Documentation**
   - [ ] Create `diagnostics/FINAL_SUMMARY.md` with:
     - Test coverage results
     - CI/CD status
     - Known issues
     - Deployment instructions
     - Next steps
   - [ ] Create `FMU_SIMS_RELEASE_REPORT.md` with:
     - Executive summary
     - Feature completeness
     - Test results
     - Security scan results
     - Known limitations
     - Roadmap for next patch

5. **Deployment Verification**
   - [ ] Deploy to production (if applicable)
   - [ ] Run production smoke tests
   - [ ] Verify all services healthy
   - [ ] Monitor logs for errors
   - [ ] Test critical user workflows

6. **Release Announcement**
   - [ ] Update repository description
   - [ ] Update README badges
   - [ ] Create release announcement (GitHub Discussions/Issues)
   - [ ] Notify stakeholders

**Deliverables:**
- ✅ Version v1.0.0 tagged and pushed
- ✅ GitHub release created with notes
- ✅ Release artifacts published
- ✅ Final summary documentation complete
- ✅ Production deployment successful (if applicable)

---

## ⚙️ Constraints & Guidelines

### Code Quality
- No hardcoding credentials (use environment variables)
- Maintain backward-compatible API structure
- Preserve repository structure and naming (no renames without ADR)
- Follow existing code style and patterns

### Testing Requirements
- Backend test coverage must be ≥80%
- Frontend test coverage must be ≥70%
- All tests must pass before release
- Add tests for new features

### Security Requirements
- No secrets in source code
- All API endpoints must have proper authentication
- Role-based access control on all sensitive endpoints
- Audit logging for all write operations
- No PII in logs or error messages

### CI/CD Requirements
- All CI pipelines must pass before tagging
- No force pushes or rewriting history
- All commits must be properly formatted
- Branch protection rules must be followed

---

## 📦 Expected Final Output

At completion, the following must be true:

- ✅ **Functional full-stack release** running via Docker
- ✅ **All modules operational** (admissions → transcripts) working via UI
- ✅ **CI/CD pipelines green** (backend and frontend)
- ✅ **Documentation complete** and changelog updated
- ✅ **Tagged release** `v1.0.0` ready for deployment
- ✅ **Test coverage** meets thresholds (≥80% BE, ≥70% FE)
- ✅ **Security scan clean** (no HIGH/CRITICAL vulnerabilities)
- ✅ **Demo environment** functional with seed data

---

## 🔁 Optional Post-Release Tasks

These tasks can be addressed in future releases:

- [ ] Integrate analytics dashboard for usage metrics
- [ ] Add user feedback form to student portal
- [ ] Schedule monthly audit backup verification
- [ ] Set up automated dependency updates (Dependabot)
- [ ] Implement performance monitoring (APM)
- [ ] Add internationalization (i18n) support
- [ ] Create mobile-responsive improvements
- [ ] Implement advanced search functionality
- [ ] Add export functionality (CSV, Excel)
- [ ] Create comprehensive API client libraries

---

## 📚 Reference Documents

Essential reading before executing this prompt:

1. **[ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md)** - PR acceptance criteria
2. **[FINAL_AI_DEVELOPER_PROMPT.md](FINAL_AI_DEVELOPER_PROMPT.md)** - Development guidelines
3. **[CI-CD.md](CI-CD.md)** - Pipeline configuration details
4. **[DATA-GOVERNANCE.md](DATA-GOVERNANCE.md)** - Privacy and compliance requirements
5. **[COMPLETION_REPORT.md](COMPLETION_REPORT.md)** - Current project status
6. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
7. **[SETUP.md](SETUP.md)** - Setup and deployment guide

---

## 🤖 Usage Instructions

This prompt is designed for use with autonomous AI development agents such as:
- GitHub Copilot Workspace
- Jules AI
- OpenAI Codex
- Anthropic Claude with Code
- Other LLM-based coding assistants

### How to Use

1. **Provide Context**: Share this document with the agent along with repository access
2. **Set Objective**: Point agent to specific phase or have it execute all phases sequentially
3. **Monitor Progress**: Review agent's completion of checklists in each phase
4. **Validate Output**: Verify deliverables match expected outcomes before proceeding to next phase
5. **Iterate**: If issues arise, provide feedback and have agent retry problematic steps

### Best Practices

- **Execute phases in order** - each phase builds on previous ones
- **Complete all checklist items** - don't skip steps even if they seem optional
- **Validate deliverables** - test that phase outputs actually work
- **Update documentation** - keep docs in sync as changes are made
- **Commit frequently** - make small, atomic commits for each meaningful change

---

## 📞 Support & Troubleshooting

If issues arise during execution:

1. **Check logs** - Review application and CI logs for error details
2. **Review docs** - Consult reference documents for guidance
3. **Run diagnostics** - Use provided validation scripts
4. **Isolate problem** - Test components individually to identify root cause
5. **Seek help** - Create GitHub issue with detailed error information

---

**END OF PROMPT**

---

*Last Updated: October 2025*  
*Maintained by: FMU SIMS Project Team*  
*License: MIT*
