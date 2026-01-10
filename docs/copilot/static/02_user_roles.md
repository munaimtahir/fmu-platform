# User Types & Roles

This document describes who can use the system and what they can do. Each role has specific permissions designed for their job responsibilities.

## Administrator

**Who they are:** IT staff and system managers responsible for overall system configuration and management.

**What they can see:**
- All system settings and configurations
- Complete access to all student and academic records
- User accounts and role assignments
- System audit logs showing all changes made
- All reports and analytics

**What actions they can perform:**
- Create and manage user accounts
- Assign roles to staff members
- Configure programs, departments, and academic structures
- Set up system policies and rules
- Access and modify any record in the system
- Generate system-wide reports
- Troubleshoot issues and manage system health

**What decisions they can make:**
- Who gets access to the system
- What system policies are enforced
- Which features are enabled or disabled
- System security and backup settings

---

## Registrar / Coordinator

**Who they are:** Registrar office staff who oversee student records, enrollment, and academic operations.

**What they can see:**
- All student records and enrollment information
- Academic programs, batches, and groups
- Attendance records across all programs
- Exam schedules and components
- Result verification queue
- Student transcript and certificate requests
- Finance summaries (read-only)

**What actions they can perform:**
- Create and update student records
- Manage student enrollment in programs
- Assign students to batches and groups
- Approve result transitions from draft to verified to published
- Approve transcript and certificate requests
- View and download reports for regulatory compliance
- Import student data from spreadsheets

**What decisions they can make:**
- Which students are enrolled in which programs
- When results should be published
- Approval of transcript requests
- Student status changes (active, graduated, suspended)

---

## Faculty

**Who they are:** Teaching staff who conduct classes and assess students.

**What they can see:**
- Their assigned class schedules and sections
- Student lists for their courses
- Attendance records for their classes only
- Exam components they are responsible for
- Results for courses they teach (draft and published)

**What actions they can perform:**
- Mark attendance for their classes
- View class timetables
- Enter marks for assessments they conduct
- Propose results for verification
- View student profiles in their classes

**What decisions they can make:**
- Daily attendance (present, absent, late, excused)
- Assessment scores for students
- Whether marks are ready for verification

---

## Finance Officer

**Who they are:** Finance department staff who manage fee collection and student accounts.

**What they can see:**
- All fee types and fee plans for programs
- Student financial accounts and balances
- Vouchers generated for fee collection
- Payment records and receipts
- Student ledgers showing all transactions
- Financial reports (defaulters, collections, aging)

**What actions they can perform:**
- Create and manage fee types and fee plans
- Generate fee vouchers for students
- Record and verify payments
- Cancel or reverse incorrect transactions
- Grant waivers or scholarships
- Generate and print fee vouchers and receipts
- Create financial reports

**What decisions they can make:**
- Fee amounts for different programs and terms
- Payment verification and acceptance
- Waiver and scholarship approvals
- Financial policies (like blocking services for unpaid fees)

---

## Exam Cell Staff

**Who they are:** Examination office personnel who manage exam administration and result processing.

**What they can see:**
- All exam schedules and configurations
- Exam components and grading rules
- Result compilation across all programs
- Result verification workflow status
- Published results for all students

**What actions they can perform:**
- Create and configure exam schedules
- Define exam components and passing criteria
- Publish finalized results
- Generate result transcripts
- Freeze results to prevent further changes
- Create exam-related reports

**What decisions they can make:**
- Exam passing rules and grade boundaries
- When to publish results to students
- When to freeze results as final

---

## Office Assistant

**Who they are:** Support staff who handle data entry and routine administrative tasks.

**What they can see:**
- Student records (limited editing)
- Class timetables
- Attendance marking screens
- Exam records (basic information only)
- Draft results only

**What actions they can perform:**
- Mark daily attendance for classes
- Enter or update exam information (dates, venues)
- Enter student marks in draft results
- Update class timetables

**What decisions they can make:**
- Daily attendance marking
- Data entry for routine information

**What they CANNOT do:**
- Change academic policies or rules
- Approve or publish results
- Access finance information
- Modify student program placement
- Change workflow states (draft to verified to published)

---

## Student

**Who they are:** Enrolled students accessing their own academic information.

**What they can see:**
- Their own personal and enrollment information
- Their class schedule
- Their attendance records and percentages
- Their exam results (once published)
- Their fee vouchers and payment history
- Their transcript and certificate request status

**What actions they can perform:**
- View their academic records
- Check attendance percentage
- View published results
- Request transcripts or certificates
- Download fee vouchers
- View payment history

**What decisions they can make:**
- When to request transcripts or certificates
- View their own academic progress

**What they CANNOT do:**
- Modify their own records
- See other students' information
- Access administrative functions
- Change grades or attendance

---

## Role Comparison Summary

| Feature | Admin | Registrar | Faculty | Finance | Exam Cell | Office Assistant | Student |
|---------|-------|-----------|---------|---------|-----------|------------------|---------|
| Manage Users | Yes | No | No | No | No | No | No |
| Student Records | Full | Full | View own classes | View finance only | View all | Limited edit | View own only |
| Attendance | View all | View all | Mark own classes | No | View all | Mark attendance | View own |
| Results | Full access | Verify/Publish | Enter marks | No | Publish/Freeze | Enter draft marks | View published |
| Finance | View all | View only | No | Full access | No | No | View own |
| Reports | All reports | Academic reports | Class reports | Finance reports | Exam reports | No | Own records |
