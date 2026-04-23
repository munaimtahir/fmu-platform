# RBAC Matrix: FMU Platform

This document defines the authoritative access rules for the FMU Platform.

## 1. Role Precedence (Authority)
The backend evaluates roles in the following order of precedence:
1. **Admin (Superuser)**
2. **Registrar**
3. **ExamCell**
4. **Finance**
5. **Faculty**
6. **Coordinator**
7. **Office Assistant**
8. **Student**

## 2. Global Behavior Rules
- **Backend Authoritative**: The Backend is the final authority for all permissions. Frontend guards are for UX convenience and navigation control only.
- **Anonymous Access**: Redirected to `/login` for all paths except Public QR Verification and the Public Intake form (limited UI).
- **Authenticated Unauthorized Access**: Frontend renders "Access Denied"; Backend returns `403 Forbidden`.
- **Default Deny**: Any action or route not explicitly permitted is denied by default.

## 3. Access Matrix (Outcomes)

| Feature / Action | Admin | Registrar | ExamCell | Finance | Faculty | Coordinator | Office Asst | Student |
|---|---|---|---|---|---|---|---|---|
| **User Management** | Allow | Deny | Deny | Deny | Deny | Deny | Deny | Deny |
| **System Audit Logs** | Allow | Deny | Deny | Deny | Deny | Deny | Deny | Deny |
| **Academic Setup** | Allow | Allow | Deny | Deny | Allow | Allow | Allow | Deny |
| **Student Registry** | Allow | Allow | Deny | Deny | Deny | Allow | Allow | Deny |
| **Attendance Mark** | Allow | Deny | Deny | Deny | Allow | Allow | Allow | Deny |
| **Attendance Eligibility**| Allow | Allow | Deny | Deny | Deny | Allow | Deny | Deny |
| **Result Entry (Draft)** | Allow | Deny | Allow | Deny | Allow | Deny | Deny | Deny |
| **Result Publish/Freeze**| Allow | Deny | Allow | Deny | Deny | Deny | Deny | Deny |
| **Result View (Own)** | Allow | Allow | Allow | Allow | Allow | Allow | Allow | Own Only |
| **Transcript Generate** | Allow | Allow | Allow | Allow | Deny | Deny | Deny | Own Only |
| **Transcript Verify** | Public | Public | Public | Public | Public | Public | Public | Public |
| **Fee Plan Setup** | Allow | Deny | Deny | Allow | Deny | Deny | Deny | Deny |
| **Voucher Generation** | Allow | Deny | Deny | Allow | Deny | Deny | Deny | Deny |
| **Ledger View (Own)** | Allow | Allow | Deny | Allow | Deny | Deny | Deny | Own Only |

## 4. Business & Data Constraints (Notes)
- **Finance Gate**: Even if a `Student` has `Allow` or `Own Only` for Results or Transcripts, the backend will return `403 FINANCE_BLOCKED` if they have outstanding dues.
- **Object Ownership**: Students are strictly limited to their own data via `user.student` filtering in the backend querysets.
- **Published Results Only**: Students can only view results that have reached the `PUBLISHED` or `FROZEN` status. Staff can view all statuses based on task permissions.
- **Transcript Access**: While `ExamCell` can view the transcripts page, they do not have unrestricted generation authority for all students unless specifically tasked.
- **Academic Setup (Faculty/Coord/Office)**: Limited to viewing or managing specific resources (Sections/Groups) assigned to them or within their department.
- **Task-Based Permissions**: Most staff actions are further gated by `PermissionTaskRequired`. Roles are mapped to these tasks during the baseline seeding.
