# Known Limitations

**Last Updated:** 2026-01-03  
**Purpose:** Document current system limitations, workarounds, and known issues for developers and operators.

---

## Frontend Limitations

### Build and Development

- ⚠️ **Node.js/npm not available in system PATH** - Frontend builds require Node.js environment setup
  - **Workaround:** Use Docker containers for frontend builds (`docker-compose build frontend`)
  - **Impact:** Cannot run `npm run build` directly on host without Node.js installation

### Dashboard Data Integration

- ✅ **Admin Dashboard Real Data** - Admin dashboard now uses real counts from list endpoints
  - **Location:** `frontend/src/pages/dashboards/AdminDashboard.tsx`
  - **Implementation:** Uses service layer (studentsService, programsService, coursesService, etc.) to fetch counts from paginated list endpoints
  - **Status:** Fully integrated with real API data

- ⚠️ **Student Dashboard Hardcoded Data** - Dashboard displays static/hardcoded statistics
  - **Location:** `frontend/src/pages/dashboards/StudentDashboard.tsx`
  - **Impact:** Students see incorrect/mock data instead of real statistics
  - **Fix Required:** Integrate with `/api/dashboard/stats/` endpoint
  - **Status:** Non-blocking for staging/testing, should be fixed before production

- ⚠️ **Faculty Dashboard Hardcoded Data** - Dashboard displays static/hardcoded statistics
  - **Location:** `frontend/src/pages/dashboards/FacultyDashboard.tsx`
  - **Impact:** Faculty see incorrect/mock data instead of real statistics
  - **Fix Required:** Integrate with `/api/dashboard/stats/` endpoint
  - **Status:** Non-blocking for staging/testing, should be fixed before production

### Missing Frontend Pages

- ⚠️ **Finance Reports UI** - Backend APIs are ready, but frontend pages not implemented
  - **Missing Pages:**
    - Defaulters report page
    - Collection report page
    - Aging report page
    - Student statement page (backend PDF generation available)
  - **Status:** Backend fully functional, frontend pending

- ⚠️ **Transcript Preview UI** - Backend supports transcript generation, but UI preview not implemented
  - **Impact:** Users cannot preview transcripts before downloading
  - **Status:** Backend ready, frontend pending

- ⚠️ **Job Status Polling Interface** - Background job status monitoring UI not implemented
  - **Impact:** Users cannot track async job progress (e.g., transcript generation)
  - **Status:** Backend supports async jobs, frontend polling pending

### Architecture Inconsistencies

- ⚠️ **Mixed API Patterns** - Some pages use direct API calls instead of service layer
  - **Impact:** Architectural inconsistency, harder to maintain
  - **Recommendation:** Standardize on service layer pattern
  - **Status:** Low priority, refactoring opportunity

---

## Backend Limitations

### Test Coverage

- ⚠️ **Test Coverage Below Target** - Current coverage is ~27-31% (target was 80%)
  - **Context:** Many test files were moved to `tests_disabled/` due to broken references
  - **Impact:** Reduced confidence in code changes
  - **Status:** Tests pass, but coverage measurement needs improvement
  - **Recommendation:** Re-enable and fix disabled tests incrementally

### Result Immutability

- ⚠️ **Published Results Can Be Field-Updated** - Status changes are blocked, but field updates allowed
  - **Location:** Result model/views
  - **Impact:** Data integrity risk - published results should be immutable
  - **Status:** Partial enforcement, needs full immutability for published status

### Attendance Input Tests

- ⚠️ **Test Timeout Issues** - Some attendance input tests hang (exit code 137)
  - **Impact:** Intermittent test failures
  - **Details:** See `docs/ATTENDANCE_INPUTS_TEST_REPORT.md`
  - **Status:** Known issue, tests verify database state directly as workaround

- ⚠️ **Records Processing Issue** - Some tests show records not being processed correctly
  - **Impact:** 2-3 tests failing/hanging
  - **Next Steps:** Investigate DRF request parsing for nested lists
  - **Workaround:** Tests verify database state directly

- ⚠️ **Sheet Commit Status Parsing** - Status "A" not parsed correctly in some cases
  - **Impact:** 1 test failing
  - **Status:** Needs investigation

### Background Jobs

- ⚠️ **Redis Optional** - Redis is optional, but required for background jobs
  - **Impact:** Background jobs (transcript generation, email notifications) disabled without Redis
  - **Recommendation:** Include Redis in production for full functionality
  - **Status:** System degrades gracefully without Redis

- ⚠️ **Email Notifications Not Fully Tested** - Using console backend for testing
  - **Impact:** Email delivery not verified in production-like environment
  - **Status:** Functional but needs production testing

### PDF Generation

- ⚠️ **Transcript PDFs Not Persisted** - Generated on-demand, not stored
  - **Impact:** Each request regenerates PDF (performance consideration)
  - **Status:** By design, but could be optimized with caching

### Rate Limiting

- ⚠️ **No Rate Limiting Implemented** - API endpoints have no rate limiting
  - **Impact:** Vulnerability to abuse/DoS
  - **Recommendation:** Implement rate limiting before production
  - **Status:** Security enhancement needed

### API Documentation

- ⚠️ **Some Endpoints Lack OpenAPI Decorators** - Warnings in schema generation
  - **Impact:** Incomplete API documentation
  - **Status:** Non-blocking, enhancement opportunity

---

## Infrastructure Limitations

### Docker Compose

- ⚠️ **docker-compose Command Not in PATH** - May require `docker compose` (newer syntax) or installation
  - **Workaround:** Use `docker compose` (space, not hyphen) or install docker-compose
  - **Status:** Configuration file is valid, just command availability issue

### Development Environment

- ⚠️ **Node.js Not Available** - Required for frontend development
  - **Workaround:** Use Docker containers for all frontend operations
  - **Status:** Docker-based workflow works, local development needs setup

---

## Data Integrity

### Constraints

- ✅ **Enrollment Uniqueness** - Properly enforced
- ✅ **Attendance Uniqueness** - Properly enforced
- ✅ **Result Uniqueness** - Properly enforced
- ✅ **Foreign Key Integrity** - Correctly configured
- ✅ **Audit Log Immutability** - Enforced
- ⚠️ **Result Immutability** - Partially enforced (see Backend Limitations)

---

## Performance Considerations

### Database

- ⚠️ **N+1 Query Potential** - Some endpoints may have query optimization opportunities
  - **Status:** Generally good, but should monitor with production load
  - **Recommendation:** Use Django Debug Toolbar or query profiling in development

### Caching

- ⚠️ **No Caching Strategy** - Redis available but not extensively used for caching
  - **Impact:** Repeated queries to database
  - **Recommendation:** Implement caching for frequently accessed data
  - **Status:** Enhancement opportunity

---

## Security Considerations

### Authentication & Authorization

- ✅ **JWT Authentication** - Implemented and working
- ✅ **Role-Based Access Control** - Properly enforced
- ✅ **Audit Logging** - Comprehensive coverage
- ⚠️ **Rate Limiting** - Not implemented (see Backend Limitations)

### Data Privacy

- ✅ **PII Redaction in Audit Logs** - Sensitive fields properly redacted
- ✅ **Input Validation** - Comprehensive validation in place

---

## Legacy Modules

### Configuration

- ⚠️ **Legacy Modules Gated** - Enrollment, Assessments, Requests modules behind feature flags
  - **Environment Variables:**
    - `ENABLE_LEGACY_MODULES` (default: `false`)
    - `ALLOW_LEGACY_WRITES` (default: `false`)
  - **Impact:** Legacy endpoints not accessible by default
  - **Status:** By design, see `docs/OPERATIONS.md` for details

### Migration Path

- ⚠️ **Legacy to Canonical Migration** - Legacy modules to be replaced by canonical equivalents
  - **Status:** Legacy modules preserved for compatibility, canonical modules preferred
  - **Recommendation:** Use canonical modules for new development

---

## Documentation Gaps

### Missing Documentation

- ⚠️ **SHOWCASE.md Screenshots** - UI screenshots not yet added
  - **Impact:** Limited visual documentation
  - **Status:** Requires running UI and taking screenshots

- ⚠️ **Troubleshooting Guide** - Comprehensive troubleshooting section needed
  - **Status:** Basic troubleshooting in `docs/OPERATIONS.md`, could be enhanced

### Coverage Measurement

- ⚠️ **Frontend Test Coverage Measurement** - Not configured
  - **Impact:** Cannot track frontend test coverage metrics
  - **Status:** Tests pass, but coverage reporting not set up

---

## Production Readiness Checklist

### ✅ Ready for Production

- Docker Compose configuration
- Database migrations system
- Health check endpoints
- Backup automation scripts
- SSL/TLS support (Caddy)
- Audit logging
- Role-based access control

### ⚠️ Should Address Before Production

1. **Rate Limiting** - Implement API rate limiting
2. **Dashboard Data Integration** - Fix hardcoded data in Student/Faculty dashboards (Admin dashboard now uses real data)
3. **Result Immutability** - Full enforcement for published results
4. **Test Coverage** - Improve test coverage to meet target (80%)
5. **Frontend Finance Reports** - Complete frontend UI for finance reports
6. **Email Testing** - Test email delivery in production-like environment

### 🔄 Ongoing Enhancements

- Caching strategy implementation
- Query optimization review
- Frontend test coverage measurement setup
- API documentation completion
- UI screenshot documentation

---

## Workarounds

### Development

- **Frontend Build:** Use Docker containers (`docker-compose build frontend`)
- **Backend Linting:** Use Docker containers (`docker-compose exec backend ruff check .`)
- **Database Access:** Use `docker-compose exec db psql -U fmu_platform -d fmu_platform`

### Testing

- **Attendance Tests:** Tests verify database state directly as workaround for parsing issues
- **Email Testing:** Use console backend, check logs instead of actual delivery

### Production

- **Redis Dependency:** System works without Redis, but background jobs disabled
- **Legacy Modules:** Disabled by default via environment flags

---

## Monitoring & Alerts

### Health Checks

- ✅ **Health Endpoint** - `/api/health/` provides comprehensive health status
- ✅ **Database Check** - Included in health endpoint
- ✅ **Migration Check** - Included in health endpoint
- ⚠️ **Redis Check** - Optional, doesn't affect readiness status

### Metrics

- ⚠️ **No Metrics Collection** - No Prometheus/StatsD integration
  - **Recommendation:** Add metrics collection for production monitoring
  - **Status:** Enhancement opportunity

---

## Support & Troubleshooting

For issues related to these limitations:

1. Check `docs/OPERATIONS.md` for operational procedures
2. Review `docs/QA_SMOKE_TEST.md` for smoke test procedures
3. Check `docs/ATTENDANCE_INPUTS_TEST_REPORT.md` for attendance-specific issues
4. Review CI workflow status in `.github/workflows/`

---

**Note:** This document is maintained as part of the integration hardening process. Limitations marked with ⚠️ should be addressed before production deployment or during ongoing maintenance.