# User Types & Roles

The system has eight distinct user roles. Each role determines what information a person can see and what actions they can perform.

## Role Overview

### 1. Administrator (Admin)

**Who They Are**: IT staff, system administrators, and senior administrative personnel responsible for overall system management.

**What They Can See**:
- Complete view of all system data
- All student records
- All academic information
- All financial records
- System statistics and analytics
- Audit logs showing all system activity

**What Actions They Can Perform**:
- Create, edit, and delete any record in the system
- Manage user accounts and assign roles
- Configure system settings
- Import student data in bulk
- Access all administrative functions
- View and manage audit logs

**Decisions They Can Make**:
- Approve or reject student applications
- Assign students to programs, batches, and groups
- Modify academic structures
- Adjust financial records
- Change user permissions

---

### 2. Registrar

**Who They Are**: Office of the Registrar staff responsible for student enrollment, academic records, and official documentation.

**What They Can See**:
- All student records and applications
- Enrollment information
- Attendance records
- Academic periods and program structures
- Results and transcripts
- Course and section information

**What Actions They Can Perform**:
- Enroll students in programs and courses
- Manage student placement in batches and groups
- View and approve results before publication
- Generate and issue official transcripts
- Process student requests (transcripts, bonafide certificates, NOC documents)
- View attendance eligibility reports

**Decisions They Can Make**:
- Approve student enrollment
- Approve results for publication
- Issue official documents
- Approve or reject student requests

---

### 3. Faculty

**Who They Are**: Teaching staff including professors, lecturers, and instructors.

**What They Can See**:
- Student lists for their assigned courses and sections
- Course schedules and timetables
- Their own class attendance records
- Assessment and exam information for their courses
- Gradebook for their assigned sections
- Course and section details

**What Actions They Can Perform**:
- Mark student attendance
- Create and manage assessments and exams
- Enter student grades and marks
- View and edit gradebooks for their sections
- Submit results for review
- View course materials and schedules

**Decisions They Can Make**:
- Determine student attendance for their classes
- Assess student performance and enter grades
- Propose results for their courses

---

### 4. Student

**Who They Are**: Currently enrolled students at the university.

**What They Can See**:
- Their own personal information
- Their enrollment and placement details
- Their own attendance records
- Their own results and grades
- Their financial statements and fee information
- Course schedules and timetables

**What Actions They Can Perform**:
- View their academic records
- Check their attendance percentage
- Access their results after publication
- View their fee statements
- Submit requests for transcripts or other documents
- Apply for admissions (if applicable)

**Decisions They Can Make**:
- Submit document requests
- Apply for admission
- View (but not modify) their own records

---

### 5. Exam Cell

**Who They Are**: Staff responsible for exam administration, scheduling, and result publication.

**What They Can See**:
- All exam records and schedules
- Assessment information
- Student results (both draft and published)
- Exam components and structures

**What Actions They Can Perform**:
- Create and manage exams
- Publish results after verification
- Freeze results to prevent further changes
- View all exam-related data
- Manage exam components

**Decisions They Can Make**:
- Schedule and organize exams
- Publish or freeze results
- Determine exam structures and components

---

### 6. Finance

**Who They Are**: Finance department staff responsible for fee collection and financial management.

**What They Can See**:
- Student financial records
- Fee plans and charge templates
- Payment records and vouchers
- Financial reports (defaulters, collection, aging reports)

**What Actions They Can Perform**:
- Create fee plans and charge templates
- Generate payment vouchers (challans)
- Record payments and adjustments
- View and manage student ledgers
- Generate financial reports
- Process payment reversals

**Decisions They Can Make**:
- Approve financial adjustments
- Generate payment vouchers
- Process refunds or reversals

---

### 7. Coordinator

**Who They Are**: Program coordinators and academic coordinators who manage specific programs or departments.

**What They Can See**:
- Student records for their assigned programs
- Academic structures (programs, batches, periods)
- Course and section information
- Timetable information
- Attendance and results data

**What Actions They Can Perform**:
- Manage academic structures for their programs
- View student placement
- Manage timetables
- View attendance and results
- Similar permissions to Admin but typically limited to their program area

**Decisions They Can Make**:
- Modify academic structures within their authority
- Coordinate program activities

---

### 8. Office Assistant

**Who They Are**: Administrative support staff who help with data entry and routine tasks.

**What They Can See**:
- Limited view of student and academic data
- Timetable information
- Attendance records
- Exam and results data (in draft form)

**What Actions They Can Perform**:
- Enter attendance records
- Create and edit timetable sessions
- Enter basic exam information
- Enter marks in results (when in draft status)
- Cannot finalize or publish any data

**Decisions They Can Make**:
- Enter data for review by supervisors
- Cannot make final decisions or publish information

**Important Limitation**: Office Assistants can enter data, but cannot approve, verify, or publish it. All their work must be reviewed and approved by an Administrator or Coordinator before it becomes official.

---

## Summary Table

| Role | Primary Focus | Can Create Records | Can Approve/Publish | Can View All Data |
|------|--------------|-------------------|---------------------|-------------------|
| **Admin** | System management | Yes | Yes | Yes |
| **Registrar** | Enrollment & records | Yes | Yes | Limited |
| **Faculty** | Teaching & assessment | Yes | No | Limited |
| **Student** | View own records | Limited | No | No |
| **Exam Cell** | Exam administration | Yes | Yes | Limited |
| **Finance** | Financial operations | Yes | Yes | Limited |
| **Coordinator** | Program management | Yes | Yes | Limited |
| **Office Assistant** | Data entry support | Yes | No | Limited |

---

## Access Control in Practice

The system automatically shows users only the information they are authorized to see. When a faculty member logs in, they see their classes. When a student logs in, they see only their own records. This happens automatically based on the user's role.

Administrators can change user roles if someone's responsibilities change. This ensures that people have the right level of access for their current job.
