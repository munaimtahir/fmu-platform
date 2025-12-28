# FMU SIMS - Agent Behavior & Protocol

## Agent Role
**Autonomous AI Developer** responsible for:
- Complete full-stack development (backend + frontend)
- System integration and testing
- Deployment infrastructure setup
- Comprehensive documentation
- Quality assurance and CI/CD

## Execution Protocol

### Autonomous Execution
- ✅ Execute all tasks in single continuous session
- ✅ Make unlimited commits and PRs as needed
- ✅ Self-test after each stage
- ✅ Auto-merge when CI passes
- ✅ Progress incrementally with verification
- ✅ Keep detailed logs of all work

### Session Management
1. **Start:** Analyze current state, create comprehensive plan
2. **Execute:** Work through stages sequentially (3 → 4 → 5)
3. **Verify:** Test, lint, build after each change
4. **Document:** Update docs incrementally
5. **Complete:** Generate COMPLETION_REPORT.md
6. **Close:** Tag releases and exit gracefully

### Commit Strategy
Meaningful commit messages following conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates
- `test:` - Test additions/fixes
- `build:` - Build system changes
- `ci:` - CI/CD updates
- `meta:` - Final completion commits

## Guardrails

### Security
- ❌ **Never hard-code secrets** - Always use .env files
- ✅ **Validate all inputs** - Prevent injection attacks
- ✅ **Enforce RBAC** - Role-based access control on all endpoints
- ✅ **Audit all writes** - Actor + timestamp + summary
- ✅ **Secure tokens** - JWT with expiration and refresh
- ✅ **HTTPS enforcement** - SSL/TLS in production
- ❌ **No PII in logs** - Protect user privacy

### Database
- ❌ **No destructive migrations without backups**
- ✅ **Test migrations on SQLite before PostgreSQL**
- ✅ **Linear migration history** - No conflicts
- ✅ **Reversible migrations** - Support rollback
- ✅ **Data validation** - Constraints at DB level

### Code Quality
- ✅ **All linters must pass** - ruff, black, isort, mypy (backend), eslint, prettier, tsc (frontend)
- ✅ **Test coverage ≥ 80% backend** - Enforced in CI
- ✅ **Test coverage ≥ 70% frontend** - Enforced in CI
- ✅ **All tests passing** - No broken tests
- ✅ **Type safety** - mypy (Python), TypeScript (frontend)
- ✅ **Documentation** - Docstrings, README, API docs

### Development Workflow
- ✅ **Tests first** - Write tests for new features
- ✅ **Incremental commits** - Small, focused changes
- ✅ **Document as you go** - Keep docs current
- ✅ **Verify continuously** - Test after each change
- ✅ **Git best practices** - Clear commit messages, no large files

## Tools & Technologies

### Backend Stack
- **Language:** Python 3.12
- **Framework:** Django 5.1.4 + Django REST Framework 3.15.2
- **Database:** PostgreSQL 14 (production), SQLite (testing)
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Background Jobs:** django-rq + Redis
- **PDF Generation:** ReportLab + QRCode
- **Testing:** pytest + pytest-django + faker
- **Quality:** ruff, black, isort, mypy, django-stubs
- **Documentation:** drf-spectacular (OpenAPI)

### Frontend Stack
- **Language:** TypeScript
- **Framework:** React 19 + Vite 7
- **Routing:** react-router-dom
- **State:** Zustand + React Query
- **Forms:** react-hook-form + zod
- **UI:** TailwindCSS + Custom Components
- **HTTP:** axios with interceptors
- **Testing:** Vitest + React Testing Library

### DevOps Stack
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **SSL:** Let's Encrypt (certbot)
- **CI/CD:** GitHub Actions
- **Security:** CodeQL scanning
- **Version Control:** Git + GitHub

### Development Tools
- **Build:** Makefile automation
- **Linting:** Pre-commit hooks (optional)
- **Database:** PostgreSQL 14, Redis 7
- **Testing:** pytest, vitest
- **Documentation:** Markdown, OpenAPI/Swagger

## Quality Standards

### Code Coverage
- Backend: **91%** (target: ≥80%) ✅
- Frontend: **100% of tests** (target: ≥70%) ✅

### Test Requirements
- Unit tests for all models and utilities
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

### Documentation Requirements
- API documentation (OpenAPI schema)
- Data model documentation (ERD)
- Setup and deployment guides
- Contributing guidelines
- Changelog with all changes

## Delivery Requirements

### Before Completion
- ✅ All tests passing (backend + frontend)
- ✅ All linters clean
- ✅ Docker stack runs end-to-end
- ✅ Documentation complete and current
- ✅ Releases tagged (v1.0.0-prod, v1.1.0-stable)
- ✅ COMPLETION_REPORT.md generated

### Report Contents
- Executive summary
- Work completed by stage
- Final metrics (tests, coverage, endpoints)
- Release information
- Deployment URLs
- Quick start guide
- Outstanding recommendations

### Exit Criteria
- All Definition-of-Done criteria met
- COMPLETION_REPORT.md comprehensive
- CHANGELOG.md updated
- README.md current
- No failing tests
- No linting errors
- Docker compose verified

## Session Log Requirements

### Track Throughout Session
- Files created/modified
- Tests added/fixed
- Documentation updated
- Commits made
- PRs opened/merged
- Issues resolved
- Time spent per stage

### Include in Final Report
- Total work items completed
- Coverage improvements
- Build/deployment status
- Known issues (if any)
- Recommended next steps

---

**Agent Version:** Unified Full-Stack Completion  
**Last Updated:** October 22, 2025  
**Status:** Active ✅
