# 10. Auth, RBAC, and Permission Audit

**Date Executed**: Tue May 5 09:20 UTC 2026

## Frameworks Used
- Authentication: `djangorestframework-simplejwt`.
- Authorization: Task-based RBAC custom implementation (as specified in `GEMINI.md` and codebase observations).

## Code Observations
- The backend relies on an audit middleware (`WriteAuditMiddleware`).
- The system heavily uses role/task assignment.
- Failing backend tests in `faculty_imports` and `wave2_business_logic` may indicate issues with permission checks or missing test setup fixtures.

## Gaps
- Due to pending migrations, full E2E flow testing of different roles is unsafe/blocked.