# API MAP — FMU Platform Backend

**Generated**: 2026-01-08  
**Base URL**: `/api/`  
**Authentication**: JWT Bearer Token (required for all endpoints unless noted)  
**API Version**: v1 (implicit)

## Authentication Endpoints

### Canonical Auth (Primary)
| Method | Endpoint | Description | Auth Required | Request | Response |
|--------|----------|-------------|---------------|---------|----------|
| POST | `/api/auth/login/` | Unified login (email + password) | No | `{email, password}` | `{access, refresh, user}` |
| POST | `/api/auth/logout/` | Logout and blacklist refresh token | Yes | `{refresh}` | `{message}` |
| POST | `/api/auth/refresh/` | Refresh access token | No | `{refresh}` | `{access, refresh?}` |
| GET | `/api/auth/me/` | Get current user info with role | Yes | - | `{id, email, first_name, last_name, role, groups}` |

### Legacy Auth (Deprecated)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/token/` | Legacy email-based token obtain | No |
| POST | `/api/auth/token/refresh/` | Legacy token refresh | No |

## Core/Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health/` | Health check with component status | No |
| GET | `/healthz/` | Health check alias | No |
| GET | `/api/health/` | Health check alias | No |
| GET | `/api/dashboard/stats/` | Dashboard statistics | Yes |
| GET | `/api/schema/` | OpenAPI schema (JSON) | No |
| GET | `/api/docs/` | Swagger UI | No |
| GET | `/api/redoc/` | ReDoc UI | No |

## People Module (Identity Management)

**Base Path**: `/api/people/`

| Resource | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| Person | `/api/people/persons/` | GET, POST, PUT, PATCH, DELETE | Central identity records |
| ContactInfo | `/api/people/contact-info/` | GET, POST, PUT, PATCH, DELETE | Phone, email, emergency contacts |
| Address | `/api/people/addresses/` | GET, POST, PUT, PATCH, DELETE | Mailing, permanent, temporary addresses |
| IdentityDocument | `/api/people/identity-documents/` | GET, POST, PUT, PATCH, DELETE | CNIC, passport, etc. |

### Person CRUD Operations
- **List**: `GET /api/people/persons/` - Returns paginated list
- **Create**: `POST /api/people/persons/` - Create new person
- **Retrieve**: `GET /api/people/persons/{id}/` - Get single person
- **Update**: `PUT /api/people/persons/{id}/` - Full update
- **Partial Update**: `PATCH /api/people/persons/{id}/` - Partial update
- **Delete**: `DELETE /api/people/persons/{id}/` - Delete person

## Students Module

**Base Path**: `/api/students/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| Student | `/api/students/` | GET, POST, PUT, PATCH, DELETE | Student records | `program`, `batch`, `group`, `status`, `reg_no` |
| LeavePeriod | `/api/leave-periods/` | GET, POST, PUT, PATCH, DELETE | Student leave tracking | `student`, `type`, `status` |

### Student Import
**Base Path**: `/api/students/imports/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students/imports/` | GET | List import jobs |
| `/api/students/imports/` | POST | Create import job |
| `/api/students/imports/{id}/` | GET | Get import job status |
| `/api/students/imports/{id}/validate/` | POST | Validate import data |
| `/api/students/imports/{id}/commit/` | POST | Commit import |

### Student Fields
```json
{
  "id": int,
  "reg_no": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "date_of_birth": "date",
  "status": "active|inactive|graduated|suspended|on_leave",
  "program": int,
  "batch": int,
  "group": int,
  "person": int?,
  "user": int?,
  "enrollment_year": int?,
  "expected_graduation_year": int?,
  "actual_graduation_year": int?,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Academics Module

**Base Path**: `/api/academics/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| Program | `/api/academics/programs/` | GET, POST, PUT, PATCH, DELETE | Academic programs (MBBS, BDS) | `is_active`, `structure_type` |
| Batch | `/api/academics/batches/` | GET, POST, PUT, PATCH, DELETE | Program batches | `program`, `start_year` |
| AcademicPeriod | `/api/academics/academic-periods/` | GET, POST, PUT, PATCH, DELETE | Hierarchical periods (Year/Block/Module) | `period_type`, `status` |
| Group | `/api/academics/groups/` | GET, POST, PUT, PATCH, DELETE | Student groups within batches | `batch` |
| Department | `/api/academics/departments/` | GET, POST, PUT, PATCH, DELETE | Departments with hierarchy | `parent` |
| Course | `/api/academics/courses/` | GET, POST, PUT, PATCH, DELETE | Courses/subjects | `department`, `academic_period` |
| Section | `/api/academics/sections/` | GET, POST, PUT, PATCH, DELETE | Course sections | `course`, `academic_period`, `faculty`, `group` |

### New Academic Structure Models
| Resource | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| Period | `/api/academics/periods/` | GET, POST, PUT, PATCH, DELETE | Periods within programs |
| Track | `/api/academics/tracks/` | GET, POST, PUT, PATCH, DELETE | Parallel tracks |
| LearningBlock | `/api/academics/blocks/` | GET, POST, PUT, PATCH, DELETE | Integrated/Rotation blocks |
| Module | `/api/academics/modules/` | GET, POST, PUT, PATCH, DELETE | Modules within blocks |

### Program Fields
```json
{
  "id": int,
  "name": "string",
  "description": "string",
  "is_active": bool,
  "structure_type": "YEARLY|SEMESTER|CUSTOM",
  "is_finalized": bool,
  "period_length_months": int?,
  "total_periods": int?,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Attendance Module

**Base Path**: `/api/attendance/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| Attendance | `/api/attendance/` | GET, POST, PUT, PATCH, DELETE | Attendance records | `student`, `session`, `date`, `status` |

### Attendance Input Methods
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendance-input/live/roster/` | GET | Get live roster for session |
| `/api/attendance-input/live/submit/` | POST | Submit live attendance |
| `/api/attendance-input/csv/dry-run/` | POST | Validate CSV upload |
| `/api/attendance-input/csv/commit/` | POST | Commit CSV attendance |
| `/api/attendance-input/sheet/template/` | GET | Download tick sheet template |
| `/api/attendance-input/sheet/dry-run/` | POST | Validate tick sheet |
| `/api/attendance-input/sheet/commit/` | POST | Commit tick sheet |
| `/api/attendance-input/biometric/punches/` | POST | Record biometric punch |

## Timetable Module

**Base Path**: `/api/timetable/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| Session | `/api/timetable/sessions/` | GET, POST, PUT, PATCH, DELETE | Timetable sessions | `section`, `date`, `start_time` |

## Exams Module

**Base Path**: `/api/exams/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| Exam | `/api/exams/` | GET, POST, PUT, PATCH, DELETE | Exam definitions | `section`, `date` |
| ExamComponent | `/api/exam-components/` | GET, POST, PUT, PATCH, DELETE | Exam components (parts) | `exam` |

## Results Module

**Base Path**: `/api/results/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| ResultHeader | `/api/results/` | GET, POST, PUT, PATCH, DELETE | Result headers | `student`, `exam`, `status` |
| ResultComponentEntry | `/api/result-components/` | GET, POST, PUT, PATCH, DELETE | Component scores | `result_header`, `component` |

### Result Status Workflow
```
DRAFT -> PUBLISHED -> FROZEN
```
- **DRAFT**: Editable by faculty
- **PUBLISHED**: Visible to students
- **FROZEN**: Immutable

## Finance Module

**Base Path**: `/api/finance/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| FeeType | `/api/finance/fee-types/` | GET, POST, PUT, PATCH, DELETE | Fee type definitions | `is_active` |
| FeePlan | `/api/finance/fee-plans/` | GET, POST, PUT, PATCH, DELETE | Fee plan structures | `program`, `batch` |
| Voucher | `/api/finance/vouchers/` | GET, POST, PUT, PATCH, DELETE | Fee vouchers | `student`, `status`, `due_date` |
| Payment | `/api/finance/payments/` | GET, POST, PUT, PATCH, DELETE | Payment records | `voucher`, `student`, `date` |
| LedgerEntry | `/api/finance/ledger/` | GET, POST, PUT, PATCH, DELETE | Financial ledger | `student`, `type` |
| Adjustment | `/api/finance/adjustments/` | GET, POST, PUT, PATCH, DELETE | Fee adjustments | `student`, `reason` |
| FinancePolicy | `/api/finance/policies/` | GET, POST, PUT, PATCH, DELETE | Financial policies | `is_active` |
| StudentFinanceSummary | `/api/finance/students/` | GET | Student financial summary | `student`, `batch` |
| FinanceReport | `/api/finance/reports/` | GET | Financial reports | `report_type`, `date_range` |

## Audit Module

**Base Path**: `/api/audit/`

| Resource | Endpoint | Methods | Description | Filters |
|----------|----------|---------|-------------|---------|
| AuditLog | `/api/audit/` | GET | Audit log entries (read-only) | `user`, `action`, `model`, `date` |

## Admissions Module (Public Access)

**Base Path**: `/api/admissions/`

| Resource | Endpoint | Methods | Auth Required | Description |
|----------|----------|---------|---------------|-------------|
| StudentApplication | `/api/admissions/applications/` | GET, POST, PUT, PATCH | Partially | Student applications |
| ApplicationDraft | `/api/admissions/drafts/` | GET, POST, PUT, PATCH | No | Draft applications (public) |

### Public Intake Form
- `/api/admissions/drafts/` - Public form for prospective students
- No authentication required for draft creation
- Email-based retrieval token for editing

## Permission Matrix

### Role-Based Access

| Resource | Admin | Registrar | Faculty | ExamCell | Finance | Student |
|----------|-------|-----------|---------|----------|---------|---------|
| Students | CRUD | CRUD | R | R | R (limited) | R (self) |
| Academics | CRUD | CRUD | R | R | R | R |
| Attendance | CRUD | R | CRUD | R | - | R (self) |
| Timetable | CRUD | CRUD | CRUD | R | - | R |
| Exams | CRUD | CRUD | CRUD | CRUD | - | R |
| Results | CRUD | CRUD | CRUD (section) | CRUD | - | R (self) |
| Finance | CRUD | CRUD | - | - | CRUD | R (self) |
| Audit | R | R | - | - | - | - |
| People | CRUD | CRUD | R | R | R | R (self) |

**Legend**: C=Create, R=Read, U=Update, D=Delete, -(no access)

## API Conventions

### Pagination
All list endpoints support pagination:
```
GET /api/students/?page=1&page_size=50
```

Response includes:
```json
{
  "count": 150,
  "next": "/api/students/?page=2",
  "previous": null,
  "results": [...]
}
```

### Filtering
Use query parameters:
```
GET /api/students/?status=active&program=1
```

### Ordering
```
GET /api/students/?ordering=-created_at
```

### Search
```
GET /api/students/?search=John
```

### Field Selection
```
GET /api/students/?fields=id,reg_no,name
```

### Error Responses

**400 Bad Request** - Validation errors
```json
{
  "field_name": ["Error message"]
}
```

**401 Unauthorized** - Missing/invalid token
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found** - Resource not found
```json
{
  "detail": "Not found."
}
```

**500 Internal Server Error** - Server error
```json
{
  "detail": "Internal server error."
}
```

## Rate Limiting

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Admin**: Unlimited

## Versioning

Current version: **v1** (implicit, no version prefix)

Future versions will use URL versioning:
- `/api/v2/...`

## Deprecation Policy

Deprecated endpoints will:
1. Return `X-API-Deprecated: true` header
2. Include deprecation notice in response
3. Be supported for minimum 6 months
4. Be documented in CHANGELOG

## Testing Endpoints

Use provided credentials or create test tokens:
```bash
curl -X POST http://localhost:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

## OpenAPI Schema

Full API schema available at:
- **JSON**: `/api/schema/`
- **Swagger UI**: `/api/docs/`
- **ReDoc**: `/api/redoc/`
