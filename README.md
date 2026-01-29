# FMU SIMS - Student Information Management System

A comprehensive digital platform for managing student records and academic processes at **Faisalabad Medical University (FMU)**. This system replaces paper files and manual record-keeping with a secure, role-based web application for medical education management.

## 🎓 Overview

FMU SIMS digitizes all student-related records and processes for **Faisalabad Medical University**, starting with the Medical College (five graduate programs) and Allied Health Sciences (4-5 BS and diploma programs). The system handles the complete student lifecycle from application and enrollment through attendance, assessments, results, transcripts, and graduation.

### Core Users
- **Super Admin (IT)**: System administration and configuration
- **College Admin**: University-wide oversight and reporting
- **Program Coordinator**: Academic program management and student placement
- **Exam Cell**: Assessment scheduling and result publishing
- **Faculty**: Teaching, attendance tracking, and assessment entry
- **Finance**: Fee collection and financial operations
- **Students**: Access to personal academic records and services

### Major Workflows
**Admissions** → **Enrollment** → **Attendance** → **Assessments** → **Results/Transcripts** → **Clinical Rotations/Logbooks** → **Certificates** → **Graduation/Alumni**

## 🎯 Key Features

### Academic Management
- **Program & Course Management**: Define programs, courses, batches, sections, and academic periods
- **Student Registry**: Official enrolled student records with lifecycle tracking
- **Academic Placement**: Assign students to programs, batches, and groups
- **Term Management**: Open/close academic periods with conflict-aware scheduling

### Teaching & Assessment
- **Attendance Tracking**: Track student attendance and generate eligibility reports
- **Exam Scheduling**: Schedule assessments with conflict detection
- **Results Publishing**: Official marks publishing with state-machine controls (draft → published → frozen)
- **Transcripts**: Generate official transcripts with QR code verification

### Financial Operations
- **Fee Plans**: Configure fee structures per program/batch
- **Voucher Generation**: Auto-generate payment vouchers for students
- **Payment Tracking**: Record and track student payments
- **Financial Reporting**: Comprehensive financial reports and analytics

### Administrative Tools
- **Task-Based RBAC**: Flexible role-based access control with permission tasks
- **Audit Logging**: Immutable audit trail for all write operations (required for compliance)
- **User Management**: Manage staff, faculty, and student accounts
- **Public Intake Form**: Public student application form (Phase 1 - No user accounts, no placement)

### Identity & Contact Data
- **Normalized Identity**: Shared person records for students, faculty, and staff
- **Contact Management**: Manage phones, emails, addresses, and identity documents
- **Document Upload**: Store and manage student documents securely

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.1.4
- **API**: Django REST Framework 3.15.2
- **Database**: PostgreSQL 14+ (Production), SQLite (Development/Testing)
- **Authentication**: JWT via djangorestframework-simplejwt 5.3.1
- **Cache/Jobs**: Redis 7 (background jobs, caching)
- **Background Jobs**: django-rq (Python RQ)
- **API Documentation**: drf-spectacular (OpenAPI 3.0)
- **PDF Generation**: ReportLab + QRCode
- **Audit/History**: django-simple-history
- **WSGI Server**: Gunicorn

### Frontend
- **Framework**: React 19.1.1
- **Language**: TypeScript
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7
- **State Management**: Zustand + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library + Playwright (E2E)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy, static file serving)
- **CI/CD**: GitHub Actions
- **Security Scanning**: CodeQL
- **Code Quality**: Ruff, MyPy, ESLint

## 📁 Project Structure

```
fmu-platform/
├── backend/              # Django REST API
│   ├── apps/             # Django apps (intake, etc.)
│   ├── config/           # Django settings and configuration
│   │   ├── settings/     # Split settings (base, development, production)
│   │   └── urls.py       # URL routing
│   ├── core/             # Core models (users, roles, permissions, audit)
│   ├── sims_backend/     # Legacy backend code (deprecated)
│   ├── requirements.txt  # Python dependencies
│   └── manage.py         # Django management script
├── frontend/             # React TypeScript application
│   ├── src/
│   │   ├── api/          # API client and services
│   │   ├── components/   # Reusable React components
│   │   ├── features/     # Feature-specific components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── router/       # Route configuration
│   ├── e2e/              # Playwright E2E tests
│   ├── package.json      # NPM dependencies
│   └── vite.config.ts    # Vite configuration
├── docs/                 # System documentation
│   ├── API.md            # API documentation
│   ├── ARCHITECTURE.md   # System architecture
│   ├── BLUEPRINT_LOCKED.md # System design authority
│   ├── CANONICAL_MODULES.md # Module definitions
│   └── DATAMODEL.md      # Database schema
├── docker-compose.yml    # Docker Compose configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+** (backend)
- **Node.js 20+** (frontend)
- **PostgreSQL 14+** (for production)
- **Redis 7** (optional - for background jobs; system works without it but background jobs will be disabled)
- **Docker & Docker Compose** (for containerized deployment)

### Quick Start with Docker (Recommended)

The easiest way to run the full stack:

```bash
# Clone the repository
git clone <repository-url>
cd fmu-platform

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database password and other settings

# Start all services
docker compose up --build

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8010
```

The database will be automatically initialized with migrations on first run.

### Local Development Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (or set environment variables)
cp ../.env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Run development server
npm run dev
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 (dev) or http://localhost:8080 (Docker) | Main web application |
| Backend API | http://localhost:8000 (dev) or http://localhost:8010 (Docker) | REST API endpoints |
| API Docs | http://localhost:8000/api/schema/swagger-ui/ | Interactive API documentation |
| Django Admin | http://localhost:8000/admin | Django admin panel |

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documents
- **[APP_DESCRIPTION.md](docs/APP_DESCRIPTION.md)**: Plain-language system description
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System architecture and technology stack
- **[BLUEPRINT_LOCKED.md](docs/BLUEPRINT_LOCKED.md)**: Locked system blueprint (authority document)
- **[CANONICAL_MODULES.md](docs/CANONICAL_MODULES.md)**: Canonical vs legacy modules
- **[DATAMODEL.md](docs/DATAMODEL.md)**: Database schema and entity relationships
- **[API.md](docs/API.md)**: API documentation and endpoints

### Additional Resources
- **[CI-CD.md](docs/CI-CD.md)**: CI/CD pipeline documentation
- **[CHANGELOG.md](docs/CHANGELOG.md)**: Version history and changes
- **Admin Report**: See `docs/admin-report/` for detailed system overview and screen documentation

### Code Documentation
The codebase includes:
- **Python**: Comprehensive docstrings following Django conventions
- **TypeScript/JSDoc**: JSDoc comments for functions and components

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test file
pytest tests/test_students.py
```

### Frontend Tests

#### Unit Tests (Vitest)
```bash
cd frontend

# Run tests
npm run test

# Watch mode
npm run test:watch
```

#### Type Checking
```bash
cd frontend
npm run type-check
```

#### Linting
```bash
cd frontend
npm run lint
```

#### E2E Tests (Playwright)
```bash
cd frontend

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed mode
npm run test:e2e:headed
```

### Build
```bash
cd frontend
npm run build
```

## 🚢 Deployment

### Docker Production Deployment (Recommended)

```bash
# Production deployment with Docker Compose
docker compose -f docker-compose.yml up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart backend
docker compose restart frontend

# Stop all services
docker compose down
```

### Environment Variables

#### Backend Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DJANGO_SECRET_KEY` | Django secret key | - | Yes (production) |
| `DJANGO_DEBUG` | Enable debug mode | `False` | No |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` | Yes |
| `CSRF_TRUSTED_ORIGINS` | Trusted CSRF origins (HTTPS URLs) | - | Yes (production) |
| `DB_ENGINE` | Database engine | `django.db.backends.postgresql` | No |
| `DB_NAME` | Database name | `sims_db` | Yes |
| `DB_USER` | Database user | `sims_user` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_HOST` | Database host | `db` | No |
| `DB_PORT` | Database port | `5432` | No |
| `POSTGRES_DB` | PostgreSQL database name | `sims_db` | Yes (Docker) |
| `POSTGRES_USER` | PostgreSQL user | `sims_user` | Yes (Docker) |
| `POSTGRES_PASSWORD` | PostgreSQL password | - | Yes (Docker) |
| `REDIS_HOST` | Redis host | `redis` | No |
| `REDIS_PORT` | Redis port | `6379` | No |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | - | Yes |
| `EMAIL_BACKEND` | Email backend class | `console` (dev) | No |
| `EMAIL_HOST` | SMTP server | - | No |
| `EMAIL_PORT` | SMTP port | `587` | No |
| `EMAIL_USE_TLS` | Use TLS for email | `True` | No |
| `EMAIL_HOST_USER` | Email username | - | No |
| `EMAIL_HOST_PASSWORD` | Email password | - | No |
| `DEFAULT_FROM_EMAIL` | Default from email | - | No |
| `JWT_ACCESS_TOKEN_LIFETIME` | JWT access token lifetime (minutes) | `60` | No |
| `JWT_REFRESH_TOKEN_LIFETIME` | JWT refresh token lifetime (minutes) | `1440` | No |

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `/api` (production) or `http://localhost:8000` (dev) |

### Production Deployment Checklist

Before deploying to production:

1. ✅ Generate a strong `DJANGO_SECRET_KEY` (never reuse across environments)
2. ✅ Set `DJANGO_DEBUG=False`
3. ✅ Update `DJANGO_ALLOWED_HOSTS` with your production domain
4. ✅ Update `CSRF_TRUSTED_ORIGINS` with HTTPS URLs
5. ✅ Update `CORS_ALLOWED_ORIGINS` with HTTPS URLs
6. ✅ Set strong database passwords
7. ✅ Configure email backend for production (SMTP)
8. ✅ Review all security settings
9. ✅ Set up SSL/TLS certificates
10. ✅ Configure backups for PostgreSQL database

## 🏗️ System Architecture

### Design Principles

1. **Governance-Grade System**: SIMS is a governance-grade academic system, not a CRUD app
2. **Correctness Over Speed**: Data accuracy and integrity are paramount
3. **Auditability**: Complete audit trail for compliance (PMDC/HEC)
4. **Explicit Workflows**: State machines control lifecycle transitions
5. **Policy Separation**: Academic, finance, and identity concerns are separated

### Canonical Modules

The system uses a modular architecture with canonical (official) modules:

#### Core Modules
- **core**: RBAC system, task-based permissions, user management, shared rules
- **people**: Normalized identity and contact data (Person, ContactInfo, Address, IdentityDocument)
- **audit**: Immutable audit logging for all write operations

#### Academic Modules
- **academics**: Programs, courses, sections, batches, terms, academic periods
- **students**: Enrolled student registry (official student records)
- **attendance**: Student attendance tracking and eligibility reporting
- **exams**: Exam scheduling with conflict detection
- **results**: Official marks publishing with state-machine controls (draft → published → frozen)
- **transcripts**: Official transcript generation with QR verification

#### Administrative Modules
- **intake**: Public student application form (Phase 1 - no user accounts, no placement)
- **finance**: Fee plans, vouchers, payments, financial reporting

### State Machines

Key entities use state machines to enforce business rules:
- **Results**: `draft` → `published` → `frozen` (immutable after publish, changes require approval)
- **Terms**: `open` → `closed` (closed terms block academic writes)
- **Students**: Various lifecycle states with controlled transitions

### Security & Permissions

- **Task-Based RBAC**: Permissions are defined as tasks, not roles
- **Fine-Grained Control**: Permission tasks can be assigned to roles or individual users
- **Object-Level Permissions**: Students only access their own records
- **Audit Trail**: Every write operation generates an immutable audit record

## 📋 Student Intake Form (Phase 1)

The Student Intake system allows prospective students to submit application data through a public form accessible at `/apply/student-intake/`.

### Phase 1 Characteristics
- ✅ **Public Form**: No login required
- ✅ **Comprehensive Data Collection**: Personal info, guardian info, merit details, academic background, documents
- ✅ **Mandatory Fields**: Email, mobile, guardian WhatsApp, passport-size photo
- ✅ **File Upload Validation**: Enforced file size limits and format validation
- ✅ **Anti-Spam Protection**: Honeypot field and session-based cooldown (60 seconds)
- ✅ **Verification Queue**: All submissions stored as PENDING for staff review
- ✅ **Admin Approval**: Staff can approve submissions and create Student records
- ✅ **Duplicate Detection**: Checks for duplicates (CNIC, Mobile, Email, MDCAT Roll Number)
- ✅ **Audit Log Safety**: Sensitive fields (CNIC, mobile, email) redacted from audit logs

### Phase 1 Limitations
- ❌ **No User Accounts**: Students do NOT get usernames or passwords
- ❌ **No Academic Placement**: Students are NOT assigned to Program/Batch/Group
- ❌ **No Direct Student Creation**: Submissions must be approved by staff first

### Access Points
- **Public Form**: `/apply/student-intake/`
- **Success Page**: `/apply/student-intake/success/<submission_id>/`
- **Admin Queue**: `/admin/intake/studentintakesubmission/`

### Admin Actions
Staff with roles ADMIN, COORDINATOR, or OFFICE_ASSISTANT can:
1. View all submissions in the verification queue
2. Filter by status, search by submission ID, name, CNIC, mobile, email, MDCAT roll number
3. Review duplicate check results
4. Use "Approve & Create Student" action to create official student records

### Security & Privacy
- All file uploads stored under `media/intake/<submission_id>/`
- Sensitive fields redacted in admin display
- Session-based cooldown prevents spam
- Honeypot field blocks automated submissions

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our development workflow and coding standards.

## 📄 License

Proprietary - Faisalabad Medical University

---

**Built with ❤️ for Faisalabad Medical University**
