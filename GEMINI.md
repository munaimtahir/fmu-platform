# FMU SIMS - Student Information Management System

## Project Overview
FMU SIMS is a comprehensive digital platform designed for **Faisalabad Medical University (FMU)** to manage student records and academic processes. It replaces paper-based systems with a secure, role-based web application.

- **Purpose**: Digitize student lifecycle from application to graduation.
- **Main Technologies**:
  - **Backend**: Django 5.1.4, Django REST Framework, PostgreSQL, Redis, RQ (Background Jobs).
  - **Frontend**: React 19.1.1, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query.
  - **Infrastructure**: Docker, Docker Compose, Nginx, GitHub Actions.
- **Key Architecture**: Modular design with task-based RBAC, immutable audit logging, and state-machine controlled workflows.

## Building and Running

### Using Docker (Recommended)
```bash
# Copy and configure environment variables
cp .env.example .env

# Build and start the stack
docker compose up --build
```
- **Frontend**: http://localhost:8080 (Docker) or http://localhost:5173 (Dev)
- **Backend API**: http://localhost:8010 (Docker) or http://localhost:8000 (Dev)
- **API Docs**: http://localhost:8000/api/docs/ (Swagger)
- **Django Admin**: http://localhost:8000/admin/

### Manual Setup

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest                     # Run all tests
pytest --cov=apps          # Run with coverage
```

### Frontend Tests
```bash
cd frontend
npm run test               # Unit tests (Vitest)
npm run type-check         # TypeScript check
npm run lint               # Linting (ESLint)
npm run e2e                # E2E tests (Playwright)
```

## Development Conventions

### Coding Standards
- **Backend**: Adhere to Django/DRF best practices. Use `ruff` for linting/formatting and `mypy` for type checking.
- **Frontend**: Use functional components with React 19 hooks. Enforce strict TypeScript typing.
- **Audit**: All write operations MUST be audited. Ensure `WriteAuditMiddleware` is active and models are tracked via `django-simple-history` where appropriate.

### Architectural Patterns
- **Task-Based RBAC**: Permissions are defined as "tasks". Assign tasks to roles or users, never check for roles directly in code if possible.
- **State Machines**: Critical entity transitions (e.g., Exam Results: `draft` -> `published` -> `frozen`) must be managed via explicit state machine logic.
- **Modularization**: Keep domain logic within their respective modules in `backend/sims_backend/`.

### Directory Structure Note
- **`backend/sims_backend/`**: Contains the active domain modules and main settings.
- **`backend/config/`**: Contains legacy/template configuration; prioritize `sims_backend` for current development.
- **`modules/`**: Contains some shared or transitionary modules.

## Key Files
- `docker-compose.yml`: Main orchestration for development and production.
- `backend/sims_backend/settings.py`: Core backend configuration.
- `backend/sims_backend/urls.py`: Main API routing and health checks.
- `frontend/src/api/`: Axios client and API service definitions.
- `docs/BLUEPRINT_LOCKED.md`: The system design authority (refer here for business rules).
