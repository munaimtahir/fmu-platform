# CI/CD Documentation

This document describes the Continuous Integration and Deployment setup for the FMU Student Information Management System.

## Overview

The project uses GitHub Actions for automated testing, linting, and build validation across three main workflows:

1. **Backend CI** - Django/Python backend validation
2. **Frontend CI** - React/Vite frontend validation  
3. **Docker CI** - Docker image build and deployment checks

## Workflows

### 1. Backend CI (`backend-ci.yml`)

**Triggers:**
- Push to `backend/**` or workflow file
- Pull requests to `backend/**` or workflow file

**Jobs:**

#### Ruff Lint
- Runs `ruff check` for Python code style and quality
- Enforces modern Python syntax and best practices
- Uses Python 3.12

#### Static Type Check (mypy)
- Runs `mypy` for static type checking
- Ensures type safety across the Django application
- Configured with strict mode

#### Pytest Suite
- Runs all backend tests with pytest
- Generates coverage reports (minimum 80% required)
- Uses SQLite for CI testing (faster than PostgreSQL)
- Current coverage: **92.70%** ✅
- 274 tests passing

**Environment Variables (CI):**
```bash
DJANGO_SECRET_KEY=test-secret-key
DJANGO_DEBUG=False
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=/tmp/test_db.sqlite3
```

### 2. Frontend CI (`frontend-ci.yml`)

**Triggers:**
- Push to `frontend/**` or workflow file
- Pull requests to `frontend/**` or workflow file

**Jobs:**

#### Build
- Sets up Node.js 20
- Installs dependencies with `npm ci`
- Runs ESLint for code quality
- Runs Vitest tests
- Builds production bundle with Vite
- Uploads build artifacts

**Requirements:**
- Node.js 20
- All dependencies from `package-lock.json`

### 3. Docker CI (`docker-ci.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Push to tags (e.g., `v1.0.0`)
- Pull requests to main branches

**Jobs:**

#### Validate Docker Compose
- Validates `docker-compose.yml` syntax
- Validates `docker-compose.prod.yml` syntax

#### Build Backend Image
- Builds backend Docker image
- Tests Python and Django installation
- Verifies manage.py is accessible
- Uses Docker Buildx with layer caching

#### Build Frontend Images
- Builds frontend development image (Dockerfile)
- Builds frontend production image (Dockerfile.prod)
- Verifies Node.js installation
- Checks production build outputs
- Uses Docker Buildx with layer caching

#### Test Compose Build
- Creates test `.env` file
- Builds complete development stack
- Builds complete production stack
- Verifies all services build correctly

#### Success Summary
- Confirms all Docker checks passed
- Final gate for Docker CI workflow

## Running Tests Locally

### Backend Tests

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run linter
ruff check .

# Run type checker
mypy .

# Run tests with coverage
pytest tests --cov=. --cov-report=html --cov-report=term

# View coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run linter
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build production bundle
npm run build
```

### Docker Build Tests

```bash
# Validate docker-compose files
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.prod.yml config --quiet

# Build backend image
docker build -t sims-backend:local ./backend

# Test backend image
docker run --rm sims-backend:local python --version
docker run --rm sims-backend:local python manage.py --version

# Build frontend dev image
docker build -t sims-frontend:dev ./frontend -f frontend/Dockerfile

# Build frontend prod image
docker build -t sims-frontend:prod ./frontend -f frontend/Dockerfile.prod \
  --build-arg VITE_API_URL=http://localhost:8000

# Test frontend prod image
docker run --rm sims-frontend:prod ls -la /usr/share/nginx/html
```

## Building and Running with Docker

### Development Environment

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your settings
nano .env  # or your preferred editor

# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Seed demo data (optional)
docker compose exec backend python manage.py seed_demo --students 30

# Stop all services
docker compose down
```

**Access Points:**
- Frontend: http://localhost:5174
- Backend API: http://localhost:8001
- Nginx (proxy): http://localhost:81
- Admin Panel: http://localhost:8001/admin

### Production Environment

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down
```

**Production Access:**
- Application: http://localhost:81
- API: http://localhost:81/api/
- Admin: http://localhost:81/admin/
- Static files: served by nginx

### Rebuilding Services

```bash
# Rebuild specific service
docker compose build backend
docker compose build frontend

# Rebuild all services
docker compose build

# Rebuild without cache
docker compose build --no-cache

# Rebuild and restart
docker compose up -d --build
```

## Environment Variables

### Required for Backend

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=sims_db
DB_USER=sims_user
DB_PASSWORD=your-db-password
DB_HOST=postgres
DB_PORT=5432

# PostgreSQL
POSTGRES_DB=sims_db
POSTGRES_USER=sims_user
POSTGRES_PASSWORD=your-db-password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Required for Frontend

```bash
# API URL for production builds
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Backend CI Failures

**Ruff errors:**
```bash
# Auto-fix formatting issues
ruff check --fix .
```

**Mypy errors:**
- Add type annotations to functions
- Import necessary types from `typing`
- Use modern Python 3.9+ type syntax: `list[str]` instead of `List[str]`

**Test failures:**
- Check test output for specific errors
- Ensure database migrations are up to date
- Verify all fixtures are properly defined

### Frontend CI Failures

**Lint errors:**
```bash
# Auto-fix ESLint issues
npm run lint -- --fix
```

**Build errors:**
- Check for missing dependencies
- Ensure all imports are correct
- Verify TypeScript types

### Docker Build Failures

**Backend build issues:**
- Check Dockerfile syntax
- Verify requirements.txt is valid
- Ensure Python version compatibility

**Frontend build issues:**
- Verify package.json scripts
- Check build-time environment variables
- Ensure all assets are copied correctly

**Compose failures:**
- Validate .env file exists and has required variables
- Check service dependencies
- Verify volume mounts

## CI Status Badges

Current workflow status:

[![Backend CI](https://github.com/munaimtahir/fmu/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/munaimtahir/fmu/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/munaimtahir/fmu/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/munaimtahir/fmu/actions/workflows/frontend-ci.yml)
[![Docker CI](https://github.com/munaimtahir/fmu/actions/workflows/docker-ci.yml/badge.svg)](https://github.com/munaimtahir/fmu/actions/workflows/docker-ci.yml)

## Best Practices

1. **Always run tests locally** before pushing code
2. **Keep coverage above 80%** for backend code
3. **Fix linting errors** before committing
4. **Add type hints** to new Python functions
5. **Test Docker builds** before modifying Dockerfiles
6. **Keep .env.example updated** when adding new variables
7. **Document new environment variables** in this file
8. **Use feature branches** and create pull requests for review

## Continuous Deployment

Currently, the workflows focus on **Continuous Integration** (testing and validation). For production deployment:

1. Workflows validate code quality and builds
2. Docker images can be pushed to a registry (not configured yet)
3. Manual deployment steps are required for production

### Future Enhancements

- Automatic Docker image publishing to registry
- Automated deployment to staging environment
- Kubernetes deployment manifests
- Automated rollback on failure
- Performance testing integration
- Security scanning (SAST/DAST)

## Support

For issues with CI/CD:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Run tests locally to reproduce issues
4. Create an issue in the repository with details

## Maintenance

- **Python dependencies:** Update `requirements.txt` when needed
- **Node dependencies:** Update `package.json` and run `npm update`
- **Docker base images:** Periodically update Python/Node versions
- **GitHub Actions:** Keep actions up to date (currently using v4-v5)
- **Test coverage:** Monitor and maintain above 80%
