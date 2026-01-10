# Tests

## Backend

- **Unit**: models, services (attendance %, grade calc)
- **API**: CRUD, auth, permissions, pagination
- **PDF/QR generation**: smoke tests
- **Fixtures**: seed data for 500 students

**Run backend tests:**
```bash
cd backend
pytest
```

## Frontend

- **Unit**: components/forms (Vitest)
- **Integration**: auth flow, attendance capture, marks entry
- **E2E** (Playwright): coordinator posts attendance; exam cell publishes results

**Run frontend tests:**
```bash
cd frontend
npm test           # Unit tests (Vitest)
npm run test:e2e   # E2E tests (Playwright)
```

---

## End-to-End (E2E) Tests

### Overview

E2E tests use Playwright to test the full application stack (frontend + backend + database) in a realistic environment. The tests act as a CI gate, ensuring the entire system works together correctly.

### Running E2E Tests

#### Single Command (Recommended)

Use the `e2e_run.sh` script for a complete E2E run:

```bash
# Basic usage (assumes stack is already running)
./scripts/e2e_run.sh

# Start docker compose automatically
E2E_START_DOCKER=1 ./scripts/e2e_run.sh

# Custom base URL
BASE_URL=http://localhost:81 ./scripts/e2e_run.sh

# Seed demo data before tests
E2E_SEED=1 ./scripts/e2e_run.sh

# All options combined
BASE_URL=http://localhost:81 E2E_START_DOCKER=1 E2E_SEED=1 ./scripts/e2e_run.sh
```

#### Manual Steps

1. **Start the stack:**
   ```bash
   docker compose up -d --build
   ```

2. **Wait for readiness:**
   ```bash
   timeout 120 bash -c 'until curl -sf http://localhost:8010/api/health/ | jq -e ".checks.db.status == \"ok\" and .checks.migrations.status == \"ok\""; do sleep 2; done'
   ```

3. **Run migrations (if needed):**
   ```bash
   docker compose exec backend python manage.py migrate
   ```

4. **Seed demo data (optional):**
   ```bash
   docker compose exec backend python manage.py seed_demo_scenarios --students 20
   ```

5. **Run Playwright tests:**
   ```bash
   cd frontend
   BASE_URL=http://localhost:8080 npm run test:e2e
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Base URL for frontend (used by Playwright) | `http://localhost:8080` |
| `PLAYWRIGHT_BASE_URL` | Alternative Playwright base URL | Same as `BASE_URL` |
| `E2E_START_DOCKER` | Start docker compose automatically (`1` to enable) | `0` |
| `E2E_SEED` | Seed demo data before tests (`1` to enable) | `0` |
| `HEALTH_ENDPOINT` | Health/readiness endpoint to poll | `${BASE_URL}/api/health/` |
| `HEALTH_TIMEOUT` | Timeout for readiness check (seconds) | `120` |
| `HEALTH_INTERVAL` | Interval between readiness checks (seconds) | `2` |

### E2E Test Structure

E2E tests are located in `frontend/e2e/`:

```
frontend/e2e/
├── auth.spec.ts              # Authentication flow tests
├── students-crud.spec.ts     # Student CRUD operations
├── academics-crud.spec.ts    # Academic module tests
├── reload-persistence.spec.ts # Session persistence tests
└── admin-screenshots.spec.ts # Admin screenshots (optional)
```

### Playwright Configuration

The Playwright configuration (`frontend/playwright.config.ts`) supports:
- Base URL from environment (`BASE_URL` or `PLAYWRIGHT_BASE_URL`)
- Retries on CI (2 retries)
- Parallel execution (1 worker on CI, unlimited locally)
- HTML and JSON reporters
- Trace collection on failure
- Screenshots on failure
- Video recording on failure

### CI/CD Integration

E2E tests run automatically in CI via GitHub Actions (`.github/workflows/e2e.yml`):

- **Triggers**: Push/PR to main branches, changes to frontend/backend/E2E files
- **Steps**:
  1. Starts docker compose stack
  2. Waits for backend readiness (health endpoint)
  3. Runs migrations
  4. Seeds demo data
  5. Runs Playwright tests
  6. Uploads artifacts on failure (report, screenshots, results)

**View CI artifacts:**
- Go to GitHub Actions → E2E Tests → failed run → Artifacts
- Download `playwright-report` for HTML report
- Download `playwright-screenshots` for failure screenshots

### Troubleshooting

**Tests fail with "Service not ready":**
- Check that backend health endpoint is accessible: `curl http://localhost:8010/api/health/`
- Check backend logs: `docker compose logs backend`
- Verify database is running: `docker compose ps`

**Tests fail with "Page not found":**
- Verify frontend is accessible: `curl http://localhost:8080`
- Check frontend logs: `docker compose logs frontend`
- Ensure `BASE_URL` matches your frontend URL

**Tests fail with "Authentication failed":**
- Verify demo data was seeded: `docker compose exec backend python manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.count())"`
- Check test credentials in test files match seeded data
- Re-seed data if needed: `docker compose exec backend python manage.py seed_demo_scenarios --students 20`

**CI fails but local passes:**
- Check CI logs for specific failures
- Verify environment variables in CI workflow
- Ensure docker compose services are started correctly in CI
- Check for timing issues (increase `HEALTH_TIMEOUT` if needed)

### Writing New E2E Tests

1. Create a new test file in `frontend/e2e/`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Feature Name', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/some-path');
       // ... test code ...
     });
   });
   ```

2. Use environment variables for configuration:
   ```typescript
   const baseURL = process.env.BASE_URL || 'http://localhost:8080';
   ```

3. Wait for API responses when needed:
   ```typescript
   await page.waitForResponse(response => 
     response.url().includes('/api/some-endpoint') && response.status() < 500
   );
   ```

4. Use helpful selectors:
   ```typescript
   await page.locator('button[type="submit"]').click();
   await expect(page.getByRole('alert')).toBeVisible();
   ```

### Best Practices

- **Idempotent tests**: Tests should not depend on previous test state
- **Use seed data**: Seed demo data before tests if needed (`E2E_SEED=1`)
- **Wait for readiness**: Always wait for health endpoint before running tests
- **Clean up**: Tests should clean up after themselves (or use isolated test data)
- **Parallel execution**: Ensure tests can run in parallel without conflicts
- **Clear failures**: Use descriptive error messages and assertions
