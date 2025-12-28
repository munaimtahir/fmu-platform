# CI/CD

## Pipeline Overview

The FMU SIMS project uses GitHub Actions for continuous integration and deployment with comprehensive security scanning and quality gates.

## CI/CD Workflows

### 1. Backend CI (`backend-ci.yml`)
**Triggers:** Push/PR to backend files
**Steps:**
- **Lint:** Ruff code quality checks
- **Type Check:** mypy static type analysis
- **Tests:** pytest with ≥80% coverage enforcement (currently 99%)
- **Artifacts:** Coverage reports (HTML + XML)

**Requirements:**
- All ruff checks must pass
- mypy type checks must pass
- All tests must pass
- Coverage must be ≥80%

### 2. Frontend CI (`frontend-ci.yml`)
**Triggers:** Push/PR to frontend files
**Steps:**
- **Lint:** ESLint checks
- **Tests:** Vitest with ≥50% coverage enforcement (currently 92.5%)
- **Build:** Production build verification
- **Artifacts:** Coverage reports + production build

**Requirements:**
- ESLint checks must pass
- All tests must pass
- Coverage must meet thresholds
- Production build must succeed

### 3. Security Scanning (`security.yml`)
**Triggers:** Push/PR, Weekly schedule (Mondays)
**Steps:**
- **Trivy Filesystem Scan:** Scans codebase for vulnerabilities
- **Trivy Backend Docker Scan:** Scans backend container image
- **Trivy Frontend Docker Scan:** Scans frontend container image
- **Dependency Review:** Checks dependencies in PRs for known vulnerabilities

**Severity Levels:** CRITICAL, HIGH, MEDIUM

### 4. CodeQL Analysis (`codeql.yml`)
**Triggers:** Push/PR to main/develop, Weekly schedule (Mondays)
**Languages:** Python, JavaScript
**Queries:** security-extended, security-and-quality
**Steps:**
- Initialize CodeQL for each language
- Auto-build project
- Perform security analysis
- Upload results to GitHub Security

### 5. Release Automation (`release.yml`)
**Triggers:** 
- Git tags matching `v*` pattern
- Manual workflow dispatch

**Steps:**
1. Run full test suites (backend + frontend)
2. Build frontend production bundle
3. Create release archives:
   - Backend source (`fmu-sims-backend-{version}.tar.gz`)
   - Frontend build (`fmu-sims-frontend-{version}.tar.gz`)
   - Full release (`fmu-sims-{version}.tar.gz`)
4. Extract changelog for version
5. Create GitHub Release with artifacts
6. Mark as pre-release if version contains 'beta' or 'alpha'

**Artifacts:**
- Source archives
- Production builds
- docker-compose.yml
- .env.example
- Documentation

## Quality Gates

### Backend
- ✅ ruff lint checks
- ✅ black formatting
- ✅ isort import sorting
- ✅ mypy type checking
- ✅ pytest (≥80% coverage, currently 99%)
- ✅ 220 tests passing

### Frontend
- ✅ ESLint checks
- ✅ Vitest (≥50% coverage, currently 92.5%)
- ✅ Production build
- ✅ 7 tests passing

### Security
- ✅ Trivy vulnerability scanning
- ✅ CodeQL security analysis
- ✅ Dependency review

## Release Process

### Automated Release
1. Update `Docs/CHANGELOG.md` with version entry
2. Commit changes
3. Create and push tag:
   ```bash
   git tag -a v0.3.0-beta -m "Release v0.3.0-beta"
   git push origin v0.3.0-beta
   ```
4. GitHub Actions will automatically:
   - Run all tests
   - Build artifacts
   - Create GitHub Release
   - Upload artifacts

### Manual Release
1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Enter version (e.g., `v0.3.0-beta`)
4. Click "Run workflow"

## Monitoring & Alerts

- Security findings appear in GitHub Security tab
- Failed workflows send notifications
- Coverage reports uploaded as artifacts
- Release artifacts available in GitHub Releases

## Best Practices

1. **All PRs must pass CI** before merging
2. **Security findings** should be addressed promptly
3. **Coverage** should not decrease below thresholds
4. **Dependencies** should be reviewed and updated regularly
5. **Releases** should be tagged with semantic versioning
