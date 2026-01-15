# Screens & Pages Overview

This document describes the major screens (pages) in the system, their purpose, and what functions they provide. Since the system is not running in this review, we also include a screenshot plan for future documentation.

---

## Login Screen

**Purpose:** Secure entry point to the system where users enter their username and password.

**Main Actions Available:**
- Enter username and password
- Click login button
- Reset forgotten password (if configured)

**Which User Role Accesses It:** Everyone - all users must log in before accessing any other features.

**Screenshot Plan:**
- *What to show:* Clean login form with username and password fields, login button, and university logo/branding
- *Why important:* First impression administrators see; demonstrates security is in place from the start

---

## Dashboard (Role-Specific)

**Purpose:** Landing page after login showing a summary of important information and quick access to common tasks. The dashboard content adapts based on user role.

**Main Actions Available:**
- View summary statistics (number of students, attendance rates, pending tasks, etc.)
- Access quick links to frequently used functions
- See recent notifications or alerts
- Navigate to main work areas

**Which User Role Accesses It:** All authenticated users, but content varies by role:
- **Administrators:** System health, user activity, overall statistics
- **Registrar:** Enrollment numbers, pending approvals, result workflow status
- **Faculty:** Classes assigned, attendance pending, marks entry deadlines
- **Finance:** Collection totals, outstanding balances, payment verification queue
- **Students:** Personal attendance, grades, fee status, announcements

**Screenshot Plan:**
- *What to show (Admin):* Overall system statistics, user activity chart, pending approval counts
- *What to show (Registrar):* Enrollment summaries by program, result workflow status, transcript request queue
- *What to show (Faculty):* Today's class schedule, attendance marking links, pending marks entry
- *What to show (Finance):* Collection summary, defaulters count, recent payment activity
- *What to show (Student):* Personal attendance percentage, latest grades, fee dues, class schedule
- *Why important:* Demonstrates role-based access control and how each user sees relevant information

---

## User Management Screen

**Purpose:** Create, view, and manage user accounts and assign roles.

**Main Actions Available:**
- View list of all users
- Search for specific users
- Create new user accounts
- Edit existing user information
- Assign or change user roles
- Reset user passwords
- Activate or deactivate accounts

**Which User Role Accesses It:** Administrators only

**Screenshot Plan:**
- *What to show:* User list with search bar, add user button, columns showing username, name, role, status
- *Why important:* Shows how access control is managed; critical for security review

---

## Student Management Screen

**Purpose:** Central location for managing all student records.

**Main Actions Available:**
- View list of all students with filtering and search
- View detailed student profile
- Create new student record
- Edit student information
- Change student status (active, suspended, graduated)
- Assign student to program, batch, and group
- Import multiple students from spreadsheet

**Which User Role Accesses It:** 
- Administrators (full access)
- Registrar staff (full access)
- Faculty (view-only for their classes)
- Finance staff (view basic info for payment processing)

**Screenshot Plan:**
- *What to show:* Student list with filters for program/batch/status, search bar, student cards or table rows
- *What to show (detail page):* Student profile with personal info, academic placement, status, tabs for attendance/results/finance
- *Why important:* Core functionality; demonstrates data organization and ease of finding student information

---

## Student Intake Form (Public)

**Purpose:** Web form accessible without login where prospective students submit application information.

**Main Actions Available:**
- Fill personal information fields
- Upload required documents (photo, ID copies, certificates)
- Submit application
- View submission confirmation

**Which User Role Accesses It:** Public (no login required); Registrar staff review submissions

**Screenshot Plan:**
- *What to show:* Clean form with sections for personal info, guardian info, merit details, document uploads
- *What to show:* Success confirmation page with submission ID
- *Why important:* Shows system reduces manual data entry and provides self-service for applicants

---

## Student Intake Queue (Admin)

**Purpose:** Staff review area for intake form submissions before creating official student records.

**Main Actions Available:**
- View list of all submissions
- Filter by status (pending, needs review, approved, rejected)
- Search by name, CNIC, mobile, email, or application ID
- View submission details and uploaded documents
- Check for duplicate records
- Approve submission and create student record
- Reject submission with reason
- Add staff notes

**Which User Role Accesses It:** Administrators, Coordinators, Office Assistants

**Screenshot Plan:**
- *What to show:* Queue list with submission status, search/filter controls, action buttons
- *What to show:* Detail view showing submitted data, duplicate check results, approve/reject buttons
- *Why important:* Demonstrates data verification workflow before records become official

---

## Programs & Academic Structure Screen

**Purpose:** Define and manage programs, batches, groups, and academic periods.

**Main Actions Available:**
- View list of programs
- Create or edit programs
- Manage batches (year groups)
- Manage groups (class sections)
- Define academic periods/terms

**Which User Role Accesses It:** Administrators and Coordinators

**Screenshot Plan:**
- *What to show:* Program list with associated batches and current enrollment counts
- *Why important:* Shows how academic structure is organized in the system

---

## Timetable/Schedule Screen

**Purpose:** Create and view class schedules.

**Main Actions Available:**
- View weekly or daily schedule
- Add new class session
- Edit session details (time, room, faculty)
- Delete or cancel sessions
- View schedules by program, faculty, or room

**Which User Role Accesses It:**
- Office Assistants (create/edit)
- Coordinators (create/edit)
- Faculty (view their own schedule)
- Students (view their class schedule)

**Screenshot Plan:**
- *What to show:* Calendar or grid view of weekly schedule with color-coded classes
- *Why important:* Visual representation helps administrators understand usability for daily operations

---

## Attendance Marking Screen

**Purpose:** Record student attendance for class sessions.

**Main Actions Available:**
- Select class session
- View student list for that session
- Mark each student as present, absent, late, or excused
- Add notes about attendance
- Submit attendance record
- Edit attendance for recent sessions

**Which User Role Accesses It:**
- Faculty (for their classes)
- Office Assistants (for any class)

**Screenshot Plan:**
- *What to show:* Student list with checkboxes or status buttons, submit button, session details at top
- *Why important:* Core daily task; demonstrates ease of use for routine operations

---

## Attendance Reports Screen

**Purpose:** View attendance statistics and identify students with attendance issues.

**Main Actions Available:**
- View attendance summary by student
- View attendance summary by class/section
- Filter by program, batch, or date range
- Generate attendance reports
- Identify students below attendance threshold
- Download or print reports

**Which User Role Accesses It:**
- Administrators (all programs)
- Coordinators (all programs)
- Faculty (their classes)

**Screenshot Plan:**
- *What to show:* Table showing students, attendance percentage, status indicators for low attendance
- *Why important:* Shows reporting capability for regulatory compliance

---

## Exam Configuration Screen

**Purpose:** Set up exam schedules and assessment components.

**Main Actions Available:**
- Create exam record
- Define exam components (midterm, final, quizzes, assignments)
- Set weights for each component
- Define passing criteria
- Set exam dates

**Which User Role Accesses It:** Exam Cell staff

**Screenshot Plan:**
- *What to show:* Exam details form with component list, weight percentages that sum to 100%
- *Why important:* Shows assessment structure configuration

---

## Marks Entry Screen

**Purpose:** Enter student scores for assessments.

**Main Actions Available:**
- Select course and exam component
- View student list
- Enter score for each student
- Save marks (in draft status)
- Submit for verification when complete

**Which User Role Accesses It:**
- Faculty (for their courses)
- Office Assistants (data entry support)

**Screenshot Plan:**
- *What to show:* Spreadsheet-like grid with student names and score entry fields
- *Why important:* Demonstrates data entry interface for routine academic operations

---

## Result Verification & Publishing Screen

**Purpose:** Review, verify, and publish student results.

**Main Actions Available:**
- View results pending verification
- Review calculated grades
- Verify results (move from draft to verified)
- Publish results (make visible to students)
- Freeze results (lock permanently)
- Generate result transcripts

**Which User Role Accesses It:**
- Coordinators (verify)
- Exam Cell staff (publish/freeze)

**Screenshot Plan:**
- *What to show:* Result list with status indicators, verification queue, action buttons
- *Why important:* Demonstrates workflow controls and approval process

---

## Student Results View Screen

**Purpose:** Students view their own published grades.

**Main Actions Available:**
- View grades for completed courses
- View semester results
- View cumulative performance
- Download or print result transcript

**Which User Role Accesses It:** Students (own results only)

**Screenshot Plan:**
- *What to show:* Clean display of course names, grades, grade points, semester GPA
- *Why important:* Shows student-facing interface and self-service access

---

## Finance Dashboard

**Purpose:** Overview of financial status and operations.

**Main Actions Available:**
- View collection summary
- View outstanding balances total
- View recent payments
- Access quick links to voucher generation and payment recording
- View defaulters list

**Which User Role Accesses It:** Finance Officers

**Screenshot Plan:**
- *What to show:* Summary cards with totals, charts showing collection trends, quick action buttons
- *Why important:* Demonstrates financial management capability

---

## Fee Configuration Screen

**Purpose:** Set up fee types and fee plans for programs.

**Main Actions Available:**
- Create or edit fee types (tuition, exam fee, etc.)
- Create fee plans for specific program and term combinations
- Set fee amounts
- Activate or deactivate fee plans

**Which User Role Accesses It:** Finance Officers, Administrators

**Screenshot Plan:**
- *What to show:* Fee plan list showing program, term, fee type, amount, active status
- *Why important:* Shows fee structure configuration

---

## Voucher Generation Screen

**Purpose:** Create fee vouchers for students.

**Main Actions Available:**
- Select program and term
- Select all students or specific students
- Preview voucher details
- Generate vouchers
- View generated voucher list
- Download or print vouchers

**Which User Role Accesses It:** Finance Officers

**Screenshot Plan:**
- *What to show:* Selection filters, student list preview, generate button, progress indicator
- *Why important:* Demonstrates bulk operations capability

---

## Payment Recording Screen

**Purpose:** Record student fee payments.

**Main Actions Available:**
- Search for student or voucher
- Enter payment details (amount, date, method, receipt number)
- Record payment as received
- Verify payment (second step)
- Print receipt

**Which User Role Accesses It:** Finance Officers

**Screenshot Plan:**
- *What to show:* Payment entry form with student info, voucher selection, amount fields, verification checkbox
- *Why important:* Core finance operation; shows data validation

---

## Student Financial Statement

**Purpose:** View complete financial transaction history for a student.

**Main Actions Available:**
- View all charges (vouchers)
- View all payments
- View waivers/scholarships
- View current balance
- Download or print statement

**Which User Role Accesses It:**
- Finance Officers (all students)
- Students (own statement only)

**Screenshot Plan:**
- *What to show:* Transaction ledger with dates, descriptions, debit/credit amounts, running balance
- *Why important:* Shows financial transparency and record keeping

---

## Defaulters Report Screen

**Purpose:** Identify students with unpaid fees.

**Main Actions Available:**
- Set filters (program, term, minimum outstanding amount)
- Generate defaulters list
- View student details and balance
- Download or print report
- Send reminder notifications (if configured)

**Which User Role Accesses It:** Finance Officers, Administrators

**Screenshot Plan:**
- *What to show:* Student list with outstanding amounts, sort/filter controls, export button
- *Why important:* Demonstrates reporting for financial management

---

## Transcript Request Screen

**Purpose:** Manage student requests for official transcripts.

**Main Actions Available:**
- View list of pending requests
- View request details
- Check student eligibility (no dues, attendance met, etc.)
- Approve or reject request
- Generate transcript document
- Mark request as completed

**Which User Role Accesses It:**
- Students (submit requests)
- Registrar staff (process requests)

**Screenshot Plan:**
- *What to show:* Request queue with status indicators, student info, approval buttons
- *Why important:* Shows document workflow and policy enforcement

---

## Audit Log Screen

**Purpose:** Review all changes made in the system for accountability and troubleshooting.

**Main Actions Available:**
- View chronological log of all changes
- Filter by date, user, or action type
- Search for specific records
- View details of each change including before/after values
- Export audit logs

**Which User Role Accesses It:** Administrators only

**Screenshot Plan:**
- *What to show:* Log entries with timestamp, user, action description, affected record
- *Why important:* Demonstrates accountability and data governance

---

## System Settings Screen

**Purpose:** Configure system-wide settings and policies.

**Main Actions Available:**
- Configure email notification settings
- Set password policies
- Configure attendance thresholds
- Set financial policy rules
- Manage system announcements
- View system health status

**Which User Role Accesses It:** Administrators only

**Screenshot Plan:**
- *What to show:* Settings organized in categories with toggle switches and input fields
- *Why important:* Shows system customization capabilities

---

## Profile & Account Settings

**Purpose:** Users manage their own account information.

**Main Actions Available:**
- View personal information
- Change password
- Update contact information
- View assigned role and permissions

**Which User Role Accesses It:** All authenticated users

**Screenshot Plan:**
- *What to show:* User profile form with editable fields, change password section
- *Why important:* Shows self-service account management

---

## Summary Table of Screens

| Screen | Primary Users | Key Purpose |
|--------|---------------|-------------|
| Login | Everyone | Secure authentication |
| Dashboard | All (role-specific) | Quick overview and navigation |
| User Management | Administrators | Account control |
| Student Management | Registrar | Central student records |
| Student Intake Form | Public + Registrar | Application submission |
| Academic Structure | Administrators | Program organization |
| Timetable | Office Staff + Faculty + Students | Schedule management |
| Attendance Marking | Faculty + Office Staff | Daily attendance |
| Attendance Reports | Coordinators + Faculty | Monitoring & compliance |
| Exam Configuration | Exam Cell | Assessment setup |
| Marks Entry | Faculty | Grade recording |
| Result Verification | Coordinators + Exam Cell | Grade approval workflow |
| Student Results | Students | Grade viewing |
| Finance Dashboard | Finance Officers | Financial overview |
| Fee Configuration | Finance Officers | Fee structure setup |
| Voucher Generation | Finance Officers | Bulk voucher creation |
| Payment Recording | Finance Officers | Payment processing |
| Financial Statement | Finance + Students | Transaction history |
| Defaulters Report | Finance Officers | Collection management |
| Transcript Requests | Students + Registrar | Document workflow |
| Audit Logs | Administrators | Change tracking |
| System Settings | Administrators | Configuration |
| Profile Settings | All users | Account management |

---

## Screenshot Documentation Plan

### Priority 1 (Essential for Administrator Review)
1. Dashboard (multiple roles) - Shows role-based access
2. Student Management - Core functionality
3. Attendance Marking - Daily operations
4. Result Verification Workflow - Approval process
5. Fee Voucher Generation - Financial operations
6. Audit Logs - Accountability

### Priority 2 (Important for Understanding Capabilities)
7. Student Intake Form - Self-service feature
8. Timetable View - Schedule visualization
9. Marks Entry - Academic operations
10. Payment Recording - Finance workflow
11. Defaulters Report - Management reporting
12. User Management - Security controls

### Priority 3 (Supporting Documentation)
13. Academic Structure Configuration
14. Exam Configuration
15. Financial Statement
16. Transcript Request Queue
17. Attendance Reports
18. System Settings

### Screenshot Guidelines
- Capture screens with realistic sample data (anonymized if necessary)
- Show key buttons and actions clearly
- Include navigation elements to show context
- Annotate screenshots to highlight important features
- Show both empty states and populated states where relevant

### Why Screenshots Are Important for Administrators
- Provides visual confirmation of functionality
- Helps assess user interface quality and usability
- Allows evaluation of workflow efficiency
- Supports training material development
- Enables comparison with current manual processes
- Helps identify potential user adoption challenges
