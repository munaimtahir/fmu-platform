# FMU Platform - Screenshots Index

This document provides a visual index of all screenshots captured for the FMU Platform, organized by module and feature.

**Screenshot Directory:** `/screenshots/`  
**Total Screenshots:** 50+  
**Last Updated:** January 3, 2026

---

## Quick Access

All screenshots are stored in the `screenshots/` directory. To view a screenshot, navigate to:
```
/home/munaim/srv/apps/fmu-platform/screenshots/[filename].png
```

---

## Screenshots by Module

### 🔐 Authentication & Core

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Login Page | User authentication interface | `screenshots/login.png` |
| User Profile | User profile management | `screenshots/profile.png` |
| Main Dashboard | Default dashboard view | `screenshots/dashboard.png` |

### 👥 Role-Specific Dashboards

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Admin Dashboard | Administrative overview | `screenshots/dashboard_admin.png` |
| Registrar Dashboard | Registrar overview | `screenshots/dashboard_registrar.png` |
| Faculty Dashboard | Faculty overview | `screenshots/dashboard_faculty.png` |
| Student Dashboard | Student overview | `screenshots/dashboard_student.png` |
| Exam Cell Dashboard | Exam cell overview | `screenshots/dashboard_examcell.png` |

### 📚 Academics Module

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Programs Management | Academic programs list and management | `screenshots/academics_programs.png` |
| Batches Management | Student batches management | `screenshots/academics_batches.png` |
| Academic Periods | Period management interface | `screenshots/academics_periods.png` |
| Groups Management | Student groups management | `screenshots/academics_groups.png` |
| Departments Management | Department hierarchy management | `screenshots/academics_departments.png` |

### 💰 Finance Module

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Finance Dashboard | Main finance overview | `screenshots/finance.png` |
| Fee Plans | Fee plan templates management | `screenshots/finance_fee-plans.png` |
| Voucher Generation | Create payment vouchers | `screenshots/finance_vouchers.png` |
| Vouchers List | View all vouchers | `screenshots/finance_vouchers_list.png` |
| Payments Management | Payment records and processing | `screenshots/finance_payments.png` |
| Student Finance View | Student's own finance view | `screenshots/finance_me.png` |
| Defaulters Report | Students with outstanding fees | `screenshots/finance_reports_defaulters.png` |
| Collection Report | Payment collection summary | `screenshots/finance_reports_collection.png` |
| Aging Report | Accounts receivable aging | `screenshots/finance_reports_aging.png` |
| Student Statement | Individual student ledger | `screenshots/finance_reports_statement.png` |

### 📋 Attendance Module

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Attendance Dashboard | Attendance overview | `screenshots/attendance.png` |
| Attendance Input | Manual attendance entry | `screenshots/attendance_input.png` |
| Eligibility Report | Attendance eligibility check | `screenshots/attendance_eligibility.png` |
| Bulk Attendance | Bulk attendance processing | `screenshots/attendance_bulk.png` |

### 👨‍🎓 Student Management

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Students List | All students view | `screenshots/students.png` |
| Student Import | CSV import interface | `screenshots/admin_students_import.png` |
| Student Application | Public application form | `screenshots/apply.png` |

### 📖 Course Management

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Courses Management | Course catalog | `screenshots/courses.png` |
| Sections Management | Course sections | `screenshots/sections.png` |
| Timetable | Class schedule | `screenshots/timetable.png` |

### 📝 Exams & Results

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Exams Management | Exam creation and management | `screenshots/exams.png` |
| Results View | Student results display | `screenshots/results.png` |
| Gradebook | Faculty gradebook | `screenshots/gradebook.png` |
| Publish Results | Exam cell results publishing | `screenshots/examcell_publish.png` |
| Assessments | Assessment management | `screenshots/assessments.png` |

### 📊 Enrollment

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Bulk Enrollment | Bulk student enrollment | `screenshots/enrollment_bulk.png` |

### ⚙️ Admin Pages

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Users Management | User account management | `screenshots/admin_users.png` |
| Roles Management | Role and permission management | `screenshots/admin_roles.png` |
| Audit Log | System audit trail | `screenshots/admin_audit.png` |

### 📈 Analytics & Other

| Screenshot | Description | File Path |
|------------|-------------|-----------|
| Analytics Dashboard | System analytics | `screenshots/analytics.png` |
| Requests Management | Student requests | `screenshots/requests.png` |
| Transcripts | Transcript management | `screenshots/transcripts.png` |

---

## Screenshot Capture Information

### Capture Method
Screenshots were captured using automated Playwright scripts from the production environment:
- **URL:** https://sims.alshifalab.pk
- **Date:** January 3, 2026
- **Tool:** Playwright with Chromium browser
- **Format:** PNG
- **Resolution:** Full page screenshots

### Capture Script
The screenshots were generated using:
```bash
python3 scripts/capture_screenshots.py \
  --url https://sims.alshifalab.pk \
  --output screenshots/ \
  --username admin \
  --password admin123
```

For more details, see: `scripts/SCREENSHOT_GUIDE.md`

---

## Viewing Screenshots

### Option 1: Direct File Access
Navigate to the screenshots directory:
```bash
cd /home/munaim/srv/apps/fmu-platform/screenshots/
ls -la *.png
```

### Option 2: Image Viewer
Open any screenshot file with your preferred image viewer:
```bash
# Linux
xdg-open screenshots/login.png

# macOS
open screenshots/login.png

# Windows
start screenshots/login.png
```

### Option 3: Web Browser
If you have a local web server running, you can view screenshots in a browser:
```bash
# Python 3
python3 -m http.server 8000
# Then navigate to http://localhost:8000/screenshots/
```

---

## Screenshot Statistics

- **Total Screenshots:** 50+
- **Modules Covered:** 15+
- **Pages Documented:** 50+
- **Last Updated:** January 3, 2026
- **Coverage:** ~90% of all frontend pages

---

## Missing Screenshots

The following pages may need screenshots (if not already captured):
- [ ] Some admin report pages
- [ ] Some detail views
- [ ] Mobile responsive views (if applicable)

To capture missing screenshots, see: `scripts/SCREENSHOT_GUIDE.md`

---

## Notes

1. **Screenshot Quality:** All screenshots are full-page captures showing the complete interface
2. **Data Privacy:** Screenshots may contain demo/test data
3. **Browser:** Screenshots captured using Chromium browser
4. **Resolution:** Screenshots maintain original page dimensions
5. **Updates:** Screenshots should be updated when UI changes significantly

---

**Last Updated:** January 5, 2026  
**Maintained By:** Development Team

