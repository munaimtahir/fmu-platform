# GitHub Workflows Configuration

This document describes the CI/CD workflows configured for this repository.

## Active Workflows

### 1. Backend CI (`.github/workflows/backend-ci.yml`)

**Purpose:** Validates backend code quality on every push and pull request

**Triggers:**
- Push to any branch affecting backend code or workflow file
- Pull requests affecting backend code or workflow file

**Jobs:**
1. **Ruff Lint** - Code formatting and linting
   - Tool: ruff
   - Target: Python 3.12
   - Status: ✅ All checks pass

2. **Static Type Check** - Type safety validation
   - Tool: mypy with django-stubs plugin
   - Configuration: Ignores missing third-party type stubs
   - Status: ✅ No issues found

3. **Pytest Suite** - Test execution with coverage
   - Framework: pytest with pytest-cov
   - Database: SQLite3 (test mode)
   - Coverage: 99% (2800 statements, 25 missed)
   - Artifacts: HTML and XML coverage reports
   - Status: ✅ 220 tests pass

### 2. Frontend CI (`.github/workflows/frontend-ci.yml`)

**Purpose:** Validates frontend code quality on every push and pull request

**Triggers:**
- Push to any branch affecting frontend code or workflow file
- Pull requests affecting frontend code or workflow file

**Jobs:**
1. **Lint** - Code quality check
   - Tool: ESLint
   - Status: ✅ No issues

2. **Test** - Unit test execution
   - Framework: Vitest with jsdom
   - Current: 1 placeholder test (additional tests can be added)
   - Status: ✅ All tests pass

3. **Build** - Production build validation
   - Tool: Vite
   - Output: Static bundle in `dist/` directory
   - Status: ✅ Build successful

4. **Upload Artifacts** - Build artifact preservation
   - Artifact: Production build from `dist/`
   - Status: ✅ Upload successful

## Removed Workflows

### Docker Release Workflow
- **File:** `.github/workflows/docker-release.yml`
- **Reason:** Not a code quality check; deployment automation only
- **Previous Function:** Built and published Docker images to GitHub Container Registry on main branch pushes
- **Note:** Docker images can be built manually when needed using the Dockerfiles in the repository

## Running Workflows Locally

### Backend CI Checks

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run Ruff linting
ruff check .

# Run mypy type checking
export DJANGO_SETTINGS_MODULE=sims_backend.settings
export PYTHONPATH=$(pwd)
mypy .

# Run tests with coverage
export DJANGO_SECRET_KEY=test-secret-key
export DJANGO_DEBUG=False
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=/tmp/test_db.sqlite3
export DB_HOST=''
export DB_PORT=0
pytest tests --cov=. --cov-report=html
```

### Frontend CI Checks

```bash
cd frontend

# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests
npm test -- --run

# Build production bundle
npm run build
```

## Workflow Status

| Workflow | Status | Required | Purpose |
|----------|--------|----------|---------|
| Backend CI | ✅ Passing | Yes | Code quality, type safety, tests |
| Frontend CI | ✅ Passing | Yes | Code quality, tests, build |

## CI/CD Best Practices

1. **All checks must pass** before merging PRs
2. **Code coverage** should remain above 80% (current: 99%)
3. **Type safety** is enforced via mypy on backend
4. **Linting** ensures consistent code style across the project
5. **Automated testing** prevents regressions

## Future Improvements

- Add integration tests for API endpoints
- Increase frontend test coverage beyond placeholder test
- Consider adding E2E tests for critical user flows
- Add performance testing for database queries
- Consider re-adding Docker release workflow for automated deployments
