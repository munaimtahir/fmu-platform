# FMU SIMS - System Architecture

## Overview

FMU SIMS is a full-stack Student Information Management System built with modern web technologies, designed for scalability, security, and maintainability.

## Technology Stack

### Backend
- **Framework:** Django 5.1.4 + Django REST Framework 3.15.2
- **Language:** Python 3.12
- **Database:** PostgreSQL 14 (production), SQLite (testing)
- **Cache/Jobs:** Redis 7 (background jobs, caching)
- **Authentication:** JWT (djangorestframework-simplejwt)
- **API Documentation:** drf-spectacular (OpenAPI 3.0)
- **PDF Generation:** ReportLab + QRCode
- **Background Jobs:** django-rq (Python RQ)

### Frontend
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 7
- **Routing:** react-router-dom 7
- **State Management:** Zustand + TanStack Query
- **Forms:** react-hook-form + Zod validation
- **HTTP Client:** Axios with interceptors
- **Styling:** TailwindCSS 3.4
- **Testing:** Vitest + React Testing Library

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **SSL/TLS:** Let's Encrypt (certbot)
- **CI/CD:** GitHub Actions
- **Security Scanning:** CodeQL

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Production Stack                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────────────────────────┐
│   Internet   │────────▶│  Nginx (Port 80/443)             │
└──────────────┘         │  - SSL/TLS Termination            │
                         │  - Reverse Proxy                  │
                         │  - Static File Serving            │
                         │  - Rate Limiting                  │
                         └──────────────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
                ▼                                       ▼
    ┌────────────────────┐                 ┌────────────────────┐
    │   Frontend (5173)  │                 │  Backend (8000)    │
    │                    │                 │                    │
    │  React + Vite      │◀───────────────▶│  Django + DRF      │
    │  TypeScript        │    REST API     │  Python 3.12       │
    │  TailwindCSS       │                 │  JWT Auth          │
    │  State: Zustand    │                 │  OpenAPI Docs      │
    └────────────────────┘                 └────────────────────┘
                                                    │
                                    ┌───────────────┼───────────────┐
                                    │               │               │
                                    ▼               ▼               ▼
                         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                         │ PostgreSQL   │ │   Redis      │ │  RQ Worker   │
                         │   (5432)     │ │   (6379)     │ │              │
                         │              │ │              │ │  Background  │
                         │  - Students  │ │  - Jobs      │ │  Jobs        │
                         │  - Courses   │ │  - Cache     │ │  - PDFs      │
                         │  - Attendance│ │  - Sessions  │ │  - Emails    │
                         │  - Results   │ │              │ │              │
                         └──────────────┘ └──────────────┘ └──────────────┘
```

## Service Architecture

### Docker Services

1. **postgres** - PostgreSQL 14 database
   - Persistent volume: `postgres_data`
   - Health checks enabled
   - Automatic backups configured

2. **redis** - Redis 7 cache and job queue
   - Used for django-rq background jobs
   - Health checks enabled

3. **backend** - Django REST API
   - Gunicorn WSGI server (3 workers)
   - Automatic migrations on startup
   - Static file collection
   - Health endpoint: `/healthz/`

4. **frontend** - React application
   - Development: Vite dev server
   - Production: Static files served by Nginx

5. **rqworker** - Background job processor
   - Processes async tasks (transcripts, emails)
   - Auto-restart on failure
   - Connected to Redis queue

6. **nginx** - Reverse proxy
   - SSL/TLS termination
   - Static file serving
   - Rate limiting
   - Security headers

## Data Flow

### Authentication Flow
```
1. User → Frontend: Login form
2. Frontend → Backend: POST /api/auth/token/ (username, password)
3. Backend → Database: Validate credentials
4. Backend → Frontend: JWT tokens (access + refresh)
5. Frontend: Store tokens in localStorage
6. Frontend: Attach access token to all API requests
7. Backend: Validate JWT on each request
8. If access token expired → Auto-refresh using refresh token
```

### API Request Flow
```
1. Frontend: User action triggers API call
2. Axios Interceptor: Attach JWT token to request headers
3. Nginx: Route to backend /api/* endpoints
4. Django Middleware: Authentication, CORS, Audit logging
5. DRF ViewSet: Permission check, business logic
6. Database: CRUD operations
7. Response: JSON with consistent error format
8. Frontend: Update UI state (Zustand/React Query)
```

### Background Job Flow (Transcript Generation)
```
1. Frontend: Request transcript
2. Backend: Enqueue job to Redis queue
3. Backend: Return job ID immediately (202 Accepted)
4. RQ Worker: Pick up job from queue
5. RQ Worker: Generate PDF with ReportLab
6. RQ Worker: Store PDF in media folder
7. RQ Worker: Send email with link (optional)
8. Frontend: Poll for job status or receive notification
```

## Module Architecture

### Backend Modules (Django Apps)

```
backend/sims_backend/
├── core/                  # Shared utilities, base models
├── academics/             # Programs, Courses, Terms, Sections
├── admissions/            # Students, Applications
├── enrollment/            # Student-Section enrollment
├── attendance/            # Attendance tracking, eligibility
├── assessments/           # Assessment types, scores
├── results/               # Grade publishing workflow
├── transcripts/           # PDF generation, QR verification
├── requests/              # Administrative requests (bonafide, NOC)
└── audit/                 # Write operation logging
```

### Frontend Structure

```
frontend/src/
├── api/                   # API client (axios)
├── components/            # Reusable UI components
│   ├── ui/               # Base components (Button, Input, etc.)
│   └── layout/           # Layout components (Header, Sidebar)
├── features/             # Feature-specific components
│   ├── auth/             # Login, ProtectedRoute
│   ├── students/         # Student CRUD
│   └── ...
├── pages/                # Page components
│   ├── attendance/       # Attendance dashboard
│   ├── gradebook/        # Gradebook
│   └── ...
├── lib/                  # Utilities
│   └── env.ts            # Environment config
└── stores/               # State management (Zustand)
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens:** Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- **Token Refresh:** Automatic refresh on 401 response
- **Role-Based Access Control (RBAC):**
  - Admin: Full access
  - Faculty: Own sections, grades, attendance
  - Student: Own records (read-only)
  - Registrar: Enrollment, eligibility
  - ExamCell: Results publishing

### Security Layers
1. **Nginx:** Rate limiting, SSL/TLS, security headers
2. **Django Middleware:** CORS, CSRF, Authentication, Audit logging
3. **DRF Permissions:** IsAuthenticated, object-level permissions
4. **Database:** Row-level security (via Django ORM filters)

### Audit Trail
- All write operations (POST, PUT, PATCH, DELETE) logged
- Log fields: actor, timestamp, HTTP method, endpoint, status code
- Immutable audit logs (no deletion allowed)

## Error Handling

### Consistent Error Format
```json
{
  "error": {
    "code": 400,
    "message": "Human-readable error message",
    "details": {
      "field_name": ["Specific error detail"]
    }
  }
}
```

### Error Response Codes
- **200 OK:** Successful GET
- **201 Created:** Successful POST
- **400 Bad Request:** Validation error
- **401 Unauthorized:** Missing/invalid token
- **403 Forbidden:** Permission denied
- **404 Not Found:** Resource doesn't exist
- **409 Conflict:** Duplicate resource (e.g., enrollment)
- **500 Internal Server Error:** Server error

### Logging Policy
- **NO PII in logs:** Never log passwords, tokens, sensitive data
- **Structured logging:** JSON format for easy parsing
- **Log rotation:** Daily rotation, 14-day retention
- **Log levels:** DEBUG (dev), INFO (staging), WARNING (production)

## Deployment Architecture

### Development Environment
```
- Backend: localhost:8000 (runserver)
- Frontend: localhost:5173 (vite dev)
- Database: SQLite in-memory (tests) or local PostgreSQL
- No SSL, Debug mode ON
```

### Staging Environment
```
- Docker Compose with all services
- PostgreSQL persistent volume
- Redis for jobs
- Nginx reverse proxy
- Self-signed SSL or Let's Encrypt
- Debug mode OFF
```

### Production Environment
```
- Docker Compose with production config
- PostgreSQL with daily backups
- Redis with persistence
- Nginx with Let's Encrypt SSL
- Gunicorn with multiple workers
- RQ worker with auto-restart
- Health monitoring
- Log aggregation
```

## Performance Optimizations

### Backend
- **Database Indexing:** On frequently queried fields (reg_no, program, term)
- **Query Optimization:** select_related, prefetch_related for joins
- **Pagination:** Default 30 items per page
- **Caching:** Redis for frequently accessed data (optional)

### Frontend
- **Code Splitting:** Lazy loading for routes
- **Bundle Optimization:** Vite tree-shaking, minification
- **API Caching:** React Query with stale-while-revalidate
- **Asset Optimization:** Image compression, CDN (production)

### Nginx
- **Gzip Compression:** Text assets (HTML, CSS, JS)
- **Browser Caching:** Static assets (images, fonts)
- **Connection Pooling:** Upstream connections to backend

## Scalability Considerations

### Horizontal Scaling
- **Backend:** Multiple Gunicorn instances behind load balancer
- **RQ Workers:** Multiple workers for background jobs
- **Database:** Read replicas for reporting queries
- **Redis:** Redis Cluster for distributed caching

### Vertical Scaling
- **Database:** Increase PostgreSQL resources (RAM, CPU)
- **Backend:** More Gunicorn workers (CPU-bound)
- **RQ Workers:** More workers for job throughput

## Monitoring & Observability

### Health Checks
- **Backend:** `/healthz/` endpoint
  - Database connectivity
  - Redis connectivity
  - RQ worker status
- **Frontend:** Static file check
- **Nginx:** HTTP 200 on health endpoint

### Metrics (Optional)
- **Application:** Sentry for error tracking
- **Infrastructure:** Docker stats, container health
- **Database:** Query performance, connection pool
- **Jobs:** RQ dashboard for job monitoring

## Backup & Recovery

### Database Backups
- **Nightly Automated:** GitHub Actions workflow
- **Format:** pg_dump SQL format
- **Retention:** 7 days
- **Storage:** GitHub Artifacts (can be moved to S3)

### Restore Process
```bash
./restore.sh <backup-file>
```
- Validates backup file
- Creates database backup before restore
- Restores from dump
- Verifies integrity

### Disaster Recovery
1. Restore database from latest backup
2. Restart Docker services
3. Run migrations if schema changed
4. Verify health endpoints
5. Test critical user flows

---

**Last Updated:** October 22, 2025  
**Version:** v1.1.0-stable  
**Status:** Production-ready ✅
