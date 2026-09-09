# MedSIMS RBAC and result-correction matrix

This matrix is the executable-policy companion to task assignments in `core`.
The task database is authoritative in deployed environments. The conservative
built-in fallback in `core.permissions` is retained only for seeded/local
environments and must not be broadened without tests.

| Domain/action | Admin | Registrar | Faculty | Exam Cell | Student |
|---|---|---|---|---|---|
| Students and academic placement | Task-assigned | Task-assigned | Scoped read only | No default | Own data only |
| Attendance marking | Task-assigned | Task-assigned | Assigned-section scope | No default | Own summary only |
| Result draft create/edit/delete | Task-assigned | No default | No default | Task-assigned | Denied |
| Verify/publish/freeze results | Task-assigned | No default | No default | Task-assigned | Denied |
| Published/frozen direct mutation | Denied | Denied | Denied | Denied | Denied |
| Result correction request | Task-assigned | Task-assigned | Denied | Task-assigned | Own result only |
| Review/apply correction | Task-assigned | No default | Denied | Task-assigned | Denied |
| Transcript/result reads | Task-assigned | Task-assigned | Task-assigned | Task-assigned | Own published records only |
| Audit log read/export | Task-assigned | Task-assigned | Denied by default | Task-assigned | Denied |

Result corrections are restricted to published or frozen result totals and
existing component marks. A request captures the original values, requires an
Exam Cell (or explicitly task-assigned) review, and is applied through a
separate auditable action. It never reopens a frozen result or permits a
generic write endpoint to change it.

## Required regression evidence

- A student cannot read another student's results or request that student's
  correction.
- A faculty member cannot receive unrestricted result administration merely by
  group membership.
- Direct PATCH, POST component, and DELETE routes reject published/frozen
  results.
- Only an explicitly assigned correction reviewer can approve and apply a
  correction.
