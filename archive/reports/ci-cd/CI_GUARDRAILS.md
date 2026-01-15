# CI Guardrails - Release Gate Documentation

**Last Updated:** 2026-01-03  
**Purpose:** Document what blocks releases and why CI is a gatekeeper, not decoration.

---

## Overview

CI (Continuous Integration) is configured as a **mandatory gate** that blocks merges and deployments if any check fails. This document explains what blocks releases and why.

---

## Backend CI Guardrails

**Workflow:** `.github/workflows/backend-ci.yml`

### 1. Ruff Lint ✅ BLOCKS RELEASE

**Job:** `lint`

**What it checks:**
- Python code style and quality
- Modern Python syntax
- Best practices enforcement

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Code quality issues can lead to bugs
- Inconsistent style makes code harder to maintain
- Violations indicate potential problems

---

### 2. Static Type Check (mypy) ⚠️ WARNING ONLY

**Job:** `mypy`

**What it checks:**
- Static type safety across Django application
- Type annotations correctness

**Failure Impact:**
- ⚠️ **WARNING ONLY** - `continue-on-error: true`
- Does NOT block merge or deployment

**Why it's warning only:**
- mypy can be strict and may have false positives
- Type checking is still valuable for catching errors

**Future:** Consider making this blocking once type coverage improves.

---

### 3. Pytest Suite ✅ BLOCKS RELEASE

**Job:** `tests`

**What it checks:**
- All backend unit tests
- All API tests
- All integration tests
- Code coverage (minimum 80% required)

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Test failures indicate broken functionality
- Low coverage means untested code paths
- Tests are the safety net for changes

**Coverage Requirement:**
- Minimum: 80%
- Current: 92.70% ✅
- Regression tests: Included in this suite

---

### 4. Regression Tests ✅ BLOCKS RELEASE

**Job:** `regression`

**What it checks:**
- System contract compliance
- Authentication & authorization contracts
- Data integrity contracts
- Workflow contracts

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Contract violations break critical functionality
- Student/faculty portals must never break silently
- These are non-negotiable system rules

**Test Location:** `backend/tests/regression/`

**See:** `SYSTEM_CONTRACTS.md` for contract definitions

---

## Frontend CI Guardrails

**Workflow:** `.github/workflows/frontend-ci.yml`

### 1. Type Check ✅ BLOCKS RELEASE

**Job:** `build` (includes type-check step)

**What it checks:**
- TypeScript compilation
- Type errors
- Broken imports

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Type errors indicate broken code
- Broken imports prevent application from running
- Type safety prevents runtime errors

---

### 2. ESLint ✅ BLOCKS RELEASE

**Job:** `build` (includes lint step)

**What it checks:**
- JavaScript/TypeScript code quality
- React best practices
- Consistent code style

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Code quality issues can lead to bugs
- Inconsistent style makes maintenance harder

---

### 3. Vitest Tests ✅ BLOCKS RELEASE

**Job:** `build` (includes test step)

**What it checks:**
- Frontend unit tests
- Component tests
- Integration tests

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Test failures indicate broken functionality
- Frontend bugs affect user experience

---

### 4. Production Build ✅ BLOCKS RELEASE

**Job:** `build`

**What it checks:**
- Production build succeeds
- No build errors
- All assets generated correctly
- Environment variables validated

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Build failures mean application won't deploy
- Missing env vars cause runtime errors
- Broken builds indicate configuration issues

---

## Docker CI Guardrails

**Workflow:** `.github/workflows/docker-ci.yml`

### 1. Docker Compose Validation ✅ BLOCKS RELEASE

**What it checks:**
- `docker-compose.yml` syntax
- `docker-compose.prod.yml` syntax

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Invalid compose files prevent deployment
- Syntax errors cause container startup failures

---

### 2. Docker Image Build ✅ BLOCKS RELEASE

**What it checks:**
- Backend Docker image builds
- Frontend Docker image builds
- Image dependencies installed correctly

**Failure Impact:**
- ❌ **BLOCKS MERGE** - PR cannot be merged
- ❌ **BLOCKS DEPLOYMENT** - Deployment blocked

**Why it blocks:**
- Build failures mean containers won't start
- Missing dependencies cause runtime errors

---

## OpenAPI Schema Drift Detection

**Status:** ⚠️ **NOT YET IMPLEMENTED**

**Planned Check:**
- Detect when API endpoints change
- Verify OpenAPI schema is updated
- Ensure frontend types match backend schema

**Why it matters:**
- API changes without schema updates break frontend
- Type mismatches cause runtime errors

**Action Items:**
- [ ] Add OpenAPI schema validation to CI
- [ ] Compare schema changes with endpoint changes
- [ ] Fail if schema is outdated

---

## Release Blocking Summary

### Always Blocks Release ❌

1. ✅ Backend lint failures
2. ✅ Backend test failures
3. ✅ Backend regression test failures
4. ✅ Frontend type check failures
5. ✅ Frontend lint failures
6. ✅ Frontend test failures
7. ✅ Frontend build failures
8. ✅ Docker compose validation failures
9. ✅ Docker image build failures

### Warning Only ⚠️

1. ⚠️ Backend mypy type check (continue-on-error: true)

---

## Bypassing CI Checks

**⚠️ NEVER BYPASS CI CHECKS**

**Why:**
- CI checks are the safety net
- Bypassing checks defeats the purpose
- Broken code will reach production

**If you must bypass (emergency only):**
1. Get explicit approval from team lead
2. Document the reason
3. Fix the issue immediately after deployment
4. Add test to prevent recurrence

---

## Fixing CI Failures

### Backend Failures

1. **Lint failures:**
   ```bash
   cd backend
   ruff check . --fix
   ```

2. **Test failures:**
   ```bash
   cd backend
   pytest tests/ -v
   # Fix failing tests
   ```

3. **Regression test failures:**
   ```bash
   cd backend
   pytest tests/regression/ -v
   # Check SYSTEM_CONTRACTS.md for contract definitions
   # Fix contract violation or update contract if intentional
   ```

### Frontend Failures

1. **Type check failures:**
   ```bash
   cd frontend
   npm run type-check
   # Fix type errors
   ```

2. **Lint failures:**
   ```bash
   cd frontend
   npm run lint -- --fix
   ```

3. **Test failures:**
   ```bash
   cd frontend
   npm test
   # Fix failing tests
   ```

4. **Build failures:**
   ```bash
   cd frontend
   npm run build
   # Check error messages
   # Verify env vars are set
   ```

---

## CI as Gatekeeper

### Before CI Guardrails

- ❌ Tests could fail, code still merged
- ❌ Lint errors ignored
- ❌ Build failures deployed anyway
- ❌ Contract violations went unnoticed

### After CI Guardrails

- ✅ All checks must pass before merge
- ✅ Regression tests catch contract violations
- ✅ Build failures prevent deployment
- ✅ Quality gates enforced automatically

---

## Monitoring CI Health

### Metrics to Track

1. **CI Pass Rate:** Should be > 95%
2. **Average CI Time:** Should be < 10 minutes
3. **Flaky Test Rate:** Should be < 1%
4. **Regression Test Failures:** Should be 0

### Alerts

- Set up alerts for CI failures
- Notify team when regression tests fail
- Track CI health over time

---

## Future Improvements

### High Priority
1. **OpenAPI Schema Drift Detection** - Detect API changes
2. **Performance Regression Tests** - Catch performance degradation
3. **Security Scanning** - Automated security checks

### Medium Priority
1. **Make mypy blocking** - Once type coverage improves
2. **Frontend API Alignment Tests** - Verify service → endpoint mapping
3. **E2E Tests in CI** - Full integration tests

### Low Priority
1. **Parallel Test Execution** - Faster CI runs
2. **Test Result Caching** - Faster CI runs
3. **CI Cost Optimization** - Reduce CI costs

---

**Status:** ✅ **CI GUARDRAILS ACTIVE** - All critical checks block releases
