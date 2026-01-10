# Features Explained

This document describes what the system can do, organized by purpose rather than technical implementation. Each feature is explained in plain language.

---

## User Management

### Account Creation & Login
**What it does:** Allows authorized staff to create accounts for new users and assign them appropriate access levels.

**Why it is useful:** Ensures only authorized people can access the system and that each person sees only what they need for their job.

**Who uses it:** Administrators create accounts; all users log in with their credentials.

### Role Assignment
**What it does:** Assigns specific job roles to users (Administrator, Registrar, Faculty, Finance, etc.) which determines what features they can access.

**Why it is useful:** Automatically enforces proper separation of duties. Faculty members cannot access finance records, finance staff cannot change grades, etc.

**Who uses it:** Administrators assign roles when creating or updating user accounts.

### Password Management
**What it does:** Allows users to change their own passwords and administrators to reset passwords for users who forget them.

**Why it is useful:** Maintains security while ensuring users don't lose access to their accounts.

**Who uses it:** All users for their own passwords; administrators to help users who are locked out.

---

## Student Records Management

### Student Registration
**What it does:** Captures all basic information about a student including name, contact details, program of study, and batch assignment.

**Why it is useful:** Creates the foundation record that all other modules reference. Every student needs a record before any other operations can occur.

**Who uses it:** Registrar staff enter information for newly admitted students.

### Student Intake Form
**What it does:** Provides a public web form where prospective students can submit their application information before official admission.

**Why it is useful:** Reduces data entry burden on staff. Students enter their own information, which goes into a verification queue for staff review and approval.

**Who uses it:** Prospective students fill the form; registrar staff review and approve submissions.

### Student Search & Lookup
**What it does:** Allows quick searching for students by name, registration number, program, or other criteria.

**Why it is useful:** Staff can quickly locate any student record without searching through lists or paper files.

**Who uses it:** All staff members need to look up students for various tasks.

### Student Import
**What it does:** Allows bulk import of student records from spreadsheet files.

**Why it is useful:** Speeds up initial data entry when bringing existing records into the system or adding a new batch of students.

**Who uses it:** Registrar staff during initial setup or annual admission cycles.

---

## Academic Structure Management

### Programs & Departments
**What it does:** Defines the academic programs offered (MBBS, BDS, BS Nursing, etc.) and organizational departments.

**Why it is useful:** Establishes the organizational structure of the university in the system.

**Who uses it:** Administrators set up programs and departments based on university structure.

### Batches & Groups
**What it does:** Organizes students into year groups (batches) and smaller class divisions (groups or sections).

**Why it is useful:** Allows tracking cohorts of students who started in the same year and dividing large classes into manageable teaching groups.

**Who uses it:** Registrar staff assign students to batches and groups during enrollment.

### Academic Periods
**What it does:** Defines terms or semesters with start and end dates.

**Why it is useful:** Organizes academic activities by time periods and prevents operations on closed terms (like generating fees for past semesters).

**Who uses it:** Administrators define terms; all modules reference these periods.

---

## Class Scheduling & Timetables

### Session Management
**What it does:** Creates class schedules showing when and where specific courses are taught.

**Why it is useful:** Students and faculty know when and where classes happen. The system can check for scheduling conflicts.

**Who uses it:** Office assistants or coordinators create schedules; faculty and students view them.

### Faculty Assignment
**What it does:** Links teaching staff to specific courses and groups.

**Why it is useful:** Makes clear who is responsible for teaching each class and marking attendance/results for it.

**Who uses it:** Coordinators assign faculty; faculty view their assignments.

---

## Attendance Tracking

### Daily Attendance Marking
**What it does:** Faculty or office assistants mark which students were present, absent, late, or had excused absences for each class session.

**Why it is useful:** Creates an official record of student attendance that can be referenced for eligibility rules and reports.

**Who uses it:** Faculty or office assistants mark attendance; students view their own records.

### Attendance Percentage Calculation
**What it does:** Automatically calculates what percentage of classes each student has attended.

**Why it is useful:** Eliminates manual counting. The system instantly shows if a student falls below required attendance thresholds.

**Who uses it:** Faculty and registrar staff monitor attendance; students check their own percentages.

### Attendance Reports
**What it does:** Generates lists of students with low attendance or attendance summaries by class or program.

**Why it is useful:** Helps identify students at risk and supports regulatory reporting requirements.

**Who uses it:** Faculty and coordinators review reports to identify intervention needs.

### Bulk Attendance Input
**What it does:** Allows uploading attendance data from spreadsheet files or scanning physical attendance sheets.

**Why it is useful:** Speeds up data entry when attendance is collected on paper and needs to be digitized.

**Who uses it:** Office assistants process bulk attendance records.

---

## Examinations & Assessments

### Exam Configuration
**What it does:** Sets up exam schedules including dates, components (midterm, final, quizzes), and grading weights.

**Why it is useful:** Defines how student performance will be measured and ensures all components add up correctly.

**Who uses it:** Exam cell staff configure exams; faculty see the structure when entering marks.

### Assessment Rules
**What it does:** Defines passing criteria (minimum scores, whether students must pass each component separately, etc.).

**Why it is useful:** Ensures grading is consistent and follows university policies. The system automatically calculates pass/fail status.

**Who uses it:** Exam cell staff set rules; the system applies them automatically during result calculation.

### Marks Entry
**What it does:** Allows faculty or office assistants to enter student scores for each assessment component.

**Why it is useful:** Moves from paper mark sheets to digital records, reducing transcription errors.

**Who uses it:** Faculty enter marks for their courses; office assistants may assist with data entry.

---

## Results & Grades

### Result Compilation
**What it does:** Automatically calculates final grades based on all assessment scores and the defined grading rules.

**Why it is useful:** Eliminates manual calculation errors and saves hours of staff time during result preparation.

**Who uses it:** The system performs calculations; faculty propose results; registrar/exam cell verify them.

### Result Workflow
**What it does:** Enforces a three-stage approval process: Draft → Verified → Published.

**Why it is useful:** Ensures results are checked before students see them and prevents accidental changes to finalized grades.

**Who uses it:** Faculty create draft results; coordinators verify them; exam cell publishes them to students.

### Result Freezing
**What it does:** Locks results to prevent any further changes.

**Why it is useful:** Creates a permanent official record after a defined period. Frozen results cannot be altered even by administrators.

**Who uses it:** Exam cell staff freeze results after all corrections and appeals are completed.

### Grade Sheets & Transcripts
**What it does:** Generates formatted printable documents showing student grades.

**Why it is useful:** Provides official documentation for students, employers, and other institutions.

**Who uses it:** Registrar staff generate transcripts upon student request.

---

## Financial Management

### Fee Types & Plans
**What it does:** Defines different categories of fees (tuition, exam fees, library fees) and the amounts for each program and term.

**Why it is useful:** Centralizes fee structure so vouchers are generated correctly and consistently.

**Who uses it:** Finance officers set up fee plans; the system uses them for voucher generation.

### Fee Voucher Generation
**What it does:** Automatically creates fee payment vouchers for students showing what they owe and when payment is due.

**Why it is useful:** Eliminates manual voucher writing. Can generate hundreds of vouchers in seconds with consistent formatting.

**Who uses it:** Finance staff generate vouchers; students receive and pay them.

### Payment Recording
**What it does:** Records when students make payments including the amount, date, method, and receipt number.

**Why it is useful:** Maintains accurate financial records and tracks which students have paid.

**Who uses it:** Finance staff enter and verify payments.

### Payment Verification
**What it does:** Two-step process where payments are first recorded as received, then marked as verified after confirmation.

**Why it is useful:** Reduces errors by requiring double-checking of payment information before it becomes official.

**Who uses it:** Finance staff perform verification after cross-checking with bank records or cash logs.

### Student Ledger
**What it does:** Shows complete transaction history for each student including all charges, payments, and adjustments.

**Why it is useful:** Provides transparent record of what a student owes and what they have paid over time.

**Who uses it:** Finance staff review ledgers; students can view their own ledger.

### Financial Reports
**What it does:** Generates various reports including defaulters (students with unpaid fees), collection summaries, and aging reports.

**Why it is useful:** Supports financial planning and helps identify collection issues. Required for administrative oversight.

**Who uses it:** Finance managers and institutional leadership review financial reports.

### Waivers & Scholarships
**What it does:** Records fee waivers or scholarship credits that reduce what a student owes.

**Why it is useful:** Properly documents financial aid so student accounts reflect actual amounts owed.

**Who uses it:** Finance staff record approved waivers and scholarships.

### Financial Policies
**What it does:** Enforces rules like blocking transcript issuance for students with unpaid fees.

**Why it is useful:** Ensures fee collection policies are applied consistently without staff having to manually check.

**Who uses it:** Finance staff configure policies; the system enforces them automatically.

---

## Document Requests

### Transcript Requests
**What it does:** Students submit requests for official transcripts; staff process and approve them.

**Why it is useful:** Creates auditable workflow for transcript issuance instead of informal email or verbal requests.

**Who uses it:** Students submit requests; registrar staff approve and generate transcripts.

### Certificate Requests
**What it does:** Handles requests for various certificates (bonafide, no objection, character certificates).

**Why it is useful:** Tracks status of requests so students know when to expect documents.

**Who uses it:** Students request; administrative staff process and issue certificates.

---

## Reports & Analytics

### Dashboard Summaries
**What it does:** Shows key statistics and metrics relevant to each user role (enrollment counts, collection totals, pending approvals).

**Why it is useful:** Gives quick overview of important numbers without running detailed reports.

**Who uses it:** All users see role-appropriate dashboards when they log in.

### Compliance Reports
**What it does:** Generates reports required by regulatory bodies (PMC, HEC) showing enrollment, results, attendance, etc.

**Why it is useful:** Simplifies regulatory compliance by automating required reporting.

**Who uses it:** Registrar or administrative staff generate reports for submission to regulators.

### Audit Logs
**What it does:** Records every change made in the system including who made it, when, and what was changed.

**Why it is useful:** Provides accountability and helps investigate discrepancies or errors.

**Who uses it:** Administrators review logs when investigating issues.

---

## System Administration

### Settings & Configuration
**What it does:** Allows administrators to configure system-wide settings like email notifications, password policies, and feature flags.

**Why it is useful:** Customizes system behavior to match institutional policies without requiring technical changes.

**Who uses it:** Administrators adjust settings; all users are affected by the configuration.

### Data Backup & Security
**What it does:** (Infrastructure feature) Automatically backs up data and implements security controls.

**Why it is useful:** Protects against data loss and unauthorized access.

**Who uses it:** IT administrators manage backups; security protects all users automatically.

---

## Summary of Feature Categories

1. **User Management** - Control who can access the system
2. **Student Records** - Maintain student information
3. **Academic Structure** - Organize programs and classes
4. **Scheduling** - Manage class timetables
5. **Attendance** - Track student presence
6. **Examinations** - Configure and manage assessments
7. **Results** - Calculate and publish grades
8. **Finance** - Manage fees and payments
9. **Documents** - Issue transcripts and certificates
10. **Reports** - Generate compliance and management reports
11. **Administration** - Configure and maintain the system
