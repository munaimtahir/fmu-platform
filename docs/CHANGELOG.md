# Changelog

## 2026-01-02 - Finance Module (v1.4.0)

### Summary
- Added finance domain (FeeType, FeePlan, Voucher, LedgerEntry, Payment, Adjustment, FinancePolicy) with ledger-derived balances and reversal-only semantics.
- Integrated finance gating for transcripts/results, PDF vouchers/receipts, and defaulters/collection reports.
- Extended demo seed with finance data (paid/partial/unpaid students) and new finance/frontend workflows.

### Backend
- New `sims_backend.finance` models, services, and DRF endpoints under `/api/finance/*`.
- Finance policies block transcript and result endpoints when outstanding dues exceed thresholds.
- Seed command now provisions finance user/role, fee plans, vouchers, payments, and policies.

### Frontend
- Finance dashboard, fee plan maintenance, voucher generation UI, and student "My Fees" page.
- New finance client services and types.

---

## 2025-11-24 - Unified Authentication System (v1.3.0)

### Summary
Complete rebuild of the authentication system with a unified login flow that accepts either username or email through a single `identifier` field. This change standardizes the auth contract across backend and frontend.

### New Features

#### Backend
- **Unified Login Endpoint** (`POST /api/auth/login/`): Single endpoint that accepts either email or username via the `identifier` field
- **Logout Endpoint** (`POST /api/auth/logout/`): Invalidates refresh token with optional token blacklisting
- **Token Refresh Endpoint** (`POST /api/auth/refresh/`): New canonical endpoint for refreshing access tokens
- **User Info Endpoint** (`GET /api/auth/me/`): Returns current authenticated user information
- **Standard Error Format**: All auth endpoints return consistent error responses with error codes

#### Frontend
- **Unified Login Form**: Single form field accepting email or username
- **New User Type**: Simplified user object with `full_name` and `role` (string) instead of `firstName`/`lastName` and `roles` (array)
- **Auth Service Refactor**: New `authClient` functions for login, logout, refresh, and getCurrentUser
- **Automatic Token Refresh**: Axios interceptor updated to use new `/api/auth/refresh/` endpoint

### API Changes

#### New Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login/` | POST | Unified login (identifier + password) |
| `/api/auth/logout/` | POST | Logout and invalidate token |
| `/api/auth/refresh/` | POST | Refresh access token |
| `/api/auth/me/` | GET | Get current user info |

#### Request/Response Format
```json
// Login Request
POST /api/auth/login/
{ "identifier": "user@example.com or username", "password": "..." }

// Login Response (Success)
{
  "user": {
    "id": 1,
    "username": "...",
    "email": "...",
    "full_name": "...",
    "role": "Faculty",
    "is_active": true
  },
  "tokens": { "access": "...", "refresh": "..." }
}

// Error Response
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid username/email or password."
  }
}
```

#### Error Codes
- `AUTH_INVALID_CREDENTIALS` - Invalid username/email or password
- `AUTH_INACTIVE_ACCOUNT` - User account is disabled
- `AUTH_ACCOUNT_LOCKED` - Account locked (future feature)
- `AUTH_TOKEN_INVALID` - Invalid token
- `AUTH_TOKEN_EXPIRED` - Token expired

### Legacy Support
- Legacy endpoints (`/api/auth/token/`, `/api/auth/token/refresh/`) remain available for backward compatibility
- Frontend updated to use new endpoints; legacy endpoints are deprecated

### Breaking Changes
- Frontend `User` type changed: `firstName`/`lastName` → `full_name`, `roles[]` → `role`
- Login payload changed: `username` → `identifier`
- Components using old User type have been updated

### Files Changed

#### Backend
- `backend/core/serializers.py` - New UnifiedLoginSerializer, UserSerializer, TokenRefreshSerializer
- `backend/core/views.py` - New UnifiedLoginView, LogoutView, TokenRefreshView, MeView
- `backend/sims_backend/urls.py` - New auth routes
- `backend/tests/test_email_auth.py` - Expanded tests (24 total)

#### Frontend
- `frontend/src/features/auth/types.ts` - Updated User interface
- `frontend/src/api/auth.ts` - New auth service functions
- `frontend/src/api/axios.ts` - Updated refresh endpoint
- `frontend/src/features/auth/LoginPage.tsx` - Unified identifier field
- `frontend/src/features/auth/authStore.ts` - Updated to use /me endpoint
- `frontend/src/features/auth/useAuth.ts` - Updated login flow
- `frontend/src/components/layout/*.tsx` - Updated for new User type
- `frontend/src/pages/**/*.tsx` - Updated dashboard components

### Testing
- Backend: 274 tests passing
- Frontend: 33 tests passing
- All linters passing (ruff, mypy, eslint, tsc)

### Migration Notes
For developers:
1. Use `identifier` field instead of `username` or `email` in login requests
2. Access user's name via `user.full_name` instead of `user.firstName`/`user.lastName`
3. Access user's role via `user.role` (string) instead of `user.roles` (array)
4. New login endpoint is `/api/auth/login/` (not `/api/auth/token/`)

---

## 2025-10-27 - Autonomous Release Execution Framework (v1.2.0)

### New Features
- **Autonomous Release Prompt**: Added comprehensive `AUTONOMOUS_RELEASE_PROMPT.md` that guides AI agents through complete release execution
- **Release Validation Script**: Created `validate_release.sh` for automated validation of release readiness across all phases

### Documentation
- Added 7-phase execution guide for autonomous agents:
  - Phase 1: Backend Verification
  - Phase 2: Frontend Completion & Integration
  - Phase 3: Integration & End-to-End Testing
  - Phase 4: Security & Data Governance
  - Phase 5: CI/CD & Deployment
  - Phase 6: Documentation & Showcase
  - Phase 7: Release & Verification
- Included detailed checklists, validation criteria, and deliverables for each phase
- Added reference to autonomous prompt in README.md

### Tools & Scripts
- `validate_release.sh`: Validates repository state against release requirements
  - Checks backend tests and coverage (≥80%)
  - Checks frontend tests and coverage (≥70%)
  - Validates code quality (ruff, mypy, eslint)
  - Verifies Docker configuration
  - Validates security configuration
  - Checks CI/CD workflows
  - Confirms documentation completeness
  - Provides color-coded pass/fail/warning output

### Technical Details
- Script provides comprehensive validation across 7 release phases
- Returns exit code 0 for success, 1 for failures
- Compatible with CI/CD pipeline integration
- Self-contained with no external dependencies beyond project tools

### Files Added
- `Docs/AUTONOMOUS_RELEASE_PROMPT.md` - Comprehensive AI agent execution guide
- `validate_release.sh` - Release validation automation script

### Files Modified
- `README.md` - Added reference to autonomous prompt and validation script
- `Docs/CHANGELOG.md` - This entry

---

## 2025-10-24 - Authentication Fix (v1.1.1)

### Issue Fixed
Fixed login payload mismatch between frontend and backend authentication.

### Changes
- **Backend**: Created custom `EmailTokenObtainPairSerializer` that accepts `email` and `password` instead of `username` and `password`
- **Backend**: Added `EmailTokenObtainPairView` to handle email-based authentication
- **Backend**: Updated `/api/auth/token/` endpoint to use the new serializer
- **Tests**: Added comprehensive test suite for email-based authentication (7 tests)
- **Documentation**: Updated API.md to clarify authentication payload structure

### Technical Details
- Frontend was sending `{ email: string, password: string }`
- Backend (Django's default JWT) expected `{ username: string, password: string }`
- Solution: Custom serializer that looks up users by email field instead of username
- All existing tests pass (227 tests)
- New tests validate email authentication works correctly

### Files Changed
- `backend/core/serializers.py` - New file with EmailTokenObtainPairSerializer
- `backend/core/views.py` - New EmailTokenObtainPairView
- `backend/sims_backend/urls.py` - Updated to use custom view
- `backend/tests/test_email_auth.py` - New test file
- `Docs/API.md` - Updated authentication documentation

---

## 2025-10-23 - Final Verification & Release (v1.1.0-stable)

### Session Summary
Final verification and validation session ensuring all components of FMU SIMS are production-ready. Created official git tags and comprehensive final completion report.

### Verification Completed
- ✅ **All Tests Passing:** Backend (220 tests, 91% coverage), Frontend (26 tests, 100% pass rate)
- ✅ **All Linters Clean:** ruff, mypy, eslint, tsc - zero errors
- ✅ **Production Build:** Frontend built successfully (558 KB, gzipped 169 KB)
- ✅ **Docker Configuration:** docker-compose validated with all 6 services
- ✅ **Security Scan:** CodeQL completed with no vulnerabilities
- ✅ **Documentation:** All 13 AI-Pack documents verified and complete

### Git Tags Created
- ✅ **v1.0.0-prod** - Production baseline with core features
- ✅ **v1.1.0-stable** - Stable release with full documentation

### Quality Assurance
- Backend: 220 tests, 91% coverage (exceeds 80% requirement)
- Frontend: 26 tests, 100% pass rate
- Zero linting errors (ruff, mypy, eslint, tsc)
- Docker compose configuration validated
- All API endpoints operational
- Health monitoring active
- Backup automation verified

### Final Deliverables
- ✅ FINAL_SESSION_COMPLETION_REPORT.md - Comprehensive session documentation
- ✅ All AI-Pack documentation verified (13 files)
- ✅ Production deployment ready
- ✅ CI/CD pipelines green
- ✅ Demo data seeding functional

### Definition of Done - All Met ✅
- System fully functional end-to-end
- All tests passing with coverage thresholds met
- CI/CD pipelines operational
- Docker deployment infrastructure complete
- Monitoring and backup systems active
- Complete documentation set
- Git tags created
- Security scanning clean

---

## 2025-10-22 - Unified Full-Stack Completion (v1.1.0-stable)

### Session Summary
Completed all remaining tasks for FMU SIMS in a single autonomous session, delivering a production-ready system with full integration, deployment infrastructure, and comprehensive documentation.

### Stage 3-5 Completion Highlights

#### Development Tools & Automation
- ✅ **Makefile:** Build automation with targets: demo, build, test, lint, docker-up, docker-down
- ✅ **Integration Tests:** `test_integration.sh` script for endpoint validation
- ✅ **Demo Seed:** `python manage.py seed_demo` with configurable student count

#### Documentation Complete
- ✅ **COMPLETION_REPORT.md:** Comprehensive session summary with all metrics
- ✅ **CHANGELOG.md:** Updated with all completion work
- ✅ All AI-Pack documentation verified (AGENT.md, GOALS.md, ARCHITECTURE.md, etc.)
- ✅ API.md and DATAMODEL.md confirmed current

#### System Verification
- ✅ Backend: 220 tests passing, 91% coverage (exceeds 80% requirement)
- ✅ Frontend: 26 tests passing, build successful
- ✅ All linters clean (ruff, mypy, eslint, tsc)
- ✅ Docker compose verified with all services
- ✅ Health checks operational on all services
- ✅ Error response format consistent: `{error:{code,message,details}}`

#### Infrastructure & Deployment
- ✅ docker-compose.yml: 6 services (postgres, redis, backend, frontend, rqworker, nginx)
- ✅ docker-compose.staging.yml: Production config with SSL/TLS
- ✅ nginx.staging.conf: Security headers, rate limiting, SSL
- ✅ Health endpoint: `/healthz/` monitoring database, Redis, RQ worker
- ✅ Nightly database backup (GitHub Actions)
- ✅ Database restore script with safety checks

#### CI/CD & Quality
- ✅ Backend CI: lint + type-check + tests with 80% coverage gate
- ✅ Frontend CI: lint + build + tests
- ✅ CodeQL security scanning configured
- ✅ Coverage enforcement in pipeline
- ✅ Automated nightly backups (7-day retention)

#### Features Verified
- ✅ JWT authentication with token refresh
- ✅ Role-based access control (Admin, Faculty, Student, Registrar, ExamCell)
- ✅ 6 operational frontend pages (Attendance, Gradebook, Results, etc.)
- ✅ Async background jobs (transcript generation via RQ)
- ✅ QR token verification (48-hour validity)
- ✅ Audit logging (actor + timestamp + summary)
- ✅ CSV exports on applicable pages

### Release Information
- **v1.0.0-prod:** Production baseline with core features
- **v1.1.0-stable:** Stable release with extended features and complete docs

### Quick Start
```bash
# Using Makefile
make demo           # Setup and seed demo data
make build          # Build all components
make test           # Run all tests
make docker-up      # Start Docker services

# Manual
cd backend && python manage.py seed_demo --students 30
```

### Login Credentials (Demo)
- Admin: admin / admin123
- Faculty: faculty / faculty123
- Student: student / student123

### Next Steps (Optional)
- Deploy to production domain with SSL certificate
- Configure Sentry for error tracking
- Add Trivy container scanning
- Implement optional modules (Logbook, Workshop)

---

## 2025-10-22 - Stage 3 Feature Complete (v0.3.1-stage3)

### Backend Enhancements
- ✅ **Audit Log API:** Added `/api/audit/` endpoint with filtering by actor, entity, date range, and method
- ✅ **Attendance Same-Day Edit:** Implemented restriction preventing edits to past attendance records
- ✅ **Health Monitoring:** Existing `/healthz/` endpoint verified and operational

### Frontend Operational Pages
- ✅ **Attendance Dashboard** (`/attendance`):
  - Table view with student attendance records
  - Statistics view with section summaries
  - Real-time percentage calculations
  - Role-based access (Faculty, Admin)

- ✅ **Eligibility Report** (`/attendance/eligibility`):
  - Configurable attendance threshold
  - Multi-section selection
  - CSV export functionality
  - Eligible/ineligible student identification
  - Role-based access (Registrar, Admin)

- ✅ **Gradebook** (`/gradebook`):
  - Section-based grade management
  - Assessment weight visualization (progress meter)
  - Edit mode for score entry
  - Weighted total calculations
  - CSV export
  - Role-based access (Faculty, Student, Admin)

- ✅ **Publish Results** (`/examcell/publish`):
  - Results publishing workflow (draft → published → frozen)
  - Confirmation modals for publish and freeze actions
  - Statistics dashboard (draft/published/frozen counts)
  - Results state management
  - Role-based access (ExamCell, Admin)

- ✅ **Transcript Verify** (`/verify/:token`):
  - Public QR code verification page
  - Student information display
  - Course grades and CGPA
  - Print-friendly styling
  - 48-hour token validity

- ✅ **Audit Log Viewer** (`/admin/audit`):
  - Comprehensive filtering (actor, entity, date, method)
  - Color-coded HTTP methods and status codes
  - CSV export functionality
  - Admin-only access

### Staging Infrastructure
- ✅ **docker-compose.staging.yml:**
  - Production-ready configuration
  - SSL/TLS support with certbot integration
  - Health checks for all services
  - Automatic restart policies
  - Network isolation

- ✅ **nginx.staging.conf:**
  - HTTPS redirect configuration
  - SSL/TLS security headers
  - Rate limiting (API: 10 req/s, Login: 5 req/min)
  - Gzip compression
  - Static/media file caching
  - Reverse proxy for backend and frontend

### Documentation Updates
- ✅ **OPERATIONS.md:**
  - Staging deployment guide
  - SSL certificate setup with Let's Encrypt
  - Automated and manual backup procedures
  - Database restore procedures
  - Weekly snapshot scripts
  - Environment variable configuration

- ✅ **CHANGELOG.md:** Updated with Stage-3 changes

### Testing & Quality
- ✅ Backend: 220 tests passing, 92% coverage
- ✅ Frontend: Build successful, all TypeScript types validated
- ✅ All new pages integrated with existing auth system
- ✅ Role-based access control implemented
- ✅ CSV exports functional across all applicable pages

### Stage-3 Complete Status
**Backend:** ✅ Complete (API endpoints, audit logging, same-day edit restriction)
**Frontend:** ✅ Complete (6 operational pages, role-based routing)
**Infrastructure:** ✅ Complete (staging deployment, SSL, backups)
**Documentation:** ✅ Complete (operations guide, changelog)
**Quality:** ✅ Verified (tests passing, build successful)

### Next: E2E Testing & Screenshots
- Capture screenshots for SHOWCASE.md
- Test complete user flows
- Verify staging deployment
- Tag release v0.3.1-stage3

---

## 2025-10-21 - Stage 3 MVP Integration Complete (v0.3.0-beta)

### Frontend Infrastructure
- ✅ Created `lib/env.ts` module for environment configuration
- ✅ Fixed TypeScript compilation errors
- ✅ Verified frontend builds successfully (Vite production build)
- ✅ All frontend tests passing (26 tests, 5 test files)
- ✅ Frontend auth system with JWT token management
- ✅ Protected routes and authentication flow
- ✅ Dashboard pages for all roles (Admin, Faculty, Student, Registrar, ExamCell)
- ✅ Reusable UI components (Button, Input, DataTable, etc.)

### Backend Demo Data
- ✅ Created `seed_demo` management command for populating demo data
- ✅ Generates realistic test data for:
  - Programs (3), Courses (8), Terms (2), Sections (12)
  - Students (configurable, default 20)
  - Enrollments with attendance tracking
  - Assessments with scores and weighted grading
  - Results with draft/published/frozen states
- ✅ Demo user accounts: admin/admin123, faculty/faculty123, student/student123

### API Documentation
- ✅ Generated OpenAPI 3.0 schema (3051 lines)
- ✅ Comprehensive API endpoint documentation
- ✅ Schema includes all 6 core modules:
  - Students, Programs, Courses, Terms, Sections
  - Enrollments, Attendance, Assessments, Results, Requests

### Backend Verification
- ✅ All 220 tests passing
- ✅ 97% test coverage (exceeds 80% requirement by 17%)
- ✅ Health endpoint monitoring (database, Redis, RQ worker)
- ✅ All migrations applied successfully
- ✅ Backend running and accessible on port 8000

### Stage-3 MVP Status
**Backend:** ✅ Complete (all 6 modules operational, tested, documented)
**Frontend:** ✅ Core infrastructure ready (auth, dashboards, UI components)
**Testing:** ✅ Backend 97%, Frontend tests passing
**Documentation:** ✅ OpenAPI schema, code documentation
**Demo Data:** ✅ seed_demo command working
**CI/CD:** ✅ All workflows configured (7 workflows)

### Next: Stage-4 Enhancements
- Frontend CRUD screens for all modules
- Real-time dashboard data integration
- Transcript preview with job polling
- Enhanced reporting and analytics

---

## 2025-10-21 - Stage 4 Backend MVP (v0.4.0-stage4-backend-mvp)

### Major Features Delivered

#### Enrollment Module (Enhanced)
- ✅ POST /api/sections/{id}/enroll endpoint for section enrollment
- ✅ Duplicate enrollment prevention (409 Conflict)
- ✅ Term validation: closed terms return 400 error
- ✅ Capacity validation with detailed error messages
- ✅ Automatic term tracking from section
- ✅ Enrolled_at timestamp for audit trail

#### Assessment Module (Complete)
- ✅ Assessment types: midterm, final, quiz, assignment, project
- ✅ Weight validation: total must = 100% per section
- ✅ Score validation: score ≤ max_score
- ✅ Assessment score CRUD with student-assessment uniqueness
- ✅ Faculty write permissions for own sections

#### Results Publish/Freeze Workflow (Enhanced)
- ✅ State machine: draft → published → frozen
- ✅ POST /api/results/publish/ endpoint
- ✅ POST /api/results/freeze/ endpoint for final archival
- ✅ Dual approval via PendingChange model
- ✅ Change request workflow for published/frozen results
- ✅ Immutability enforcement: cannot edit published/frozen results
- ✅ Backward compatibility with existing is_published flag

#### Transcripts Module (Async RQ Jobs)
- ✅ generate_transcript(student_id) background job
- ✅ PDF generation with ReportLab
- ✅ QR token generation and verification (48-hour validity)
- ✅ GET /api/transcripts/{student_id} - download PDF
- ✅ POST /api/transcripts/enqueue/ - queue async generation
- ✅ GET /api/transcripts/verify/{token} - verify token
- ✅ Email support for async jobs

#### Requests Module (Complete)
- ✅ CRUD for bonafide, transcript, NOC requests
- ✅ Workflow: pending → approved → rejected → completed
- ✅ Transition endpoint for status changes
- ✅ Role-based permissions tested

#### Audit & Search (Complete)
- ✅ WriteAuditMiddleware logs all write operations
- ✅ Actor + timestamp + summary captured
- ✅ django-filters on Students (program, status)
- ✅ django-filters on Sections (term, course)
- ✅ django-filters on Programs, Courses, Terms
- ✅ Search + ordering on all major entities

#### Ops & Reliability
- ✅ Nightly backup GitHub Action (pg_dump, 7-day retention)
- ✅ restore.sh script for database restoration
- ✅ /healthz endpoint (alias for /health/)
- ✅ Health check monitors: database, Redis, RQ queue
- ✅ RQ worker configuration in docker-compose

### New Models
- **Term**: Academic periods with open/closed status
- **Result.state**: draft/published/frozen state machine
- **Enrollment.enrolled_at**: Timestamp tracking
- **Enrollment.term**: Explicit term reference

### API Enhancements
- **Terms API**: Full CRUD with status filtering
- **Enrollment**: POST /api/sections/{id}/enroll with validations
- **Results**: /api/results/freeze/ for final archival
- **Health**: /healthz alias endpoint

### Testing & Quality
- ✅ 220 tests passing
- ✅ 97% code coverage (exceeds 85% requirement)
- ✅ Ruff linting: all checks passing
- ✅ mypy type checking: clean
- ✅ Django system checks: no issues
- ✅ All migrations linear and applied

### Documentation Updates
- ✅ API.md: Complete endpoint documentation with examples
- ✅ DATAMODEL.md: Comprehensive ERD with Mermaid diagram
- ✅ DATAMODEL.md: Business rules and state machines documented
- ✅ CHANGELOG.md: This release entry

### CI/CD & Infrastructure
- ✅ Backend CI workflow: lint + type check + tests (≥80% coverage)
- ✅ CodeQL security scanning
- ✅ Nightly backup workflow with 7-day artifact retention
- ✅ Database restore script with safety checks

### Definition of Done
- ✅ All 6 core modules delivered and tested
- ✅ APIs operational with role-based auth
- ✅ Transcripts generated via RQ job + QR verification
- ✅ Coverage ≥ 85% (achieved 97%)
- ✅ Documentation updated (API, DATAMODEL, CHANGELOG)
- ✅ CI green and passing
- ✅ Backup and restore automation complete

---

## 2025-10-20 - Stage 3 Development (v0.3.0-beta) - IN PROGRESS

### Infrastructure & Background Jobs
- Added rqworker service to docker-compose.yml for async task processing
- Created background jobs for transcript generation (generate_and_email_transcript, batch_generate_transcripts)
- Added `/api/transcripts/enqueue/` endpoint for async transcript generation
- Enhanced health check endpoint with Redis/RQ component status monitoring
- Integrated django-rq for background task management

### CI/CD & Security
- **CodeQL Security Analysis:** Added workflow for Python and JavaScript security scanning
- **Trivy Scanning:** Added comprehensive security scanning for filesystem and Docker images
- **Dependency Review:** Automated dependency vulnerability checking in PRs
- **Coverage Enforcement:** Backend ≥80% (99% achieved)
- **Release Automation:** Created workflow for automated release creation with artifacts

### Testing & Quality
- All backend tests passing (220 tests, 99% coverage)
- All linting checks passing (ruff for Python, ESLint for JavaScript)
- Updated tests to handle "degraded" health status when Redis unavailable
- Frontend development happening in parallel in separate branch

### Next Steps
- Expand frontend with JWT authentication flow
- Build CRUD screens for core modules
- Add dashboard with real-time statistics
- Update remaining documentation
- Create release tag v0.3.0-beta

## 2025-10-17 - Remediation Complete
### Django Configuration
- Added `core` app to INSTALLED_APPS (was missing despite being used)
- Verified all third-party apps registered: corsheaders, django_filters, simple_history, drf_spectacular
- Confirmed middleware order with CorsMiddleware at top
- Verified migrations run cleanly with both PostgreSQL and SQLite

### Core Shared Logic Enhancement
- Refactored Program model to inherit from TimeStampedModel base class
- Created migration for Program model timestamp fields (created_at, updated_at)
- Added comprehensive unit tests for Program model timestamp functionality
- Demonstrated reusable base model pattern across multiple apps

### Documentation
- Created REMEDIATION_SUMMARY.md documenting all fixes and current system state
- All endpoints verified: JWT auth at /api/auth/token/, API docs at /api/docs/
- Frontend dashboard confirmed working with health endpoint integration
- Updated changelog with remediation summary

## 2025-10-17
- Enabled cross-origin, filtering, history, and API schema tooling in Django settings and verified migrations against SQLite for local development.
- Exposed JWT authentication endpoints and DRF Spectacular-powered Swagger/ReDoc routes that align with published README URLs.
- Added a reusable `TimeStampedModel` in the `core` app, refactored the admissions `Student` model to inherit from it, and backfilled data via migrations with accompanying tests.
- Replaced the Vite starter counter with a dashboard stub that reads the backend health endpoint using a configurable `VITE_API_BASE_URL`.
- Updated documentation and quick-start instructions to reflect the new tooling, endpoints, and frontend environment requirements.

## 2025-01-12 - Stage 1 Progress (copilot/stage-1-completion-100pct)
### Code Quality & Testing
- Applied ruff, black, and isort formatting across entire codebase
- Implemented comprehensive test suite (121 tests) achieving 96% coverage
- All linters passing (ruff, black, isort)

### Attendance Module - Enhanced
- **NEW:** Implemented attendance percentage calculation utility
- **NEW:** Added eligibility checking with 75% threshold (per RULES.md)
- **NEW:** Created section attendance summary function
- **NEW:** API endpoints for `/percentage`, `/eligibility`, `/section-summary`
- 12 comprehensive tests covering boundary cases (60%, 75%, 80%, 100%)

### Core Modules - Complete CRUD
- **Academics:** Programs, Courses, Sections with constraints and search
- **Enrollment:** Student-section binding with duplicate prevention
- **Assessments:** Assessment types and score tracking
- **Results:** Basic result model with grade tracking

### Security & Auditing
- Comprehensive permission tests for all role-based access
- Object-level permissions for students
- Audit middleware tested for all write operations

### Test Coverage by Module
- Admissions: 97% (25+ tests)
- Academics: 100% (15+ tests)
- Attendance: 96% (25+ tests) 
- Enrollment: 100% (10+ tests)
- Assessments: 100% (8+ tests)
- Results: 100% (5+ tests)
- Audit: 86% (15+ tests)
- Permissions: 92-93% (18+ tests)

### URL Configuration
- Added attendance, assessments, results, transcripts to main URLs
- All modules now accessible via REST API

### Documentation
- Created STAGE1_PROGRESS_SUMMARY.md with detailed status and remaining work

## 2025-10-11
- Implement audit logging middleware and persistence for write requests.
- Normalized admissions app source formatting to resolve syntax issues and enabled routers in project URLs.
- Added audit logging tests and ensured serializer tests run under database context.

## 2025-10-10
- Admissions Student CRUD + Search (API, permissions, tests, seed).
- Standardized error shape; pagination enabled.
- Add demo data and docs snippets (API.students.md, DATAMODEL.students.md).
