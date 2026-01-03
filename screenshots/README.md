# Frontend Screenshots Index

This directory contains screenshots of all dashboard and module pages from the FMU Platform frontend.

**Capture Date:** January 3, 2026  
**Total Screenshots:** 45  
**Resolution:** 1920x1080 (Full Page)

---

## 📸 Screenshots by Category

### Authentication Pages
- `login.png` - Login Page

### Main Dashboards
- `dashboard.png` - Main Dashboard Home
- `dashboard_admin.png` - Admin Dashboard
- `dashboard_registrar.png` - Registrar Dashboard
- `dashboard_faculty.png` - Faculty Dashboard
- `dashboard_student.png` - Student Dashboard
- `dashboard_examcell.png` - Exam Cell Dashboard

### Finance Module (10 pages)
- `finance.png` - Finance Dashboard
- `finance_fee-plans.png` - Fee Plans Management
- `finance_vouchers.png` - Voucher Generation
- `finance_vouchers_list.png` - Vouchers List
- `finance_payments.png` - Payments Management
- `finance_me.png` - Student Finance View
- `finance_reports_defaulters.png` - Defaulters Report
- `finance_reports_collection.png` - Collection Report
- `finance_reports_aging.png` - Aging Report
- `finance_reports_statement.png` - Student Statement Report

### Attendance Module (4 pages)
- `attendance.png` - Attendance Dashboard
- `attendance_input.png` - Attendance Input
- `attendance_eligibility.png` - Eligibility Report
- `attendance_bulk.png` - Bulk Attendance

### Academics Module (5 pages)
- `academics_programs.png` - Programs Management
- `academics_batches.png` - Batches Management
- `academics_periods.png` - Academic Periods
- `academics_groups.png` - Groups Management
- `academics_departments.png` - Departments Management

### Student Management (2 pages)
- `students.png` - Students List
- `admin_students_import.png` - Student Import

### Course Management (3 pages)
- `courses.png` - Courses Management
- `sections.png` - Sections Management
- `timetable.png` - Timetable

### Assessments & Exams (5 pages)
- `assessments.png` - Assessments Management
- `gradebook.png` - Gradebook
- `exams.png` - Exams Management
- `results.png` - Results View
- `examcell_publish.png` - Publish Results

### Enrollment (1 page)
- `enrollment_bulk.png` - Bulk Enrollment

### Admin Pages (3 pages)
- `admin_users.png` - Users Management
- `admin_roles.png` - Roles Management
- `admin_audit.png` - Audit Log

### Other Pages (4 pages)
- `analytics.png` - Analytics Dashboard
- `profile.png` - User Profile
- `requests.png` - Requests Management
- `transcripts.png` - Transcripts
- `apply.png` - Student Application (Public)

---

## 📋 Quick Reference

### By Route
- `/login` → `login.png`
- `/dashboard` → `dashboard.png`
- `/dashboard/admin` → `dashboard_admin.png`
- `/dashboard/registrar` → `dashboard_registrar.png`
- `/dashboard/faculty` → `dashboard_faculty.png`
- `/dashboard/student` → `dashboard_student.png`
- `/dashboard/examcell` → `dashboard_examcell.png`
- `/finance` → `finance.png`
- `/finance/fee-plans` → `finance_fee-plans.png`
- `/finance/vouchers` → `finance_vouchers.png`
- `/finance/vouchers/list` → `finance_vouchers_list.png`
- `/finance/payments` → `finance_payments.png`
- `/finance/me` → `finance_me.png`
- `/finance/reports/defaulters` → `finance_reports_defaulters.png`
- `/finance/reports/collection` → `finance_reports_collection.png`
- `/finance/reports/aging` → `finance_reports_aging.png`
- `/finance/reports/statement` → `finance_reports_statement.png`
- `/attendance` → `attendance.png`
- `/attendance/input` → `attendance_input.png`
- `/attendance/eligibility` → `attendance_eligibility.png`
- `/attendance/bulk` → `attendance_bulk.png`
- `/academics/programs` → `academics_programs.png`
- `/academics/batches` → `academics_batches.png`
- `/academics/periods` → `academics_periods.png`
- `/academics/groups` → `academics_groups.png`
- `/academics/departments` → `academics_departments.png`
- `/students` → `students.png`
- `/admin/students/import` → `admin_students_import.png`
- `/courses` → `courses.png`
- `/sections` → `sections.png`
- `/timetable` → `timetable.png`
- `/assessments` → `assessments.png`
- `/gradebook` → `gradebook.png`
- `/exams` → `exams.png`
- `/results` → `results.png`
- `/examcell/publish` → `examcell_publish.png`
- `/enrollment/bulk` → `enrollment_bulk.png`
- `/admin/users` → `admin_users.png`
- `/admin/roles` → `admin_roles.png`
- `/admin/audit` → `admin_audit.png`
- `/analytics` → `analytics.png`
- `/profile` → `profile.png`
- `/requests` → `requests.png`
- `/transcripts` → `transcripts.png`
- `/apply` → `apply.png`

---

## 🔄 Re-capturing Screenshots

To update screenshots, run:

```bash
python scripts/capture_screenshots.py \
  --url http://localhost:8080 \
  --output screenshots/ \
  --username admin \
  --password admin123
```

For specific pages:

```bash
python scripts/capture_screenshots.py \
  --url http://localhost:8080 \
  --output screenshots/ \
  --username admin \
  --password admin123 \
  --pages /dashboard /finance
```

See `scripts/SCREENSHOT_GUIDE.md` for more details.

---

## 📝 Notes

- Screenshots are captured at 1920x1080 resolution
- Full-page screenshots are captured (includes content below the fold)
- Some pages may show login/error screens if authentication is required
- To capture authenticated views, ensure valid credentials are provided
