# Canonical Integration Map: FMU Platform

This document maps critical frontend flows to their backend implementations, providing the authoritative contract for the frozen baseline.

## 1. Authentication & Session

| Flow | FE Route / Page | FE Service & File | BE Method + Endpoint | Payload | Response | RBAC Rule | Status |
|---|---|---|---|---|---|---|---|
| **Login** | `/login` | `auth.ts:login` (`api/auth.ts`) | `POST /api/auth/login/` | `{identifier, password}` | `{user, tokens}` | Anonymous | WORKING |
| **Get Me** | N/A (Global) | `auth.ts:getMe` (`api/auth.ts`) | `GET /api/auth/me/` | None | `User` object | Authenticated | WORKING |
| **Refresh** | N/A (Axios) | `auth.ts:refresh` (`api/auth.ts`) | `POST /api/auth/refresh/` | `{refresh}` | `{access}` | Authenticated | WORKING |
| **Logout** | N/A (Global) | `auth.ts:logout` (`api/auth.ts`) | `POST /api/auth/logout/` | `{refresh}` (opt) | `200 OK` | Authenticated | WORKING |

## 2. Academic & Results

| Flow | FE Route / Page | FE Service & File | BE Method + Endpoint | Payload | Response | RBAC Rule | Status |
|---|---|---|---|---|---|---|---|
| **Stats** | `/dashboard` | `dashboard.ts:stats` (`api/dashboard.ts`) | `GET /api/dashboard/stats/` | None | `{total_...}` | Authenticated | WORKING |
| **Publish** | `/examcell/publish` | `results.ts:publish` (`services/results.ts`) | `POST /api/results/{id}/publish/` | None | `ResultHeader` | `results.publish` | WORKING |
| **Freeze** | `/results` | `results.ts:freeze` (`services/results.ts`) | `POST /api/results/{id}/freeze/` | None | `ResultHeader` | `results.freeze` | WORKING |
| **Staff Read**| `/results` | `results.ts:list` (`services/results.ts`) | `GET /api/results/` | Query params | `PaginatedList` | `results.view` | WORKING |
| **Own Read** | `/results` | `results.ts:me` (`services/results.ts`) | `GET /api/results/me/` | None | `ResultHeader[]`| `STUDENT` | WORKING |

## 3. Students & Attendance

| Flow | FE Route / Page | FE Service & File | BE Method + Endpoint | Payload | Response | RBAC Rule | Status |
|---|---|---|---|---|---|---|---|
| **Mark Atten**| `/attendance/input`| `attendance.ts:mark` (`services/attendance.ts`) | `POST /api/attendance/` | `{student, session, status}` | `Attendance` | `atten.mark` | WORKING |
| **Read Atten**| `/attendance` | `attendance.ts:list` (`services/attendance.ts`) | `GET /api/attendance/` | Query params | `PaginatedList` | `atten.view` | WORKING |
| **List Users**| `/system/users` | `users.ts:list` (`api/users.ts`) | `GET /api/admin/users/` | None | `PaginatedList` | `ADMIN` only | WORKING |

## 4. Transcripts & Finance

| Flow | FE Route / Page | FE Service & File | BE Method + Endpoint | Payload | Response | RBAC Rule | Status |
|---|---|---|---|---|---|---|---|
| **Get Trans** | `/transcripts` | `transcripts.ts:get` (`services/transcripts.ts`) | `GET /api/transcripts/{id}/` | None | `PDF Blob` | `trans.gen` | WORKING |
| **Verify QR** | `/verify/:token` | `transcripts.ts:verify` (`services/transcripts.ts`) | `GET /api/transcripts/verify/{token}/` | None | `{valid: bool}` | Public | WORKING |
| **Own Ledger**| `/finance/me` | `finance.ts:me` (`services/results.ts`) | `GET /api/finance/ledger/` | None | `LedgerEntry[]` | `STUDENT` | WORKING |

## 5. Miscellaneous & Legacy

| Flow | FE Route / Page | FE Service & File | BE Method + Endpoint | Payload | Response | RBAC Rule | Status |
|---|---|---|---|---|---|---|---|
| **Intake Form**| `/apply` | N/A (UI Only) | N/A | N/A | N/A | Public | LIMITED |
| **Gradebook** | `/gradebook` | N/A (UI Only) | N/A | N/A | N/A | Staff/Student | WORKING WITH LIMITS |

## 6. Implementation Notes
- **Payloads**: All `POST/PATCH` payloads are JSON unless otherwise specified.
- **Response Shape**: Most list endpoints return a standard DRF paginated structure: `{ count, next, previous, results: [] }`.
- **Finance Gate**: Result and Transcript endpoints return `403 FINANCE_BLOCKED` if dues are outstanding.
- **Verification Status**:
  - **WORKING**: Fully integrated and verified on baseline.
  - **WORKING WITH LIMITS**: Functional UI but minimal or informational-only backend integration.
  - **DEGRADED**: Integrated but known runtime issues or bugs.
  - **NOT IN ACTIVE SCOPE**: Explicitly excluded from the active API surface.
