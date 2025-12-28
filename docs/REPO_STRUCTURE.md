# Repository Structure

This document describes the organization and structure of the FMU SIMS repository after the cleanup and standardization effort.

## Directory Layout

```
fmu/
├── backend/                    # Django REST API Backend
│   ├── core/                   # Core Django app with main models
│   ├── sims_backend/          # Main Django project and apps
│   │   ├── academics/         # Academic structure (programs, courses)
│   │   ├── admissions/        # Student admissions
│   │   ├── assessments/       # Assessment schemes
│   │   ├── attendance/        # Attendance tracking
│   │   ├── audit/             # Audit logging
│   │   ├── enrollment/        # Student enrollment
│   │   ├── requests/          # Request ticketing system
│   │   ├── results/           # Results management
│   │   └── transcripts/       # Transcript generation
│   ├── tests/                 # Backend test suite (pytest)
│   ├── static/                # Static files served by Django
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend Docker configuration
│   ├── pytest.ini             # Pytest configuration
│   └── pyproject.toml         # Python project metadata
│
├── frontend/                   # React Frontend Application
│   ├── src/                   # Source code
│   │   ├── api/               # API client configuration
│   │   ├── components/        # Reusable React components
│   │   ├── features/          # Feature-specific components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static public assets
│   ├── package.json           # Node.js dependencies
│   ├── vite.config.ts         # Vite build configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── Dockerfile             # Frontend Docker configuration
│   └── Dockerfile.prod        # Production frontend Docker config
│
├── nginx/                      # Nginx Reverse Proxy
│   ├── nginx.conf             # Main nginx configuration
│   ├── nginx.staging.conf     # Staging nginx configuration
│   └── conf.d/                # Additional nginx configs
│
├── .github/                    # GitHub Configuration
│   └── workflows/             # CI/CD Workflows
│       ├── backend-ci.yml     # Backend testing & linting
│       ├── frontend-ci.yml    # Frontend testing & building
│       └── docker-ci.yml      # Docker build validation
│
├── docs/                       # Documentation (Active)
│   ├── API.md                 # API reference documentation
│   ├── ARCHITECTURE.md        # System architecture overview
│   ├── CHANGELOG.md           # Version history
│   ├── CI-CD.md               # CI/CD pipeline documentation
│   ├── DATA-GOVERNANCE.md     # Data governance policies
│   ├── DATAMODEL.md           # Database schema and ERD
│   ├── EMAIL_CONFIG.md        # Email configuration guide
│   ├── ENV.md                 # Environment variables reference
│   ├── OPERATIONS.md          # Operations guide
│   ├── ROADMAP.md             # Project roadmap
│   ├── ROLES.md               # User roles and permissions
│   ├── SECURITY.md            # Security overview
│   ├── SECURITY_DEPLOYMENT.md # Production security guide
│   ├── SETUP.md               # Setup and deployment guide
│   ├── TESTS.md               # Testing documentation
│   ├── USER_GUIDE.md          # User guide
│   ├── adr/                   # Architecture Decision Records
│   │   ├── 0001-use-drf.md   # Decision to use Django REST Framework
│   │   └── 0002-authn-authz.md # Authentication/Authorization decisions
│   ├── archive/               # Historical completion reports
│   └── openapi-schema.yaml    # OpenAPI specification
│
├── scripts/                    # Utility Scripts
│   ├── README.md              # Scripts documentation
│   ├── quick-start.sh         # Quick setup script
│   ├── restore.sh             # Restore from backup
│   ├── test_api_endpoints.sh  # API endpoint testing
│   ├── test_integration.sh    # Integration testing
│   ├── validate_completion.sh # Project completion validation
│   ├── validate_docker_deployment.sh # Docker deployment validation
│   ├── validate_release.sh    # Comprehensive release validation
│   └── validate_stage4.sh     # Stage 4 validation
│
├── archive/                    # Historical/Legacy Content
│   ├── README.md              # Archive documentation
│   ├── reports/               # Historical completion reports
│   │   ├── BUGFIX_REPORT.md
│   │   ├── COMPLETION_SUMMARY.md
│   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   └── ... (30+ historical reports)
│   ├── diagnostics/           # Historical diagnostic reports
│   │   ├── JAZZMIN_RUNTIME_FIX.md
│   │   ├── AUTONOMOUS_RELEASE_IMPLEMENTATION_SUMMARY.md
│   │   └── ...
│   ├── logs/                  # Historical log files
│   │   └── all.txt
│   ├── backend-docs/          # Old backend documentation
│   │   └── coverage_analysis.md
│   └── seed-data/             # Legacy seed data files
│       └── demo_students.json
│
├── docker-compose.yml          # Development Docker Compose
├── docker-compose.prod.yml    # Production Docker Compose
├── docker-compose.staging.yml # Staging Docker Compose
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── Makefile                   # Build and deployment commands
├── pytest.ini                 # Root pytest configuration
├── README.md                  # Main project README
├── CONTRIBUTING.md            # Contribution guidelines
└── LICENSE                    # MIT License

```

## Key Principles

### 1. Separation of Active and Legacy
- **Active code and docs** are in the main directories (`backend/`, `frontend/`, `docs/`, `scripts/`)
- **Legacy/historical content** is preserved in `archive/` but not part of active development

### 2. Consistent Naming
- All directories use lowercase names for consistency
- Documentation is in `docs/` (lowercase)
- Scripts are organized in `scripts/`

### 3. Logical Organization
- Backend and frontend are clearly separated
- Documentation is consolidated in one location
- Utility scripts have their own directory
- Infrastructure configs (Docker, nginx) are at root for visibility

### 4. No Deletion Policy
- Historical reports and old files were **moved** to `archive/`, not deleted
- This preserves project history and audit trails
- Archive contents can be referenced if needed

## What Changed

### Moved to Archive
1. **18 root-level markdown files** → `archive/reports/`
   - Historical completion reports
   - Bug fix reports
   - Deployment checklists
   - Migration logs

2. **diagnostics/ folder** → `archive/diagnostics/`
   - Historical diagnostic reports
   - Jazzmin fix logs

3. **all.txt** → `archive/logs/`
   - Old deployment logs

4. **backend/Docs/** → `archive/backend-docs/`
   - Coverage analysis report

5. **backend/seed/** → `archive/seed-data/`
   - Old demo_students.json (replaced by management command)

### Moved to Scripts
All `.sh` files from root moved to `scripts/`:
- quick-start.sh
- restore.sh
- test_api_endpoints.sh
- test_integration.sh
- validate_*.sh (4 files)

### Documentation Consolidation
1. **Docs/ → docs/** (renamed for consistency)
2. Removed duplicate files:
   - `Docs/ci-cd.md` (kept comprehensive `CI-CD.md`)
   - `Docs/CONTRIBUTING.md` (kept root `CONTRIBUTING.md`)
   - `Docs/docker-compose.yml` (duplicate)
3. Moved historical reports from `Docs/` to `archive/reports/`

## Running the Application

### Quick Start
```bash
# Clone and setup
git clone https://github.com/munaimtahir/fmu.git
cd fmu
cp .env.example .env

# Start with Docker
docker compose up -d

# Run migrations
docker compose exec backend python manage.py migrate

# Seed demo data
docker compose exec backend python manage.py seed_demo --students 30
```

### Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend tests
cd backend
pytest tests --cov=.

# Frontend tests
cd frontend
npm test
```

### Validation
```bash
# Comprehensive validation
./scripts/validate_release.sh

# Docker deployment validation
./scripts/validate_docker_deployment.sh
```

## Navigation Guide

### For Developers
- Start with: `README.md`
- Setup instructions: `docs/SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`
- API documentation: `docs/API.md`
- Testing: `docs/TESTS.md`
- Contributing: `CONTRIBUTING.md`

### For DevOps
- Docker configs: `docker-compose*.yml`
- Nginx configs: `nginx/`
- CI/CD: `.github/workflows/` and `docs/CI-CD.md`
- Deployment: `docs/SECURITY_DEPLOYMENT.md`

### For Project Managers
- Project status: `README.md`
- Version history: `docs/CHANGELOG.md`
- Roadmap: `docs/ROADMAP.md`
- Historical reports: `archive/reports/`

## Maintenance

### Adding New Documentation
- Active documentation goes in `docs/`
- Use clear, descriptive filenames
- Update this file when adding new major sections

### Scripts
- All utility scripts go in `scripts/`
- Include shebang and make executable: `chmod +x scripts/yourscript.sh`
- Update `scripts/README.md` when adding new scripts

### Archiving
- Historical reports and completion summaries go in `archive/reports/`
- Old diagnostic reports go in `archive/diagnostics/`
- Add context to `archive/README.md` when archiving significant content

## Related Documentation
- [README.md](../README.md) - Project overview and quick start
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [docs/SETUP.md](SETUP.md) - Detailed setup guide
- [scripts/README.md](../scripts/README.md) - Scripts documentation
- [archive/README.md](../archive/README.md) - Archive contents

---

**Last Updated:** December 2025  
**Restructure Completed:** Repository cleanup and standardization
