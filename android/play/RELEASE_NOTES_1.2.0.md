# MedSIMS 1.2.0 — Staff operations and governance

This release adds native Android operations for Faculty, Registrar, Coordinator, ExamCell, Finance and Admin.
Faculty can enter and update draft result headers and component marks only for group/period pairs
they teach, while ExamCell retains result publication authority. Faculty can also create link or file
learning materials, target their own teaching sections, edit drafts, publish, archive, and manage
audiences.

Staff can search and page through authoritative records, use typed editors, run guarded lifecycle
actions, preview and commit student CSV imports, check attendance eligibility, manage exams/results,
download internal transcripts and finance documents, run finance reports, administer users and RBAC,
inspect/export audit events, manage settings/syllabus, and use visibly guarded impersonation.

All writes remain online-only. Sensitive publication, freeze, reversal, approval, bulk-generation,
deactivation, password-reset and impersonation operations require explicit user confirmation and are
revalidated by backend RBAC. Public intake and public transcript verification remain intentionally
outside Android scope.
