# Issue Report Draft

## Issue Message (for GitHub Issue)
```
## Current Repository Status Audit

### ✅ Features ready to use
- Student admissions management: CRUD endpoints with role-aware permissions ensure students see only their own records while staff maintain full access.
- Academic structure APIs: Programs, courses, and sections endpoints provide search and ordering for curriculum planning.
- Enrollment with capacity enforcement: Enrollment serializer enforces section capacity and uniqueness constraints.
- Assessment tracking: Assessment and score models/serializers protect against invalid weights and scores.
- Attendance analytics: Attendance endpoints expose percentage, eligibility, and section summaries powered by helper utilities.
- Results lifecycle & change control: Result publication, change requests, and approval workflows are wired through dedicated models and viewsets.
- Transcript generation & verification: PDF transcripts with QR-based verification endpoints are implemented.
- Student services request desk: Students can submit transcript/bonafide/NOC requests with staff workflow transitions.
- Write-operation auditing: Middleware captures all successful writes with actor, status, and object metadata for compliance.

### ⚠️ Features needing completion or debugging
- Django app registration gaps: `corsheaders`, `simple_history`, and `django_filters` apps must be added to `INSTALLED_APPS` to match enabled middleware/backends.
- JWT/auth endpoints missing: SimpleJWT is configured but token obtain/refresh (and promised Swagger/ReDoc docs) routes are absent.
- Core/shared app placeholder: The `core` app is empty and needs its intended shared logic before other apps can rely on it.

### ⏳ Features yet to be built
- Production UI: The React frontend is still the Vite starter, so full SIMS dashboards and forms must be created.
- Swagger/ReDoc experience: URL configuration must expose schema views to deliver the documented interactive API.
- End-to-end platform integration: Remaining infrastructure (frontend integration, Postgres, Redis/Celery, Nginx/SSL) needs implementation per the architecture plan.
```

## Copilot Remediation Prompt
```
You are assisting with a Django + React SIMS project. Address the following action items:

1. **Fix Django app registrations**
   - Add `corsheaders`, `simple_history`, and `django_filters` to `INSTALLED_APPS`.
   - Confirm middleware order still places `CorsMiddleware` at the top.
   - Ensure migrations run cleanly after registration.

2. **Expose authentication & documentation endpoints**
   - Wire SimpleJWT token obtain/refresh views into `backend/config/urls.py` under `/api/auth/`.
   - Add DRF Spectacular or drf-yasg schema generation (choose one consistent with project patterns) and expose Swagger + ReDoc routes that match the README promises.
   - Update README quick-start instructions if new dependencies or commands are required.

3. **Implement core shared logic placeholder**
   - Define at least one reusable base model or mixin within the `core` app (e.g., timestamped model) and demonstrate usage by refactoring an existing app model to inherit from it.
   - Add unit tests covering the new shared logic.

4. **Frontend roadmap stub**
   - Replace the Vite counter in `frontend/src` with a placeholder dashboard layout that fetches and displays a sample API response from the backend, documenting any required environment variables.

5. **Documentation updates**
   - Summarize the above fixes in `Docs/` (create or update an appropriate markdown file) so contributors understand the current state.

Follow existing code style conventions, ensure `pytest` and relevant linters pass, and provide migration files for any model changes. Commit logically grouped changes with clear messages.
```
