# Fix Plan (Remaining Issues)

## Priority 1: Backend Test Suite
**Owner**: Backend Lead / QA
**Issue**: `backend/sims_backend/academics/tests/test_views.py` refers to non-existent `Course` model.
**Plan**:
1.  Investigate if `Course` model was renamed to `AcademicPeriod` or similar.
2.  Update test to use correct models or remove test if feature is deprecated.
3.  Re-enable test file.

## Priority 2: Docker Verification
**Owner**: DevOps
**Issue**: Could not verify runtime `docker up` due to environment permissions.
**Plan**:
1.  Run `docker compose up -d` on a staging server.
2.  Verify logs for clean startup.

## Priority 3: Secret Management
**Owner**: DevOps
**Issue**: `SECRET_KEY` logic exists but needs enforcement.
**Plan**:
1.  Ensure CI/CD pipelines inject secrets securely.
2.  Verify `check --deploy` passes in production.
