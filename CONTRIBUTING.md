# Contributing to FMU SIMS

Thank you for contributing to the FMU Student Information Management System! This guide will help you set up your development environment and understand our development workflow.

## Table of Contents

- [Getting Started](#getting-started)
- [Running Tests Locally](#running-tests-locally)
- [Code Quality Tools](#code-quality-tools)
- [Test Naming Conventions](#test-naming-conventions)
- [CI Expectations](#ci-expectations)
- [Pull Request Checklist](#pull-request-checklist)

## Getting Started

### Prerequisites

- Python 3.12
- Node.js 20+
- PostgreSQL 14+ (for local development with database)
- Redis (for background jobs)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/munaimtahir/Fmu.git
   cd Fmu
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Variables**
   
   Copy `.env.example` to `.env` and configure as needed:
   ```bash
   cp .env.example .env
   ```

## Running Tests Locally

### Backend Tests

To run backend tests with the same configuration as CI:

```bash
cd backend

# Set required environment variables
export DJANGO_SECRET_KEY=test-secret-key
export DJANGO_DEBUG=False
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=/tmp/test_db.sqlite3
export DB_HOST=''
export DB_PORT=0

# Run pytest with coverage
pytest tests --cov=. --cov-report=xml --cov-report=html
```

**Quick test command:**
```bash
cd backend
DJANGO_SECRET_KEY=test-secret-key DJANGO_DEBUG=False DB_ENGINE=django.db.backends.sqlite3 DB_NAME=/tmp/test_db.sqlite3 DB_HOST='' DB_PORT=0 pytest tests --cov=. --cov-report=html
```

View coverage report:
```bash
# Open htmlcov/index.html in your browser
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Code Quality Tools

### Backend

**Lint with Ruff:**
```bash
cd backend
ruff check .
```

**Auto-fix linting issues:**
```bash
ruff check . --fix
```

**Type check with mypy:**
```bash
cd backend
export DJANGO_SETTINGS_MODULE=sims_backend.settings
export PYTHONPATH=$(pwd)
mypy .
```

### Frontend

**Lint with ESLint:**
```bash
cd frontend
npm run lint
```

**Auto-fix linting issues:**
```bash
npm run lint -- --fix
```

## Test Naming Conventions

### Backend (Python/pytest)

- **Test files**: Must be named `test_*.py` or `*_test.py`
- **Test directory**: All tests go in `backend/tests/`
- **Test functions**: Must start with `test_`
- **Test classes**: Must start with `Test`

Example:
```python
# backend/tests/test_models.py
def test_user_creation():
    """Test that users can be created."""
    # test code here
    pass

class TestUserModel:
    def test_user_email_validation(self):
        """Test email validation."""
        pass
```

### Frontend (JavaScript/Vitest)

- **Test files**: Must be named `*.test.js`, `*.test.jsx`, `*.test.ts`, or `*.test.tsx`
- **Collocate tests**: Keep test files next to the components they test

## CI Expectations

Our continuous integration pipeline runs the following checks:

### Backend CI (`.github/workflows/backend-ci.yml`)

1. **Ruff Lint**: Code must pass linting with no errors
2. **mypy**: Static type checking must pass
3. **Pytest Suite**: 
   - All tests must pass
   - Coverage reports (XML and HTML) are generated
   - Coverage artifacts are uploaded for review
   - **Minimum expected coverage**: 80% (goal)

### Frontend CI (`.github/workflows/frontend-ci.yml`)

1. **ESLint**: Code must pass linting
2. **Tests**: All tests must pass
3. **Build**: Production build must complete successfully
4. **Minimum expected coverage**: 70% (goal)

### Important Notes

- **No tests collected = CI failure**: If pytest collects zero tests, the CI job will fail with exit code 5. Always ensure at least one test exists.
- **Coverage artifacts**: Both XML and HTML coverage reports are uploaded as workflow artifacts for review.
- All checks must pass before a PR can be merged.

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] **Tests Added/Updated**: 
  - New features include tests
  - Bug fixes include regression tests
  - If tests cannot be written immediately, add a placeholder test with a TODO and create a follow-up issue

- [ ] **Tests Pass Locally**:
  ```bash
  # Backend
  cd backend && pytest tests
  
  # Frontend
  cd frontend && npm test
  ```

- [ ] **Linting Passes**:
  ```bash
  # Backend
  cd backend && ruff check .
  
  # Frontend
  cd frontend && npm run lint
  ```

- [ ] **Type Checking Passes**:
  ```bash
  # Backend
  cd backend && mypy .
  ```

- [ ] **Documentation Updated**:
  - README updated if needed
  - API documentation updated if endpoints changed
  - CHANGELOG updated with your changes

- [ ] **PR Description**:
  - Clear description of changes
  - Link to related issues
  - Screenshots for UI changes
  - Testing instructions for reviewers

- [ ] **Branch Naming**:
  - Use format: `fix/<description>`, `feat/<description>`, or `chore/<description>`
  - Example: `fix/user-login-validation`

- [ ] **Reviewer Tagged**: Request review from appropriate team members

- [ ] **CI Passing**: All GitHub Actions checks are green

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting locally
4. Commit with clear, descriptive messages
5. Push and open a PR
6. Address review feedback
7. Merge once approved and CI passes

## Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the `Docs/` directory for detailed documentation

## Code of Conduct

Please be respectful and professional in all interactions. We're building this project together.

---

Thank you for contributing to FMU SIMS! 🎓
