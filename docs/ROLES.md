# Roles & Permissions

    | Role | Admissions | Enrollment | Attendance | Assessments | Results | Transcripts | Requests |
    |------|------------|------------|------------|-------------|--------|------------|----------|
    | **Admin** | CRUD | CRUD | CRUD | CRUD | CRUD | Issue/Verify | CRUD |
    | **Registrar** | R | CRUD | R | R | Approve/Publish | Issue | Approve |
    | **Faculty** | R | R | CRUD (own sections) | CRUD (own) | Propose | R | R |
    | **Student** | Apply/View | View | View | View | View | Request | Create |
    | **Exam Cell** | R | R | R | R | Publish/Freeze | Issue | R |

    - “CRUD” = create/read/update/delete within authorization scope.
    - Changes to **Results** post-publish require approval + audit trail.
