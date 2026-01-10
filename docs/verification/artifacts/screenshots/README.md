# Screenshot Artifacts

This directory contains UI screenshots captured during verification.

## Required Screenshots

### Core Pages
- `login_page.png` - Login page UI
- `student_list.png` - Student list page
- `academics_management.png` - Academics management page

### Admin Pages
- `admin_dashboard.png` - Admin dashboard overview
- `admin_syllabus_manager.png` - Admin syllabus manager
- `admin_settings.png` - Admin settings page
- `admin_users.png` - Admin users management

### Additional
- `hierarchy_navigation.png` - Academic hierarchy navigation
- `attendance_input.png` - Attendance entry UI
- `marks_entry.png` - Marks entry UI
- `attendance_reports.png` - Attendance reports
- `defaulter_list.png` - Defaulter list
- `faculty_dashboard.png` - Faculty dashboard

## Capture Method

Screenshots should be captured using Playwright:

```bash
cd frontend
npx playwright test --headed
# Or use admin-screenshots.spec.ts if it exists
```

Or manually:
1. Navigate to page in browser
2. Take screenshot
3. Save to this directory

## Status

**Note:** These are placeholder references. Actual screenshots need to be captured in proper environment with running stack.

---

**Last Updated:** 2026-01-09
