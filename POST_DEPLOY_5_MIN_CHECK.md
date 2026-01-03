# Post-Deploy 5-Minute Check

**Last Updated:** 2026-01-03  
**Purpose:** Quick human verification checklist after deployment. Takes ~5 minutes.

---

## Overview

After every deployment, perform this 5-minute check to verify critical functionality. This is a **human check**, not automated. No screenshots needed - only pass/fail.

---

## Pre-Check: Run Pre-Deploy Script

**Before starting this check, ensure:**
- ✅ `scripts/pre_deploy_verify.sh` passed
- ✅ Deployment completed successfully
- ✅ Services are running

---

## 1. Open Student Dashboard (1 minute)

### Steps:
1. Navigate to student login page
2. Login as a student user
3. Open student dashboard (`/dashboard/student`)

### Check:
- [ ] Dashboard loads without errors
- [ ] Student name/ID displayed correctly
- [ ] No console errors (check browser DevTools)
- [ ] No 404 errors in network tab
- [ ] No 500 errors in network tab

### Expected:
- Dashboard shows student-specific data
- No blank screens
- No error messages

### If Failed:
- Check browser console for errors
- Check server logs
- Verify student user exists and is linked to Student record
- Check API endpoints are accessible

**Status:** [ ] PASS [ ] FAIL

---

## 2. Open Faculty Dashboard (1 minute)

### Steps:
1. Logout (if logged in as student)
2. Login as a faculty user
3. Open faculty dashboard (`/dashboard/faculty`)

### Check:
- [ ] Dashboard loads without errors
- [ ] Faculty name displayed correctly
- [ ] No console errors
- [ ] No 404/500 errors in network tab

### Expected:
- Dashboard shows faculty-specific data
- Sections/courses visible (if assigned)
- No blank screens

### If Failed:
- Check browser console
- Check server logs
- Verify faculty user exists
- Check faculty has assigned sections

**Status:** [ ] PASS [ ] FAIL

---

## 3. Verify Attendance & Results Load (2 minutes)

### Student View:
1. While logged in as student:
   - [ ] Navigate to `/attendance`
   - [ ] Attendance records load (or empty state if no records)
   - [ ] Navigate to `/results`
   - [ ] Results load (or empty state if no published results)

### Faculty View:
1. While logged in as faculty:
   - [ ] Navigate to `/attendance`
   - [ ] Attendance records load for assigned sections
   - [ ] Can view attendance for assigned sections only

### Check:
- [ ] No console errors
- [ ] No 404/500 errors
- [ ] Data displays correctly (or appropriate empty state)
- [ ] Student only sees own data
- [ ] Faculty only sees assigned sections

### Expected:
- Student: Own attendance/results only
- Faculty: Assigned sections only
- No cross-contamination of data

### If Failed:
- Check API responses in network tab
- Verify permissions are working
- Check database queries in server logs

**Status:** [ ] PASS [ ] FAIL

---

## 4. Check Browser Console (30 seconds)

### Steps:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors

### Check:
- [ ] No red error messages
- [ ] No failed API calls (check Network tab)
- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] No authentication errors

### Expected:
- Console is clean (or only expected warnings)
- No critical errors

### If Failed:
- Note the error message
- Check if it's a known issue
- Document the error for investigation

**Status:** [ ] PASS [ ] FAIL

---

## 5. Check Server Logs (30 seconds)

### Steps:
1. Access server logs (via Docker, SSH, or log viewer)
2. Check for errors in last 5 minutes

### Check:
- [ ] No 500 Internal Server Errors
- [ ] No database connection errors
- [ ] No authentication errors
- [ ] No permission denied errors
- [ ] No critical exceptions

### Expected:
- Logs show normal operation
- Only expected warnings (if any)
- No stack traces

### If Failed:
- Note the error
- Check error frequency
- Determine if it's blocking or non-blocking

**Status:** [ ] PASS [ ] FAIL

---

## Summary

### Quick Checklist:
- [ ] Student dashboard works
- [ ] Faculty dashboard works
- [ ] Attendance loads correctly
- [ ] Results load correctly
- [ ] Browser console clean
- [ ] Server logs clean

### Overall Status:
- [ ] ✅ **PASS** - All checks passed, deployment successful
- [ ] ❌ **FAIL** - Issues found, needs investigation

---

## If Checks Fail

### Immediate Actions:
1. **Document the failure:**
   - What failed?
   - When did it fail?
   - Error messages?

2. **Check recent changes:**
   - What was deployed?
   - Any recent code changes?
   - Any configuration changes?

3. **Rollback decision:**
   - Is it critical? (Student/Faculty portals broken)
   - Can it wait? (Minor UI issue)
   - Rollback if critical functionality broken

4. **Investigation:**
   - Check SYSTEM_CONTRACTS.md for contract violations
   - Run regression tests locally
   - Check CI logs for missed failures

---

## Notes

- **No screenshots needed** - This is a quick pass/fail check
- **Focus on functionality** - Not visual design
- **5 minutes max** - Don't spend more time
- **Document failures** - Note any issues for follow-up

---

## Frequency

- **After every deployment** - Run this check
- **Before marking deployment complete** - Must pass all checks
- **Before running next deployment** - Previous deployment must be verified

---

## Integration with Pre-Deploy Script

This check complements `scripts/pre_deploy_verify.sh`:

- **Pre-deploy script:** Automated checks (health, login, endpoints)
- **Post-deploy check:** Human verification (UI, user experience)

Both must pass for a successful deployment.

---

**Status:** ✅ **CHECKLIST READY** - Use after every deployment
