# PHASE 0 — BASELINE INVENTORY

**Date**: 2026-01-08  
**Repository**: munaimtahir/fmu-platform  
**Status**: COMPLETE

## Django Project Configuration

### Project Root
- **Location**: `/home/runner/work/fmu-platform/fmu-platform/backend`
- **Settings Module**: `sims_backend.settings`
- **Django Version**: 5.1.4
- **Python Version**: 3.11
- **Database**: PostgreSQL (production), SQLite (development fallback)

### Installed Apps

#### Core Django Apps
- `django.contrib.admin`
- `django.contrib.auth`
- `django.contrib.contenttypes`
- `django.contrib.sessions`
- `django.contrib.messages`
- `django.contrib.staticfiles`

#### Admin Theme
- `jazzmin` (must be before django.contrib.admin)

#### Third-Party Apps
- `corsheaders` - CORS support
- `django_filters` - Advanced filtering
- `django_rq` - Background job queue (optional)
- `rest_framework` - Django REST Framework
- `simple_history` - Model history tracking
- `drf_spectacular` - OpenAPI/Swagger schema generation

#### Core Shared Module
- `core` - Shared models (TimeStampedModel) and utilities

#### SIMS Canonical Domain Apps
- `sims_backend.people` - Central identity and contact management
- `sims_backend.academics` - Programs, courses, departments, periods
- `sims_backend.students` - Student records and enrollment
- `sims_backend.timetable` - Schedule management
- `sims_backend.attendance` - Attendance tracking
- `sims_backend.exams` - Exam management
- `sims_backend.results` - Results and grading
- `sims_backend.finance` - Financial operations
- `sims_backend.audit` - Audit logging

#### Legacy/Demo Apps (Re-enabled for specific scenarios)
- `sims_backend.admissions` - Used for student records and applications
- `sims_backend.enrollment` - Re-enabled for demo scenarios
- `sims_backend.assessments` - Re-enabled for demo scenarios
- `sims_backend.requests` - Requests workflow module
- `sims_backend.documents` - Document generation
- `sims_backend.notifications` - Notification service
- `apps.intake` - Student intake forms

### DRF and API Configuration

#### API Routers
- **Base API Path**: `/api/`
- **Root URLconf**: `sims_backend.urls`

#### API Module Patterns
All canonical modules expose ViewSets under `/api/` prefix:
- `/api/students/` - Student resources
- `/api/academics/` - Academic resources (programs, courses, etc.)
- `/api/attendance/` - Attendance resources
- `/api/finance/` - Financial resources
- `/api/results/` - Results resources
- `/api/exams/` - Exam resources
- `/api/timetable/` - Timetable resources
- `/api/people/` - People and identity resources

#### Authentication
- **Method**: JWT (djangorestframework-simplejwt)
- **Access Token Lifetime**: 60 minutes (configurable via JWT_ACCESS_TOKEN_LIFETIME)
- **Refresh Token Lifetime**: 1440 minutes (24 hours)
- **Token Rotation**: Enabled (ROTATE_REFRESH_TOKENS=True)
- **Blacklist After Rotation**: Enabled

#### Permissions
- **Default**: `IsAuthenticated` (all endpoints require authentication)
- **Custom Permissions**: `sims_backend.common_permissions` module

### Frontend Configuration

#### Framework & Build
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: Zustand (auth), TanStack Query (data fetching)
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

#### Environment Variables
- **VITE_API_URL**: API base URL
  - Development default: `http://localhost:8000`
  - Production: `/` (relative path, proxied by nginx)

#### Frontend Routes
- Base routes under `/dashboard/` for authenticated users
- Role-specific dashboards:
  - `/dashboard/student` - Student portal
  - `/dashboard/faculty` - Faculty portal
  - `/dashboard/admin` - Admin portal
  - `/dashboard/registrar` - Registrar portal
  - `/dashboard/examcell` - Exam cell portal
  - `/finance` - Finance portal

### Docker Compose Services

#### Service: db (fmu_db)
- **Image**: postgres:16-alpine
- **Database Name**: fmu_platform (configurable via POSTGRES_DB)
- **User**: fmu_platform (configurable via POSTGRES_USER)
- **Volume**: fmu_db_data:/var/lib/postgresql/data
- **Restart Policy**: unless-stopped

#### Service: redis (fmu_redis)
- **Image**: redis:7-alpine
- **Purpose**: Background job queue (optional)
- **Restart Policy**: unless-stopped
- **Note**: System will work without Redis but background jobs will be disabled

#### Service: backend (fmu_backend)
- **Build Context**: ./backend
- **Dockerfile**: backend/Dockerfile
- **Port Mapping**: 127.0.0.1:8010:8000
- **Depends On**: db
- **Volumes**:
  - ./backend/staticfiles:/app/staticfiles
  - ./backend/media:/app/media
- **Restart Policy**: unless-stopped

#### Service: frontend (fmu_frontend)
- **Build Context**: ./frontend
- **Dockerfile**: frontend/Dockerfile.prod
- **Port Mapping**: 127.0.0.1:8080:80
- **Build Args**: VITE_API_URL (defaults to http://backend:8000/api)
- **Restart Policy**: unless-stopped

### Known Configuration Patterns

#### Legacy Module Control
Environment variables control legacy module behavior:
- **ENABLE_LEGACY_MODULES**: Controls whether legacy endpoints are mounted (default: False)
- **ALLOW_LEGACY_WRITES**: Controls write operations on legacy endpoints (default: False)

#### Security Settings (Production)
When DEBUG=False:
- SSL redirect enabled
- HSTS enabled (1 year)
- Secure cookies
- Proxy SSL headers trusted
- Content type nosniff
- X-Frame-Options: DENY

#### CORS Configuration
- **Allowed Origins**: Configurable via CORS_ALLOWED_ORIGINS
- **Default Origins**: 
  - https://sims.alshifalab.pk
  - https://sims.pmc.edu.pk
  - http://34.124.150.231
  - http://localhost
  - http://127.0.0.1
- **Credentials**: Allowed

## Summary

This inventory provides the baseline configuration of the FMU Platform system. All subsequent diagnostic and verification activities reference these configurations.

**Key Findings**:
1. System uses modern Django 5.1.4 with DRF
2. JWT-based authentication with token rotation
3. Docker-based deployment with 3-tier architecture
4. Canonical modules clearly defined
5. Legacy modules controllable via environment variables
6. React 19 frontend with Vite build system
