# FMU - Student Information Management System (SIMS)

[![Backend CI](https://github.com/munaimtahir/Fmu/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/munaimtahir/Fmu/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/munaimtahir/Fmu/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/munaimtahir/Fmu/actions/workflows/frontend-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A comprehensive, production-ready Student Information Management System built with Django REST Framework and React.

## 🚀 Quick Start

### One-Command Demo Setup (Recommended)

```bash
# Clone, setup, and run with demo data in one command
git clone https://github.com/munaimtahir/Fmu.git && cd Fmu && \
cp .env.example .env && \
docker compose up -d && \
sleep 10 && \
docker compose exec backend python manage.py migrate && \
docker compose exec backend python manage.py seed_demo --students 30
```

**Access the application:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:8000
- 👨‍💼 Admin Panel: http://localhost:8000/admin

### Demo Accounts

After running `seed_demo`, use these credentials to log in:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | admin | admin123 | Full system access |
| **Registrar** | registrar | registrar123 | Enrollment & records management |
| **Faculty** | faculty | faculty123 | Own sections & students |
| **Student** | student | student123 | Own records & transcripts |

Additional faculty accounts: `faculty1`, `faculty2`, `faculty3` (all with password: `faculty123`)

### Production Deployment

For production deployment with static frontend:

```bash
# Use production docker-compose
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations and collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Seed demo data (optional)
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo --students 50

# Access via: http://localhost
```

**See [docs/SECURITY_DEPLOYMENT.md](docs/SECURITY_DEPLOYMENT.md) for production configuration.**

### Using Docker (Step by Step)
```bash
# 1. Clone and setup environment
git clone https://github.com/munaimtahir/Fmu.git
cd Fmu
cp .env.example .env
# Edit .env if needed for custom configuration

# 2. Start all services
docker compose up -d

# 3. Wait for services to be ready (about 10 seconds)
sleep 10

# 4. Run migrations
docker compose exec backend python manage.py migrate

# 5. Seed demo data
docker compose exec backend python manage.py seed_demo --students 30

# 6. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Admin Panel: http://localhost:8000/admin
```

### Using Makefile
```bash
make demo        # Complete setup with demo data
make test        # Run all tests
make lint        # Run all linters
make docker-up   # Start Docker services
make docker-down # Stop Docker services
```

## 📊 Status & Metrics

### Current Version
- **Production:** v1.0.0-prod ✅
- **Stable:** v1.1.0-stable ✅
- **Status:** ✅ Production-ready
- **Last Verified:** October 23, 2025

### Test Coverage
| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| Backend | 220 | 91% | ✅ PASS |
| Frontend | 26 | 100% | ✅ PASS |

### Quality Metrics
- ✅ All linters passing (ruff, mypy, eslint, tsc)
- ✅ All tests passing (220 backend, 26 frontend)
- ✅ CI/CD green
- ✅ Docker build successful
- ✅ Security scanning clean (CodeQL)
- ✅ Production deployment ready

## 📋 Overview

SIMS is a production-ready academic digitization system designed to manage:
- Universities, Colleges, Departments, Programs
- Student admissions, enrollments, and records
- Course management and term scheduling
- Attendance tracking and eligibility computation
- Assessment schemes and results management
- Transcript generation with QR code verification
- Document management and verification
- Request ticket system (bonafide certificates, transcripts, etc.)

## ✨ Features

- **Role-Based Access Control:** Pre-configured roles for Admin, Registrar, Faculty, and Student, each with a tailored dashboard and permissions.
- **Academic Structure:** Manage programs, courses, terms, and sections with ease.
- **Student Lifecycle Management:** A comprehensive system for admissions, enrollments, and maintaining student records.
- **Attendance Tracking:** Record and monitor student attendance, with automatic eligibility calculations.
- **Assessment and Results:** Flexible assessment schemes and automated result generation.
- **Transcript Generation:** Create and manage student transcripts with QR code verification for authenticity.
- **Demo Data Seeding:** A powerful seeding script to quickly populate the system with realistic demo data for testing and demonstration.
- **Production-Ready:** Built with best practices for security, performance, and scalability, ready for deployment.

## Tech Stack

### Backend
- Python 3.12
- Django 5.1.4 + Django REST Framework
- PostgreSQL 14+
- Redis (for background jobs)
- JWT Authentication

### Frontend
- React 18
- Vite (build tool)
- Modern ES6+ JavaScript

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)

## Prerequisites

- Docker & Docker Compose
- Python 3.12+ (for local development)
- Node.js 20+ (for local development)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/munaimtahir/Fmu.git
cd Fmu
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration (optional for development)
```

3. Start all services:
```bash
docker compose up --build
```

4. Run initial migrations (in a new terminal):
```bash
docker exec -it sims_backend python manage.py migrate
```

5. Create a superuser:
```bash
docker exec -it sims_backend python manage.py createsuperuser
```

6. Access the application:
- Frontend UI: http://localhost:5173
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin
- API Authentication: http://localhost:8000/api/auth/token/
- Full stack via Nginx: http://localhost

## Local Development Setup

### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start development server:
```bash
python manage.py runserver
```

### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env  # or create frontend/.env manually
```

4. Start development server:
```bash
npm run dev
```

## Project Structure

```
Fmu/
├── backend/                    # Django backend
│   ├── sims_backend/          # Django project settings
│   ├── core/                  # Core app
│   ├── tests/                 # Backend tests
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend Docker config
│   └── pytest.ini             # Test configuration
├── frontend/                   # React frontend
│   ├── src/                   # Source files
│   ├── public/                # Static files
│   ├── package.json           # Node dependencies
│   ├── vite.config.js         # Vite configuration
│   └── Dockerfile             # Frontend Docker config
├── nginx/                      # Nginx configuration
│   ├── nginx.conf             # Main config
│   └── conf.d/                # Site configs
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── API.md                 # API reference
│   ├── DATAMODEL.md           # Data models
│   ├── SETUP.md               # Setup guide
│   ├── CI-CD.md               # CI/CD documentation
│   ├── SECURITY_DEPLOYMENT.md # Production security
│   ├── archive/               # Historical reports
│   └── adr/                   # Architecture Decision Records
├── scripts/                    # Utility scripts
│   ├── validate_release.sh    # Release validation
│   ├── test_*.sh              # Testing scripts
│   └── quick-start.sh         # Quick setup
├── archive/                    # Historical/legacy files
│   ├── reports/               # Old completion reports
│   ├── diagnostics/           # Historical diagnostics
│   └── logs/                  # Old log files
├── docker-compose.yml          # Development services
├── docker-compose.prod.yml    # Production services
├── .env.example               # Environment template
├── Makefile                   # Build commands
├── README.md                  # This file
└── CONTRIBUTING.md            # Contribution guide
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

With coverage:
```bash
pytest --cov=. --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Code Quality

### Backend
```bash
cd backend

# Lint with ruff
ruff check .

# Type check with mypy
mypy .
```

### Frontend
```bash
cd frontend

# Lint with ESLint
npm run lint
```

### Comprehensive Validation
```bash
# Run full release validation check
./validate_release.sh
```

This script validates:
- Backend tests and coverage (≥80%)
- Frontend tests and coverage (≥70%)
- Code quality (linters, type checking)
- Docker configuration
- Security configuration
- CI/CD workflows
- Documentation completeness

## API Documentation

Once the backend is running, API documentation is available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- OpenAPI schema: http://localhost:8000/api/schema/
- JWT token obtain/refresh endpoints live under http://localhost:8000/api/auth/.

## Environment Variables

Key environment variables (see `.env.example` for full list):

**Core Settings:**
- `DJANGO_SECRET_KEY`: Django secret key (**MUST change in production!**)
- `DJANGO_DEBUG`: Debug mode (`True` for development, `False` for production)
- `DJANGO_ALLOWED_HOSTS`: Comma-separated list of allowed hosts (set to your domain in production)

**Database:**
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database credentials
- `DB_HOST`, `DB_PORT`: Database connection details

**Security:**
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins for CORS
- `JWT_ACCESS_TOKEN_LIFETIME`: JWT access token lifetime in minutes (default: 60)
- `JWT_REFRESH_TOKEN_LIFETIME`: JWT refresh token lifetime in minutes (default: 1440)

**Email (Optional):**
- `EMAIL_BACKEND`: Email backend (console for dev, smtp for production)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

**See:**
- [docs/SECURITY_DEPLOYMENT.md](docs/SECURITY_DEPLOYMENT.md) for production security
- [docs/EMAIL_CONFIG.md](docs/EMAIL_CONFIG.md) for email configuration

## Deployment

### Quick Production Deployment

```bash
# 1. Clone and configure
git clone https://github.com/munaimtahir/Fmu.git && cd Fmu
cp .env.example .env
# Edit .env with production values (see docs/SECURITY_DEPLOYMENT.md)

# 2. Deploy with production configuration
docker compose -f docker-compose.prod.yml up -d --build

# 3. Initialize database
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# 4. Create admin user
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Access at: http://your-domain (configure nginx with your domain)
```

**Important:**
- Set `DJANGO_DEBUG=False` in production
- Use strong `DJANGO_SECRET_KEY`
- Configure `DJANGO_ALLOWED_HOSTS` with your domain
- Enable HTTPS (see [docs/SECURITY_DEPLOYMENT.md](docs/SECURITY_DEPLOYMENT.md))

**Complete guides:**
- [docs/SETUP.md](docs/SETUP.md) - Detailed deployment instructions
- [docs/SECURITY_DEPLOYMENT.md](docs/SECURITY_DEPLOYMENT.md) - Production security
- [docs/CI-CD.md](docs/CI-CD.md) - CI/CD pipeline documentation

## 📄 Documentation

Complete documentation is available in the [docs/](docs/) directory:

- **[Repository Structure](docs/REPO_STRUCTURE.md)** - Directory organization guide
- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[API Reference](docs/API.md)** - Complete endpoint documentation  
- **[Data Model](docs/DATAMODEL.md)** - Database schema and ERD
- **[Setup Guide](docs/SETUP.md)** - Deployment and configuration
- **[Security & Deployment](docs/SECURITY_DEPLOYMENT.md)** - Production security guide
- **[Email Configuration](docs/EMAIL_CONFIG.md)** - Email setup guide
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines
- **[Changelog](docs/CHANGELOG.md)** - Version history
- **[Tests](docs/TESTS.md)** - Testing documentation
- **[CI/CD](docs/CI-CD.md)** - Pipeline configuration
- **[Roles & Permissions](docs/ROLES.md)** - User roles and access control

## 🎯 Demo Credentials

After running `seed_demo`, use these credentials to explore different user roles:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| **Admin** | admin | admin123 | Full system access, user management |
| **Registrar** | registrar | registrar123 | Enrollment management, records |
| **Faculty** | faculty | faculty123 | View/manage own sections and students |
| **Student** | student | student123 | View own records, attendance, results |

**Additional accounts:**
- Faculty: `faculty1`, `faculty2`, `faculty3` (password: `faculty123`)
- Each role demonstrates different permission levels per [docs/ROLES.md](docs/ROLES.md)

## Contributing

Please read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues, questions, or contributions:

- 📖 [Complete Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/munaimtahir/Fmu/issues)
- 📧 Contact: munaimtahir@users.noreply.github.com

## License

See LICENSE file for details.

## Support

For issues and questions, please use the GitHub issue tracker.
