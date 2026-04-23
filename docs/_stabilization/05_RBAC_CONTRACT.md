# RBAC Contract

## Global Rules

- Unauthenticated user accessing protected routes: redirect to `/login`.
- Authenticated unauthorized user accessing protected frontend route: render Access Denied.
- Backend authorization is authoritative; frontend guards are UX boundaries only.
- Admin-only backend actions require superuser or canonical Admin role without another domain role taking precedence.

## Role Precedence

1. Superuser: `Admin`
2. Registrar profile/group: `Registrar`
3. ExamCell group: `ExamCell`
4. Finance group: `Finance`
5. Faculty profile/group: `Faculty`
6. Student profile/group: `Student`
7. Admin group fallback: `Admin`

## Critical Matrix

| Route / Action | Anonymous | Student | Faculty | Registrar | ExamCell | Admin |
|---|---|---|---|---|---|---|
| `/dashboard` | Login redirect | Allow own dashboard | Allow faculty dashboard | Allow registrar dashboard | Allow examcell dashboard | Allow admin dashboard |
| `/system/users` | Login redirect | Access Denied / backend 403 | Access Denied / backend 403 | Access Denied / backend 403 | Access Denied / backend 403 | Allow |
| `/system/audit` | Login redirect | Access Denied | Access Denied | Access Denied | Access Denied | Allow |
| `/analytics` | Login redirect | Access Denied | Access Denied | Access Denied | Access Denied | Allow |
| `/students` | Login redirect | Access Denied except own-data APIs | Access Denied | Allow | Access Denied | Allow |
| `/attendance/input` | Login redirect | Access Denied | Allow | Access Denied | Access Denied | Allow |
| `/attendance/eligibility` | Login redirect | Access Denied | Access Denied | Allow | Access Denied | Allow |
| `/examcell/publish` | Login redirect | Access Denied | Access Denied | Access Denied | Allow | Allow |
| Result publish/freeze API | 401 | 403 | 403 | 403 | Allow with task/fallback | Allow |
| `/results` | Login redirect | Own published results | Allow readable results | Allow readable results | Allow | Allow |
| `/transcripts` | Login redirect | Allow own transcript page | Access Denied | Allow | Allow page | Allow |
| `/verify/:token` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/finance/me` / own ledger | Login redirect | Allow own rows | 403 unless task | 403 unless task | 403 unless task | Allow all rows |

## Tested High-Risk Paths

- Admin, Registrar, Faculty, Student, ExamCell Playwright role suites passed.
- RBAC negative suite passed.
- Backend tests cover student own results/ledger isolation, admin all-results/all-ledger access, and ExamCell publish/freeze.
