# Migration Guide: Repository Restructure

**For developers working with branches created before the cleanup**

This guide helps you navigate the repository structure changes and update your local branches.

## What Changed

### Directory Renames
- `Docs/` → `docs/` (lowercase)

### New Directories
- `scripts/` - Contains all utility scripts (formerly at root)
- `archive/` - Contains all legacy/historical content

### Files Moved

#### From Root → scripts/
- `quick-start.sh`
- `restore.sh`
- `test_api_endpoints.sh`
- `test_integration.sh`
- `validate_completion.sh`
- `validate_docker_deployment.sh`
- `validate_release.sh`
- `validate_stage4.sh`

#### From Root → archive/reports/
- 18 historical markdown files (BUGFIX_REPORT.md, COMPLETION_SUMMARY.md, etc.)

#### From Docs/ → archive/reports/
- 30+ historical completion reports and development summaries

#### From backend/Docs/ → archive/backend-docs/
- `coverage_analysis.md`

#### From backend/seed/ → archive/seed-data/
- `demo_students.json`

## Impact on Your Workflow

### ✅ NO Impact on Code
- Backend code: No changes
- Frontend code: No changes
- Docker configurations: No changes
- CI/CD workflows: No changes

### 📝 Documentation References
If you reference documentation in your code or scripts:
- Change `Docs/` to `docs/`
- Example: `Docs/API.md` → `docs/API.md`

### 🔧 Script Execution
Scripts are now in `scripts/` directory:

**Before:**
```bash
./validate_release.sh
```

**After:**
```bash
./scripts/validate_release.sh
# or from scripts directory:
cd scripts && ./validate_release.sh
```

## Updating Your Branch

### Option 1: Rebase Your Branch (Recommended)
```bash
# Fetch latest changes
git fetch origin

# Switch to main branch
git checkout main
git pull origin main

# Switch back to your branch
git checkout your-branch-name

# Rebase onto updated main
git rebase main

# Resolve any conflicts if they arise
# Then continue:
git rebase --continue

# Force push your rebased branch
git push --force-with-lease
```

### Option 2: Merge Main into Your Branch
```bash
# Fetch latest changes
git fetch origin

# Switch to your branch
git checkout your-branch-name

# Merge main
git merge origin/main

# Resolve any conflicts if they arise
# Then commit:
git commit

# Push your branch
git push
```

## Common Migration Scenarios

### Scenario 1: You Reference Docs/ in Your Code
**Issue:** Your code has `Docs/API.md` references

**Solution:**
```bash
# Find all references
grep -r "Docs/" .

# Update references
sed -i 's/Docs\//docs\//g' path/to/your/file.md
```

### Scenario 2: You Have a Script That Calls Scripts
**Issue:** Your script calls `./validate_release.sh`

**Solution:** Update to `./scripts/validate_release.sh`

### Scenario 3: You Added Documentation
**Issue:** You added files to `Docs/`

**Solution:** After merging/rebasing, move your new docs to `docs/`
```bash
git mv Docs/YOUR_NEW_DOC.md docs/YOUR_NEW_DOC.md
```

### Scenario 4: You Created Completion Reports
**Issue:** You have new completion reports at root

**Solution:** 
- If active/relevant: Keep in `docs/`
- If historical: Move to `archive/reports/`

## Conflict Resolution

### Common Conflicts

#### 1. Docs/ vs docs/ Conflict
```
CONFLICT (rename/delete): Docs/SOME_FILE.md deleted in HEAD 
and renamed to docs/SOME_FILE.md in main
```

**Resolution:**
```bash
# The file was renamed, accept the new location
git add docs/SOME_FILE.md
git rebase --continue
```

#### 2. Root Script Moved
```
CONFLICT (rename/rename): Scripts moved to scripts/ directory
```

**Resolution:**
```bash
# Accept the new location
git add scripts/script_name.sh
git rebase --continue
```

## Testing After Migration

### 1. Run Tests
```bash
# Backend
cd backend && pytest tests

# Frontend
cd frontend && npm test
```

### 2. Verify Scripts
```bash
# Run a validation script
./scripts/validate_release.sh
```

### 3. Check Documentation Links
```bash
# Check for broken Docs/ references
grep -r "Docs/" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=archive
```

## FAQ

### Q: Do I need to update my PR?
**A:** Only if you:
- Reference `Docs/` in your changes (change to `docs/`)
- Call scripts from root (update to `scripts/`)
- Have documentation in wrong location

### Q: Will my old branch still work?
**A:** Yes! All code functionality is preserved. Only file locations changed.

### Q: What if I accidentally commit to Docs/ instead of docs/?
**A:** Simply move the file:
```bash
git mv Docs/YOUR_FILE.md docs/YOUR_FILE.md
git commit -m "fix: move doc to lowercase docs directory"
```

### Q: Do I need to update import statements?
**A:** No! Code imports are unchanged. Only documentation paths changed.

### Q: What about CI/CD?
**A:** No changes needed. All workflows already updated.

## Getting Help

If you encounter issues:

1. Check [REPO_STRUCTURE.md](REPO_STRUCTURE.md) for current structure
2. Check [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md) for what changed
3. Review the commit history on main branch
4. Ask in project discussions or create an issue

## Quick Reference

### Find Files
```bash
# Find active documentation
ls docs/

# Find scripts
ls scripts/

# Find historical reports
ls archive/reports/

# Find where something moved to
git log --follow --all -- path/to/old/location
```

### Update References
```bash
# Update Docs/ to docs/ in all markdown files
find . -name "*.md" -exec sed -i 's/Docs\//docs\//g' {} +

# Update script references
find . -name "*.sh" -exec sed -i 's/\.\/validate/\.\/scripts\/validate/g' {} +
```

---

**Remember:** This is a structural change only. No code functionality changed. All tests pass. All features work.
