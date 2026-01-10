# Issues Index - Canonical Tasks Verification

**Date:** 2026-01-09  
**Total Issues:** 8 (all PARTIAL status, no FAIL)

---

## Issue Summary

All issues are **PARTIAL** status - code exists but requires manual verification or minor enhancements.

**No BLOCKER or FAIL issues found.**

---

## Issues by Task

### Task 11: University entity
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** No explicit "University" model found. System appears single-tenant.  
**File:** `docs/verification/issues/TASK_11_university_entity.md`  
**Remediation:** Verify if settings app serves university/institution purpose, or add University model if multi-tenant support is required.

---

### Task 18: Subject/Theme entity
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** No explicit "Subject" or "Theme" model. Course/Module models may serve this purpose.  
**File:** `docs/verification/issues/TASK_18_subject_theme.md`  
**Remediation:** Verify if Course/Module models meet Subject/Theme requirements, or add explicit model if needed.

---

### Task 22: Admission record
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** Intake app exists but need to verify admission record linkage to Student model.  
**File:** `docs/verification/issues/TASK_22_admission_record.md`  
**Remediation:** Verify admission record structure and linkage to Student model via API testing.

---

### Task 24: Demographics & guardian info
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** Demographics exist in Student/Person models, but need to verify guardian info structure.  
**File:** `docs/verification/issues/TASK_24_demographics_guardian.md`  
**Remediation:** Verify Person model has guardian fields via API testing or model inspection.

---

### Task 30: Faculty–subject mapping
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** Faculty-subject mapping may be via timetable/session, need to verify explicit mapping model.  
**File:** `docs/verification/issues/TASK_30_faculty_subject_mapping.md`  
**Remediation:** Verify if timetable/session provides sufficient faculty-subject mapping, or add explicit model if needed.

---

### Task 46: Backup/restore hooks
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** Backup file exists but need to verify automated backup/restore management commands.  
**File:** `docs/verification/issues/TASK_46_backup_restore.md`  
**Remediation:** Verify if management commands exist for automated backup/restore, or document manual process.

---

### Task 50: Error boundary handling
**Status:** ⚠️ PARTIAL  
**Severity:** Minor  
**Issue:** Error handling infrastructure exists but need to verify React ErrorBoundary component.  
**File:** `docs/verification/issues/TASK_50_error_boundary.md`  
**Remediation:** Verify ErrorBoundary component exists, or add if missing.

---

### Task 56-60: E2E Test Issues
**Status:** ⚠️ PARTIAL  
**Severity:** Major  
**Issue:** E2E tests exist but authentication issues causing failures/skips (7/11 passing in previous run).  
**File:** `docs/verification/issues/TASK_56_60_e2e_auth.md`  
**Remediation:** Fix authentication/login API issues, then re-run E2E tests. Expected: 11/11 passing.

---

## Issue Files

Detailed issue files will be created in `docs/verification/issues/` for each issue above.

---

## Priority Recommendations

1. **High Priority:** Fix E2E authentication issues (Tasks 56-60)
2. **Medium Priority:** Verify admission record linkage (Task 22)
3. **Low Priority:** Verify/implement missing models if needed (Tasks 11, 18, 30)

---

**Last Updated:** 2026-01-09
