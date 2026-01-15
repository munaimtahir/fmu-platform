# Forensic Audit Report - FMU Platform Repository
**Date:** 2026-01-16  
**Phase:** A (Read-Only Analysis)  
**Audit Type:** Security, Bloat, Duplication, Dead Config

---

## 1. Inventory Snapshot

### Repository Status
- **Working Directory:** `/home/munaim/srv/apps/fmu-platform`
- **Branch:** `main` (up to date with `origin/main`)
- **Working Tree:** Clean
- **Remotes:** `origin` → `https://github.com/munaimtahir/fmu-platform`

### File Counts
- **Total Files:** 995
- **Total Directories:** 172
- **Root-level Markdown:** 82
- **Total Markdown Files:** 404
- **Repository Size:** 22M

### Directory Sizes
- `docs/`: 3.9M
- `archive/`: 604K
- `backend/`: 1.9M
- `frontend/`: 2.2M

### Top-Level Structure
```
.
├── .env (TRACKED - SECURITY RISK)
├── .env.backup (TRACKED - SECURITY RISK)
├── .env.example
├── .github/
├── .vscode/
├── archive/ (58 files: 54 md, 3 txt, 1 json)
├── backend/
├── docs/ (14 subdirectories)
├── docs_platform/
├── frontend/
├── fmu_platform_backup_20260102_120323.dump (TRACKED - SECURITY RISK)
├── modules/
├── nginx/ (DEAD INFRA)
├── scripts/
├── screenshots/
└── tools/
```

### Recent Commits (Last 20)
- Recent commits show non-descriptive messages: "a", "2", "nn", "cleanup", "s", "scripts", etc.
- Production commits present: API prefix updates, verification reports

---

## 2. Tracked Secrets & Sensitive Files

### 🔴 CRITICAL: Files with Actual Secrets (Tracked in Git)

| File Path | Risk Type | Secret Variables Found | Tracked? | Size |
|-----------|-----------|------------------------|----------|------|
| `.env` | **ENV_SECRET** | `DJANGO_SECRET_KEY`, `DB_PASSWORD`, `POSTGRES_PASSWORD`, `EMAIL_HOST_PASSWORD`, `JWT_*` | ✅ YES | 5.3K |
| `.env.backup` | **ENV_SECRET** | Empty placeholders + one `POSTGRES_PASSWORD` value | ✅ YES | 5.1K |
| `fmu_platform_backup_20260102_120323.dump` | **DB_DUMP** | PostgreSQL database dump (full schema + potentially sensitive data) | ✅ YES | 140K |
| `USER_LOGIN_CREDENTIALS.md` | **CREDENTIALS_DOC** | Contains user login credentials documentation | ✅ YES | 3.0K |
| `frontend/.env` | **ENV_SECRET** | Frontend environment variables | ✅ YES | Unknown |

### Git History Evidence
The following files were previously deleted but remain in git history:
- `.env`
- `.env.backup`
- `frontend/.env`
- `fmu_platform_backup_20260102_120323.dump`

**⚠️ These secrets are in the full git history and all clones.**

### Secret Variable References (No Values Printed)
Files referencing secret variables (placeholders acceptable):
- `.env.example` - Template (safe)
- `.github/workflows/*.yml` - CI test secrets (safe if test-only)
- Multiple markdown docs mentioning `DJANGO_SECRET_KEY`, `DB_PASSWORD`, etc. (documentation only)

### Risk Assessment
1. **IMMEDIATE:** `.env` contains production secrets tracked in git
2. **HIGH:** Database dump file contains potentially sensitive schema/data
3. **MEDIUM:** `.env.backup` may contain old secret values
4. **MEDIUM:** `USER_LOGIN_CREDENTIALS.md` may contain actual credentials

---

## 3. AI Artifact / Bloat Findings

### Root-Level Markdown Bloat
**Count:** 82 markdown files at repository root

#### Biggest Offenders (AI-Style Reports)
| File | Size | Category |
|------|------|----------|
| `CODEBASE_REVIEW_REPORT.md` | 27KB | AI Report |
| `REPO_VERIFICATION_REPORT.md` | 20KB | AI Report |
| `FINAL_DEPLOYMENT_REPORT.md` | 16KB | AI Report |
| `README.md` | 12KB | Documentation |
| `AUDIT_COMPLETION_SUMMARY.md` | 13KB | AI Report |
| `BACKEND_VERIFICATION_REPORT.md` | 13KB | AI Report |
| `DEPLOYMENT_REPORT_20260102.md` | 14KB | AI Report |
| `STABILITY_SPRINT_REPORT.md` | 13KB | AI Report |
| `FRONTEND_API_WIRING_REPORT.md` | 13KB | AI Report |

### AI Artifact Pattern Matches
**Count:** 120+ files matching patterns: `*REPORT*.md`, `*SUMMARY*.md`, `*VERIFICATION*.md`, `*COMPLETION*.md`, `*STATUS*.md`, `*AUDIT*.md`, `*CHECKLIST*.md`

**Examples:**
- `AUDIT_COMPLETE_SUMMARY.md`
- `AUDIT_COMPLETION_SUMMARY.md` (duplicate theme)
- `DEPLOYMENT_COMPLETE.md`
- `DEPLOYMENT_COMPLETION_SUMMARY.md` (duplicate theme)
- `DEPLOYMENT_STATUS_2026-01-03.md`
- `DEPLOYMENT_STATUS_VERIFICATION_2026-01-01.md`
- `VERIFICATION_CHECKLIST.md`
- `VERIFICATION_COMPLETE.md`
- `VERIFICATION_FINAL_STATUS.md`
- `VERIFICATION_REPORT_2026-01-02.md`

### Recommendation Buckets

#### DELETE (Safe to Remove - AI Artifacts Only)
- `AUDIT_COMPLETE_SUMMARY.md`
- `AUDIT_COMPLETION_SUMMARY.md`
- `COMPLETION_SUMMARY.md`
- `DEPLOYMENT_COMPLETION_SUMMARY.md`
- `DEPLOYMENT_FIXES_COMPLETE.md`
- `DEPLOYMENT_STATUS_2026-01-03.md`
- `DEPLOYMENT_STATUS_VERIFICATION_2026-01-01.md`
- `FINAL_STATUS_REPORT.md`
- `IMPLEMENTATION_STATUS.md`
- `PROGRESS_SUMMARY.md`
- `STATUS_UPDATE.md`
- `VERIFICATION_COMPLETE.md`
- `VERIFICATION_FINAL_STATUS.md`
- (40+ additional timestamped reports)

#### ARCHIVE (Move to `archive/` or `docs/reports/`)
- `CODEBASE_REVIEW_REPORT.md`
- `BACKEND_VERIFICATION_REPORT.md`
- `FRONTEND_API_WIRING_REPORT.md`
- `STABILITY_SPRINT_REPORT.md`
- `DATA_INTEGRITY_REPORT.md`
- `REPO_VERIFICATION_REPORT.md`
- All `*_REPORT_*.md` files

#### KEEP (Operational)
- `README.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `RUNBOOK.md`
- `ENV_CONTRACT.md`
- `MVP_SETUP_GUIDE.md`
- `SECURITY_SUMMARY.md` (if current)
- `SYSTEM_CONTRACTS.md`
- `QA_SMOKE_TEST.md`
- `CADDY.md` (infrastructure docs)

---

## 4. Docs Coherence Findings

### Documentation Structure
- `docs/`: 181 markdown files across 14 subdirectories
- `archive/`: 58 files (54 md)
- Root: 82 markdown files

### Duplicate Documentation Patterns

#### Multiple README Files
- `./README.md` (main - 12KB)
- `./archive/README.md`
- `./backend/README.md`
- `./frontend/README.md`
- `./docs/*/README.md` (multiple)

**Action:** Keep root `README.md`, consolidate module-specific ones.

#### Parallel Documentation Trees
1. **AI Tool Reports:**
   - `docs/codex/static/EXECUTIVE_SUMMARY.md`
   - `docs/copilot/runtime/EXECUTIVE_SUMMARY.md`
   - `docs/copilot/static/EXECUTIVE_SUMMARY.md`
   - `docs/admin-runtime-report/EXECUTIVE_SUMMARY.md`
   - `docs/verification/EXECUTIVE_SUMMARY.md`

2. **Verification Reports:**
   - `docs/verification/cursor/CANONICAL_TASKS_VERIFICATION.md`
   - `docs/verification/cursorai/CANONICAL_TASKS_VERIFICATION.md`
   - `docs/verification/jules/CANONICAL_TASKS_VERIFICATION.md`
   - Multiple `VERIFICATION_RUN_LOG.md` files

3. **Deployment Documentation:**
   - Root: `DEPLOYMENT_COMPLETE.md`, `DEPLOYMENT_VERIFICATION.md`, `DEPLOYMENT_REPORT_20260102.md`
   - `archive/reports/DEPLOYMENT_CHECKLIST.md`
   - `archive/reports/DOCKER_DEPLOYMENT_VERIFICATION.md`

4. **Setup/Environment Docs:**
   - `ENV_CONTRACT.md` (root)
   - `SYSTEM_CONTRACTS.md` (root)
   - `MVP_SETUP_GUIDE.md` (root)
   - Multiple archived versions

### Coherence Plan

#### KEEP_ACTIVE
- `README.md` (root) - Main entry point
- `CONTRIBUTING.md` - Development guidelines
- `RUNBOOK.md` - Operational procedures
- `ENV_CONTRACT.md` - Environment variable contract (single source of truth)
- `SECURITY_SUMMARY.md` - If current security status
- `SYSTEM_CONTRACTS.md` - System architecture contracts
- `MVP_SETUP_GUIDE.md` - Setup instructions
- `QA_SMOKE_TEST.md` - Testing procedures
- `CADDY.md` - Infrastructure configuration
- `docs/api/` - API documentation
- `docs/adr/` - Architecture decision records

#### MOVE_TO_ARCHIVE
- All `docs/codex/` → `archive/docs-ai/codex/`
- All `docs/copilot/` → `archive/docs-ai/copilot/`
- All `docs/verification/cursor*` → `archive/docs-verification/`
- `docs/archive/` → `archive/docs-legacy/` (consolidate)
- Root timestamped reports → `archive/reports/`

#### MERGE/REWRITE
- Merge multiple `EXECUTIVE_SUMMARY.md` into single historical doc
- Consolidate verification logs into chronological archive
- Merge deployment docs into `docs/deployment/HISTORY.md`

#### DELETE (Only if Dangerous)
- None identified (no credentials in docs themselves)
- ⚠️ `USER_LOGIN_CREDENTIALS.md` - Review for actual credentials before archiving

---

## 5. Dead Infra / Config Drift

### Dead Infrastructure

| Path | Type | Evidence | Status |
|------|------|----------|--------|
| `nginx/` | Nginx config directory | No references in docker-compose files | **DEAD** |
| `nginx/nginx.conf` | Nginx config | Not referenced | **DEAD** |
| `nginx/nginx.staging.conf` | Nginx staging config | Not referenced | **DEAD** |
| `nginx/conf.d/default.conf` | Nginx site config | Not referenced | **DEAD** |
| `nginx/conf.d/production.conf` | Nginx prod config | Not referenced | **DEAD** |

### Active Infrastructure Evidence
- **Caddy:** Confirmed active
  - `CADDY.md` exists with comprehensive configuration
  - `docker-compose.yml` and `docker-compose.prod.yml` bind to `127.0.0.1` (reverse proxy pattern)
  - No nginx references in compose files

### Recommendation
- **MOVE:** `nginx/` → `archive/infrastructure/nginx/`
- **REASON:** Historical reference only; production uses Caddy reverse proxy

---

## 6. Deprecated / Junk Code

### Backup/Temporary Files (Tracked in Git)

| File Path | Type | Action |
|-----------|------|--------|
| `backend/sims_backend/academics/tests/test_views.py.bak` | Backup file | **DELETE** |

### Recommendation
- Remove `.bak` files from git
- Consider adding `*.bak`, `*.old`, `*.tmp`, `*.swp`, `~` to `.gitignore` if not already present

---

## 7. Phase B-S Plan (Security-only)

### Objective
Purge tracked secrets from git history and rotate exposed credentials.

### Prerequisites
1. **Backup Repository:** Clone to safe location before proceeding
2. **Team Coordination:** All team members must reset their local clones
3. **Secret Rotation Plan:** Prepare new secrets for all exposed variables

### Exact Files to Purge from History

```
.env
.env.backup
frontend/.env
fmu_platform_backup_20260102_120323.dump
USER_LOGIN_CREDENTIALS.md (review first - may contain credentials)
```

### Recommended Tool: `git-filter-repo`

#### Step 1: Install git-filter-repo
```bash
pip install git-filter-repo
# OR
brew install git-filter-repo
```

#### Step 2: Remove Files from History
```bash
cd /home/munaim/srv/apps/fmu-platform

# Backup first
git clone --mirror . ../fmu-platform-backup.git

# Remove .env files
git filter-repo --path .env --invert-paths
git filter-repo --path .env.backup --invert-paths
git filter-repo --path frontend/.env --invert-paths

# Remove database dump
git filter-repo --path fmu_platform_backup_20260102_120323.dump --invert-paths

# Remove credentials doc (after review)
git filter-repo --path USER_LOGIN_CREDENTIALS.md --invert-paths
```

#### Step 3: Update .gitignore (Ensure these are ignored)
```gitignore
.env
.env.backup
.env.*
*.dump
*.sql
USER_LOGIN_CREDENTIALS.md
```

#### Step 4: Force Push (⚠️ TEAM COORDINATION REQUIRED)
```bash
# WARNING: This rewrites history
git push origin --force --all
git push origin --force --tags
```

#### Step 5: Team Reset Instructions
All team members must:
```bash
# Delete local repository
cd ..
rm -rf fmu-platform

# Clone fresh
git clone https://github.com/munaimtahir/fmu-platform.git
cd fmu-platform

# Verify secrets are gone
git log --all --full-history -- .env
git log --all --full-history -- fmu_platform_backup_20260102_120323.dump
```

### Secret Rotation Checklist

#### DJANGO_SECRET_KEY
- [ ] Generate new secret: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- [ ] Update production `.env` (not tracked)
- [ ] Update staging `.env` (not tracked)
- [ ] Update all CI/CD secrets (GitHub Actions, etc.)
- [ ] Rotate all active sessions (users must re-login)
- [ ] Verify Django starts with new key

#### DB_PASSWORD / POSTGRES_PASSWORD
- [ ] Generate new strong password (20+ chars, mixed case, numbers, symbols)
- [ ] Update database password in production PostgreSQL
- [ ] Update `.env` files (not tracked)
- [ ] Update docker-compose secret management
- [ ] Update CI/CD database secrets
- [ ] Test database connectivity
- [ ] Update backup/restore scripts

#### JWT Tokens
- [ ] Verify JWT signing uses `DJANGO_SECRET_KEY` (will auto-rotate)
- [ ] Force token refresh (update `JWT_SECRET_KEY` if separate)
- [ ] Invalidate all existing tokens (users must re-login)

#### EMAIL_HOST_PASSWORD
- [ ] Generate new SMTP app password if exposed
- [ ] Update email configuration
- [ ] Test email sending

#### Database Dump Exposure
- [ ] Assume schema is compromised
- [ ] Review dump contents for sensitive data
- [ ] Consider data sanitization if PII present
- [ ] Rotate any exposed data (user passwords if stored, API keys, etc.)

### Post-Purge Verification
```bash
# Verify files are gone from history
git log --all --full-history -- .env
git log --all --full-history -- .env.backup
git log --all --full-history -- fmu_platform_backup_20260102_120323.dump

# Verify files are in .gitignore
git check-ignore .env .env.backup *.dump

# Verify working tree doesn't have secrets
git status
# .env should NOT appear in tracked files
```

---

## 8. Phase B-H Plan (Hygiene/Organization)

### Objective
Clean up AI artifact bloat, organize documentation, remove dead infrastructure configs.

### Exact Files to Move to Archive

#### Root → `archive/reports/ai-artifacts/`
```
AUDIT_COMPLETE_SUMMARY.md
AUDIT_COMPLETION_SUMMARY.md
COMPLETION_SUMMARY.md
DEPLOYMENT_COMPLETION_SUMMARY.md
DEPLOYMENT_FIXES_COMPLETE.md
DEPLOYMENT_STATUS_2026-01-03.md
DEPLOYMENT_STATUS_VERIFICATION_2026-01-01.md
FINAL_STATUS_REPORT.md
IMPLEMENTATION_STATUS.md
PROGRESS_SUMMARY.md
STATUS_UPDATE.md
VERIFICATION_COMPLETE.md
VERIFICATION_FINAL_STATUS.md
```

#### Root → `archive/reports/timestamped/`
```
DEPLOYMENT_REPORT_20260102.md
VERIFICATION_REPORT_2026-01-02.md
```

#### Root → `archive/reports/technical/`
```
CODEBASE_REVIEW_REPORT.md
BACKEND_VERIFICATION_REPORT.md
BACKEND_REGRESSION_COVERAGE.md
FRONTEND_API_WIRING_REPORT.md
FRONTEND_REGRESSION_CHECKLIST.md
FRONTEND_AUTH_REALIGNMENT_SUMMARY.md
FRONTEND_FINANCE_IMPLEMENTATION_SUMMARY.md
FRONTEND_API_NORMALIZATION_COMPLETE.md
DATA_INTEGRITY_REPORT.md
DJANGO_MIGRATIONS_AUDIT_REPORT.md
INTEGRATION_HARDENING_REPORT.md
CANONICAL_ENFORCEMENT_REPORT.md
DASHBOARD_API_VERIFICATION.md
DASHBOARD_STABILIZATION_SUMMARY.md
```

#### Root → `archive/reports/deployment/`
```
DEPLOYMENT_COMPLETE.md
DEPLOYMENT_VERIFICATION.md
DEPLOYMENT_READINESS_ASSESSMENT.md
DEPLOY_DEMO_DATA.md
FRESH_DEPLOYMENT_SUMMARY.md
FINAL_DEPLOYMENT_REPORT.md
FINAL_BUILD_REPORT.md
DEMO_SCENARIOS_DEPLOYMENT.md
DEMO_SCENARIOS_IMPLEMENTATION.md
DEMO_SEED_DATA_SUMMARY.md
SEED_DEMO_EXECUTION_SUMMARY.md
SEEDING_COMPLETE.md
POST_DEPLOY_5_MIN_CHECK.md
```

#### Root → `archive/reports/implementation/`
```
IMPLEMENTATION_COMPLETE.md
IMPLEMENTATION_REVIEW.md
IMPLEMENTATION_SUMMARY.md
IMPLEMENTATION_SUMMARY_DEMO_SCENARIOS.md
ACADEMICS_MODULE_IMPLEMENTATION.md
FINANCE_FIN1_COMPLETE_SUMMARY.md
FINANCE_RELEASE_FIN1_SUMMARY.md
```

#### Root → `archive/reports/bugfixes/`
```
AUTH_405_FIX_REPORT.md
API_DOUBLE_SLASH_FIX.md
LOGIN_PAGE_404_FIX.md
404_TROUBLESHOOTING.md
```

#### Root → `archive/reports/ci-cd/`
```
CI_GUARDRAILS.md
CI_WORKFLOW_FIXES.md
```

#### Root → `archive/reports/system/`
```
SYSTEM_BASELINE.md
SYSTEM_STABILITY_STATUS.md
REPO_VERIFICATION_REPORT.md
```

#### Root → `archive/reports/testing/`
```
TEST_VERIFICATION.md
TESTING_SUMMARY_TASKS_63_66.md
TASKS_63_66_COMPLETE.md
FEATURE_COMPLETENESS_CHECKLIST.md
```

#### Root → `archive/reports/misc/`
```
CODE_REVIEW_STATUS.md
ISSUES_REQUIRING_DECISIONS.md
DIAGNOSIS_sims_pmc_edu_pk.md
DNS_VERIFICATION_REPORT.md
PRODUCTION_STATUS.md
SCREENSHOTS_INDEX.md
STABILITY_SPRINT_REPORT.md
UNIFIED-README.md
```

### Exact Target Folders

```
archive/
├── reports/
│   ├── ai-artifacts/
│   ├── timestamped/
│   ├── technical/
│   ├── deployment/
│   ├── implementation/
│   ├── bugfixes/
│   ├── ci-cd/
│   ├── system/
│   ├── testing/
│   └── misc/
├── infrastructure/
│   └── nginx/
├── docs-ai/
│   ├── codex/
│   └── copilot/
└── docs-verification/
    ├── cursor/
    ├── cursorai/
    └── jules/
```

### Move Commands

```bash
cd /home/munaim/srv/apps/fmu-platform

# Create archive structure
mkdir -p archive/reports/{ai-artifacts,timestamped,technical,deployment,implementation,bugfixes,ci-cd,system,testing,misc}
mkdir -p archive/infrastructure
mkdir -p archive/docs-ai/{codex,copilot}
mkdir -p archive/docs-verification/{cursor,cursorai,jules}

# Move AI artifacts
git mv AUDIT_COMPLETE_SUMMARY.md AUDIT_COMPLETION_SUMMARY.md COMPLETION_SUMMARY.md \
  DEPLOYMENT_COMPLETION_SUMMARY.md DEPLOYMENT_FIXES_COMPLETE.md \
  DEPLOYMENT_STATUS_2026-01-03.md DEPLOYMENT_STATUS_VERIFICATION_2026-01-01.md \
  FINAL_STATUS_REPORT.md IMPLEMENTATION_STATUS.md PROGRESS_SUMMARY.md \
  STATUS_UPDATE.md VERIFICATION_COMPLETE.md VERIFICATION_FINAL_STATUS.md \
  archive/reports/ai-artifacts/

# Move timestamped reports
git mv DEPLOYMENT_REPORT_20260102.md VERIFICATION_REPORT_2026-01-02.md \
  archive/reports/timestamped/

# Move technical reports
git mv CODEBASE_REVIEW_REPORT.md BACKEND_VERIFICATION_REPORT.md \
  BACKEND_REGRESSION_COVERAGE.md FRONTEND_API_WIRING_REPORT.md \
  FRONTEND_REGRESSION_CHECKLIST.md FRONTEND_AUTH_REALIGNMENT_SUMMARY.md \
  FRONTEND_FINANCE_IMPLEMENTATION_SUMMARY.md FRONTEND_API_NORMALIZATION_COMPLETE.md \
  DATA_INTEGRITY_REPORT.md DJANGO_MIGRATIONS_AUDIT_REPORT.md \
  INTEGRATION_HARDENING_REPORT.md CANONICAL_ENFORCEMENT_REPORT.md \
  DASHBOARD_API_VERIFICATION.md DASHBOARD_STABILIZATION_SUMMARY.md \
  archive/reports/technical/

# Move deployment reports
git mv DEPLOYMENT_COMPLETE.md DEPLOYMENT_VERIFICATION.md \
  DEPLOYMENT_READINESS_ASSESSMENT.md DEPLOY_DEMO_DATA.md \
  FRESH_DEPLOYMENT_SUMMARY.md FINAL_DEPLOYMENT_REPORT.md \
  FINAL_BUILD_REPORT.md DEMO_SCENARIOS_DEPLOYMENT.md \
  DEMO_SCENARIOS_IMPLEMENTATION.md DEMO_SEED_DATA_SUMMARY.md \
  SEED_DEMO_EXECUTION_SUMMARY.md SEEDING_COMPLETE.md \
  POST_DEPLOY_5_MIN_CHECK.md archive/reports/deployment/

# Move implementation reports
git mv IMPLEMENTATION_COMPLETE.md IMPLEMENTATION_REVIEW.md \
  IMPLEMENTATION_SUMMARY.md IMPLEMENTATION_SUMMARY_DEMO_SCENARIOS.md \
  ACADEMICS_MODULE_IMPLEMENTATION.md FINANCE_FIN1_COMPLETE_SUMMARY.md \
  FINANCE_RELEASE_FIN1_SUMMARY.md archive/reports/implementation/

# Move bugfix reports
git mv AUTH_405_FIX_REPORT.md API_DOUBLE_SLASH_FIX.md \
  LOGIN_PAGE_404_FIX.md 404_TROUBLESHOOTING.md \
  archive/reports/bugfixes/

# Move CI/CD reports
git mv CI_GUARDRAILS.md CI_WORKFLOW_FIXES.md archive/reports/ci-cd/

# Move system reports
git mv SYSTEM_BASELINE.md SYSTEM_STABILITY_STATUS.md \
  REPO_VERIFICATION_REPORT.md archive/reports/system/

# Move testing reports
git mv TEST_VERIFICATION.md TESTING_SUMMARY_TASKS_63_66.md \
  TASKS_63_66_COMPLETE.md FEATURE_COMPLETENESS_CHECKLIST.md \
  archive/reports/testing/

# Move misc reports
git mv CODE_REVIEW_STATUS.md ISSUES_REQUIRING_DECISIONS.md \
  DIAGNOSIS_sims_pmc_edu_pk.md DNS_VERIFICATION_REPORT.md \
  PRODUCTION_STATUS.md SCREENSHOTS_INDEX.md \
  STABILITY_SPRINT_REPORT.md UNIFIED-README.md \
  archive/reports/misc/

# Move dead infrastructure
git mv nginx/ archive/infrastructure/

# Move AI tool docs
git mv docs/codex/ archive/docs-ai/
git mv docs/copilot/ archive/docs-ai/

# Move verification tool-specific docs
git mv docs/verification/cursor docs/verification/cursorai docs/verification/jules \
  archive/docs-verification/

# Delete backup file
git rm backend/sims_backend/academics/tests/test_views.py.bak
```

### Doc Dedupe Plan

#### Create Consolidated Index
Create `docs/README.md`:
```markdown
# Documentation Index

## Active Documentation
- [Environment Variables](../ENV_CONTRACT.md)
- [System Architecture](../SYSTEM_CONTRACTS.md)
- [Setup Guide](../MVP_SETUP_GUIDE.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Runbook](../RUNBOOK.md)
- [Security Summary](../SECURITY_SUMMARY.md)

## API Documentation
- [API Docs](api/)

## Architecture Decision Records
- [ADRs](adr/)

## Archived Documentation
- [Historical Reports](../../archive/reports/)
- [AI Tool Outputs](../../archive/docs-ai/)
- [Verification Reports](../../archive/docs-verification/)
```

#### Consolidate Multiple READMEs
- Keep root `README.md` as main entry point
- Keep `backend/README.md` and `frontend/README.md` for module-specific setup
- Archive or merge duplicate module READMEs

### Optional: Add docs/README.md as Index
(Command shown above in doc dedupe plan)

---

## 9. Phase C Verification (Minimal Pass/Fail Checks)

### Pre-Phase B Verification
```bash
# Count root MD files (should be 82)
find . -maxdepth 1 -type f -name "*.md" | wc -l

# Verify secrets are tracked (should show files)
git ls-files | grep -E '\.env$|\.env\.backup|\.dump$'

# Verify nginx exists (should exist)
test -d nginx && echo "EXISTS" || echo "MISSING"

# Count backup files (should be 1)
git ls-files | grep -E '\.bak$' | wc -l
```

### Post Phase B-S Verification
```bash
# Secrets should NOT be tracked
git ls-files | grep -E '\.env$|\.env\.backup|\.dump$'
# Expected: No output

# Secrets should be in .gitignore
git check-ignore .env .env.backup *.dump
# Expected: All should match

# Verify history is clean (should show no commits)
git log --all --full-history -- .env | head -n 1
# Expected: "fatal: your current branch 'main' does not have any commits yet" OR no .env commits
```

### Post Phase B-H Verification
```bash
# Root MD files should be reduced (target: ~15-20)
find . -maxdepth 1 -type f -name "*.md" | wc -l

# nginx should be in archive
test -d archive/infrastructure/nginx && echo "OK" || echo "MISSING"
test -d nginx && echo "STILL EXISTS" || echo "OK"

# Backup files should be removed
git ls-files | grep -E '\.bak$'
# Expected: No output

# Archive structure should exist
test -d archive/reports/ai-artifacts && echo "OK" || echo "MISSING"
test -d archive/infrastructure && echo "OK" || echo "MISSING"

# AI tool docs should be archived
test -d archive/docs-ai/codex && echo "OK" || echo "MISSING"
test -d archive/docs-ai/copilot && echo "OK" || echo "MISSING"

# Verification tool docs should be archived
test -d archive/docs-verification/cursor && echo "OK" || echo "MISSING"
```

### Minimal Success Criteria
- [ ] All secret files removed from git tracking
- [ ] All secret files in .gitignore
- [ ] Git history purged of secrets (verified with git log)
- [ ] Root markdown files reduced from 82 to <25
- [ ] nginx/ moved to archive
- [ ] Backup files removed
- [ ] Archive structure created
- [ ] AI tool docs moved to archive
- [ ] Repository still builds and runs (smoke test)

---

## 10. TODO Checklist

### Phase B-S (Security)
- [ ] **Inventory counts + top-level tree** ✅ Complete (Section 1)
- [ ] **Tracked secrets list (no values)** ✅ Complete (Section 2)
- [ ] Backup repository before history rewrite
- [ ] Install git-filter-repo tool
- [ ] Execute git-filter-repo commands for each secret file
- [ ] Update .gitignore with secret patterns
- [ ] Generate new DJANGO_SECRET_KEY
- [ ] Rotate DB_PASSWORD
- [ ] Update all environment files (not tracked)
- [ ] Update CI/CD secrets
- [ ] Force push rewritten history (with team coordination)
- [ ] Notify team to reset local clones
- [ ] Verify history is clean (git log checks)
- [ ] Verify secrets not tracked (git ls-files checks)

### Phase B-H (Hygiene)
- [ ] **Root markdown bloat count + shortlist** ✅ Complete (Section 3)
- [ ] **Docs duplication map** ✅ Complete (Section 4)
- [ ] **Dead infra evidence (compose refs)** ✅ Complete (Section 5)
- [ ] **Junk/backup code list** ✅ Complete (Section 6)
- [ ] Create archive directory structure
- [ ] Move AI artifact reports to archive/reports/
- [ ] Move dead nginx configs to archive/infrastructure/
- [ ] Move AI tool docs to archive/docs-ai/
- [ ] Move verification tool docs to archive/docs-verification/
- [ ] Remove backup files (.bak)
- [ ] Create docs/README.md index
- [ ] Commit all moves with descriptive message
- [ ] Verify root markdown count reduced
- [ ] Verify archive structure exists

### Phase C (Verification)
- [ ] **Phase B-S plan with exact purge list** ✅ Complete (Section 7)
- [ ] **Phase B-H plan with exact move lists** ✅ Complete (Section 8)
- [ ] **Minimal Phase C verification commands** ✅ Complete (Section 9)
- [ ] Run pre-Phase B verification
- [ ] Execute Phase B-S
- [ ] Run post Phase B-S verification
- [ ] Execute Phase B-H
- [ ] Run post Phase B-H verification
- [ ] Smoke test: repository builds
- [ ] Smoke test: application runs
- [ ] Document final state

---

**END OF REPORT**
