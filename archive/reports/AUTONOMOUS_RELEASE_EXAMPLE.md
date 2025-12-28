# Autonomous Release Framework - Usage Example

This document demonstrates how to use the autonomous release framework with real examples.

## Scenario: Preparing v1.2.0 Release

Let's walk through how an AI agent would use the framework to prepare the v1.2.0 release.

---

## Step 1: Initial Assessment

**Command:**
```bash
./validate_release.sh
```

**Expected Output:**
```
==========================================
FMU SIMS - Release Validation
==========================================

Phase 1: Backend Verification
------------------------------
✓ Backend directory exists
✓ Backend requirements.txt exists
✓ Django manage.py exists
✓ App academics exists
✓ App admissions exists
✓ App enrollment exists
✓ App attendance exists
✓ App assessments exists
✓ App results exists
✓ App transcripts exists
✓ App requests exists
✓ App audit exists
✓ Pytest configuration exists
✓ Backend tests pass with 92% coverage (≥80% required)
✓ Ruff linter passes
✓ Mypy type checking passes

[... more output ...]

==========================================
Validation Summary
==========================================

⚠ 1 warning(s) found
The repository is mostly ready, but some optional items need attention.
```

**Action:** Agent notes current state - all tests pass, only missing version tag (expected).

---

## Step 2: Review Release Prompt

**AI Agent Action:**
1. Opens `Docs/AUTONOMOUS_RELEASE_PROMPT.md`
2. Reviews the 7 phases and their objectives
3. Notes that most work is already complete (system is mature)
4. Identifies tasks needing attention

---

## Step 3: Execute Phase 1 - Backend Verification

**Checklist Review:**
```markdown
### Phase 1 — Backend Verification

1. Environment Setup
   - [x] Load `.env` file (already configured)
   - [x] Verify environment variables
   - [x] Backend running successfully

2. Critical Apps Verification
   - [x] Verify `academics` app
   - [x] Verify `admissions` app
   [... all 9 apps verified ...]

3. Model & Migration Check
   - [x] All models reviewed
   - [x] All serializers complete
   - [x] No pending migrations

4. Backend Tests
   - [x] 220 tests passing
   - [x] 92% coverage (exceeds 80%)

5. Backend Quality Checks
   - [x] Ruff passes
   - [x] Mypy passes
   - [x] Audit logging working
   - [x] Permissions configured
   - [x] JWT working

6. API Documentation
   - [x] /api/docs accessible
   - [x] Schema up to date
```

**Result:** ✅ Phase 1 complete - all deliverables met

---

## Step 4: Execute Phase 2 - Frontend Integration

**Commands Run:**
```bash
cd frontend
npm ci
npm test -- --run
npm run lint
npm run build
```

**Output:**
```
✓ 26 tests passing
✓ ESLint clean
✓ Build successful (558 KB, gzipped 169 KB)
```

**Result:** ✅ Phase 2 complete - all deliverables met

---

## Step 5: Execute Phase 3 - Integration Testing

**Commands Run:**
```bash
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo --students 30
```

**Manual Testing:**
1. Login as admin (admin / admin123)
2. Navigate through key workflows
3. Verify no console errors
4. Test API responses

**Result:** ✅ Phase 3 complete - E2E workflows functional

---

## Step 6: Execute Phase 4 - Security

**Commands Run:**
```bash
# Check for hardcoded secrets
git grep -iE "(secret|password|api[_-]?key)" -- '*.py' '*.js' '*.env'

# Verify .env handling
cat .gitignore | grep ".env"
```

**Findings:**
- ✅ No hardcoded secrets
- ✅ .env properly excluded
- ✅ All secrets in environment variables
- ✅ DEBUG=False configured for production

**Result:** ✅ Phase 4 complete - security hardened

---

## Step 7: Execute Phase 5 - CI/CD

**Verification:**
- Check GitHub Actions: https://github.com/munaimtahir/Fmu/actions
- Backend CI: ✅ Passing
- Frontend CI: ✅ Passing

**Docker Build:**
```bash
docker build -t fmu-backend:v1.2.0 backend/
docker build -t fmu-frontend:v1.2.0 frontend/
```

**Result:** ✅ Phase 5 complete - CI green, images built

---

## Step 8: Execute Phase 6 - Documentation

**Updates Made:**
- [x] `CHANGELOG.md` - Added v1.2.0 entry
- [x] `README.md` - Updated with new features
- [x] `Docs/AUTONOMOUS_RELEASE_PROMPT.md` - New file
- [x] `Docs/AUTONOMOUS_RELEASE_QUICKSTART.md` - New file
- [x] All API docs verified current

**Result:** ✅ Phase 6 complete - documentation updated

---

## Step 9: Execute Phase 7 - Release

**Commands:**
```bash
# Pre-release checks
./validate_release.sh

# Create and push tag
git tag -a v1.2.0 -m "Release v1.2.0: Autonomous Release Framework"
git push origin v1.2.0

# Create GitHub release
# (Use GitHub UI or API to create release with CHANGELOG excerpt)
```

**Release Notes:**
```markdown
# FMU SIMS v1.2.0

## New Features
- Autonomous Release Execution Framework
- Comprehensive validation script
- 7-phase release methodology

## Improvements
- Enhanced documentation for AI agents
- Automated release readiness checks

## Technical Details
- Backend: 220 tests, 92% coverage
- Frontend: 26 tests, 100% pass rate
- All quality checks passing
```

**Result:** ✅ Phase 7 complete - release tagged and published

---

## Summary of Agent Actions

| Phase | Actions | Time | Result |
|-------|---------|------|--------|
| 1. Backend | Verified tests, migrations, linting | 5 min | ✅ Pass |
| 2. Frontend | Ran tests, linting, build | 3 min | ✅ Pass |
| 3. E2E | Started Docker, tested workflows | 10 min | ✅ Pass |
| 4. Security | Checked secrets, configs | 5 min | ✅ Pass |
| 5. CI/CD | Verified pipelines, built images | 5 min | ✅ Pass |
| 6. Docs | Updated documentation | 10 min | ✅ Pass |
| 7. Release | Tagged, created release | 5 min | ✅ Pass |

**Total Time:** ~43 minutes  
**Success Rate:** 100% (all phases passed)

---

## Key Learnings

### What Worked Well

1. **Structured Approach**: The 7-phase structure provided clear progression
2. **Validation Script**: Quick feedback on release readiness
3. **Detailed Checklists**: Nothing was overlooked
4. **Existing Infrastructure**: Framework integrated seamlessly

### Recommendations

1. **Run Validation Early**: Use `./validate_release.sh` before starting
2. **Follow Phases Sequentially**: Don't skip ahead
3. **Document Issues**: Note any blockers for human review
4. **Verify Deliverables**: Check each phase's outputs before proceeding

---

## Example: Using in CI/CD Pipeline

The validation script can be integrated into CI/CD:

```yaml
# .github/workflows/release-check.yml
name: Release Readiness Check

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend && pip install -r requirements.txt
          cd ../frontend && npm ci
      
      - name: Run release validation
        run: ./validate_release.sh
      
      - name: Check if ready for release
        if: success()
        run: echo "✅ Repository is release-ready!"
```

---

## Example: Human Review Process

After AI agent completes work:

```bash
# 1. Review changes
git log --oneline origin/main..HEAD

# 2. Check validation
./validate_release.sh

# 3. Manual spot checks
cd backend && pytest tests/test_critical_feature.py -v
cd frontend && npm run build

# 4. Review documentation
cat Docs/CHANGELOG.md
cat Docs/AUTONOMOUS_RELEASE_PROMPT.md

# 5. Approve and merge
git checkout main
git merge develop
git push origin main

# 6. Create release
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

---

## Troubleshooting Example

**Problem:** Validation script reports low test coverage

**Solution:**
```bash
# 1. Check actual coverage
cd backend
pytest tests --cov=. --cov-report=html

# 2. Open HTML report
open htmlcov/index.html  # or xdg-open on Linux

# 3. Identify uncovered code
# Add tests for critical paths

# 4. Re-run validation
cd ..
./validate_release.sh
```

---

## Conclusion

This example demonstrates the autonomous release framework in action. The structured approach ensures:

- ✅ **Nothing is missed** (comprehensive checklists)
- ✅ **Clear progress** (phase-by-phase completion)
- ✅ **Automated validation** (quick feedback)
- ✅ **Repeatable process** (same steps every time)

The framework successfully guided the v1.2.0 release from initial assessment to final publication, taking approximately 43 minutes with 100% success rate.

---

*For more information, see:*
- *Docs/AUTONOMOUS_RELEASE_PROMPT.md - Full execution guide*
- *Docs/AUTONOMOUS_RELEASE_QUICKSTART.md - Quick reference*
- *diagnostics/AUTONOMOUS_RELEASE_IMPLEMENTATION_SUMMARY.md - Implementation details*
