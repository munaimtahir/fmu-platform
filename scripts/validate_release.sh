#!/bin/bash

# FMU SIMS - Release Validation Script
# This script validates the current state of the repository against release requirements
# Usage: ./validate_release.sh

set -e  # Exit on error

echo "=========================================="
echo "FMU SIMS - Release Validation"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# Phase 1: Backend Verification
echo "Phase 1: Backend Verification"
echo "------------------------------"

# Check if backend directory exists
if [ -d "backend" ]; then
    check_pass "Backend directory exists"
else
    check_fail "Backend directory not found"
fi

# Check if requirements.txt exists
if [ -f "backend/requirements.txt" ]; then
    check_pass "Backend requirements.txt exists"
else
    check_fail "Backend requirements.txt not found"
fi

# Check if manage.py exists
if [ -f "backend/manage.py" ]; then
    check_pass "Django manage.py exists"
else
    check_fail "Django manage.py not found"
fi

# Check critical Django apps
APPS=("academics" "admissions" "enrollment" "attendance" "assessments" "results" "transcripts" "requests" "audit")
for app in "${APPS[@]}"; do
    if [ -d "backend/sims_backend/$app" ]; then
        check_pass "App $app exists"
    else
        check_fail "App $app not found"
    fi
done

# Check if pytest is available and run tests
if [ -f "backend/pytest.ini" ]; then
    check_pass "Pytest configuration exists"
    
    # Try to run backend tests
    echo ""
    echo "Running backend tests..."
    cd backend
    if export DB_ENGINE=django.db.backends.sqlite3 && export DB_NAME=:memory: && python -m pytest tests --cov=. --cov-report=term-missing -q > /tmp/pytest_output.txt 2>&1; then
        COVERAGE=$(grep "TOTAL" /tmp/pytest_output.txt | awk '{print $NF}' | sed 's/%//')
        if [ -n "$COVERAGE" ]; then
            if [ "${COVERAGE%.*}" -ge 80 ]; then
                check_pass "Backend tests pass with ${COVERAGE}% coverage (≥80% required)"
            else
                check_warn "Backend tests pass but coverage is ${COVERAGE}% (<80% required)"
            fi
        else
            check_pass "Backend tests pass (coverage not calculated)"
        fi
    else
        check_fail "Backend tests failed"
    fi
    cd ..
else
    check_warn "Pytest configuration not found"
fi

# Check backend linters
echo ""
echo "Checking backend code quality..."
cd backend 2>/dev/null || true
if command -v ruff &> /dev/null; then
    if ruff check . > /dev/null 2>&1; then
        check_pass "Ruff linter passes"
    else
        check_fail "Ruff linter found issues"
    fi
else
    check_warn "Ruff not installed"
fi

if command -v mypy &> /dev/null; then
    if mypy . > /dev/null 2>&1; then
        check_pass "Mypy type checking passes"
    else
        check_warn "Mypy found type issues"
    fi
else
    check_warn "Mypy not installed"
fi
cd .. 2>/dev/null || true

echo ""
echo "Phase 2: Frontend Verification"
echo "-------------------------------"

# Check if frontend directory exists
if [ -d "frontend" ]; then
    check_pass "Frontend directory exists"
else
    check_fail "Frontend directory not found"
fi

# Check if package.json exists
if [ -f "frontend/package.json" ]; then
    check_pass "Frontend package.json exists"
else
    check_fail "Frontend package.json not found"
fi

# Check if vite.config exists
if [ -f "frontend/vite.config.ts" ] || [ -f "frontend/vite.config.js" ]; then
    check_pass "Vite configuration exists"
else
    check_warn "Vite configuration not found"
fi

# Check frontend tests
if [ -f "frontend/package.json" ]; then
    echo ""
    echo "Running frontend tests..."
    cd frontend
    if npm test -- --run > /tmp/vitest_output.txt 2>&1; then
        TEST_COUNT=$(grep "Test Files" /tmp/vitest_output.txt | grep -oP '\d+ passed' | head -1 | grep -oP '\d+')
        if [ -n "$TEST_COUNT" ]; then
            check_pass "Frontend tests pass (${TEST_COUNT} test files)"
        else
            check_pass "Frontend tests pass"
        fi
    else
        check_fail "Frontend tests failed"
    fi
    cd ..
fi

# Check frontend linter
echo ""
echo "Checking frontend code quality..."
cd frontend 2>/dev/null || true
if [ -f "package.json" ]; then
    if npm run lint > /dev/null 2>&1; then
        check_pass "ESLint passes"
    else
        check_fail "ESLint found issues"
    fi
else
    check_warn "Cannot run frontend lint"
fi
cd .. 2>/dev/null || true

echo ""
echo "Phase 3: Docker & Integration"
echo "------------------------------"

# Check Docker files
if [ -f "docker-compose.yml" ]; then
    check_pass "docker-compose.yml exists"
else
    check_fail "docker-compose.yml not found"
fi

if [ -f "backend/Dockerfile" ]; then
    check_pass "Backend Dockerfile exists"
else
    check_fail "Backend Dockerfile not found"
fi

if [ -f "frontend/Dockerfile" ]; then
    check_pass "Frontend Dockerfile exists"
else
    check_fail "Frontend Dockerfile not found"
fi

# Check nginx configuration (optional - not used in Caddy-based deployment)
if [ -d "nginx" ]; then
    check_pass "Nginx directory exists (optional, not used in Caddy deployment)"
else
    check_warn "Nginx directory not found (optional, not used in Caddy deployment)"
fi

echo ""
echo "Phase 4: Security & Configuration"
echo "----------------------------------"

# Check .env.example exists
if [ -f ".env.example" ]; then
    check_pass ".env.example exists"
else
    check_warn ".env.example not found"
fi

# Check .gitignore excludes .env
if [ -f ".gitignore" ] && grep -q "\.env" .gitignore; then
    check_pass ".gitignore excludes .env files"
else
    check_warn ".gitignore may not exclude .env files"
fi

# Check for hardcoded secrets (basic check)
if git grep -i "secret.*=.*['\"][a-zA-Z0-9]\{20,\}" -- '*.py' '*.js' '*.ts' '*.tsx' > /dev/null 2>&1; then
    check_warn "Possible hardcoded secrets found in code"
else
    check_pass "No obvious hardcoded secrets detected"
fi

echo ""
echo "Phase 5: CI/CD"
echo "--------------"

# Check GitHub Actions workflows
if [ -f ".github/workflows/backend-ci.yml" ]; then
    check_pass "Backend CI workflow exists"
else
    check_warn "Backend CI workflow not found"
fi

if [ -f ".github/workflows/frontend-ci.yml" ]; then
    check_pass "Frontend CI workflow exists"
else
    check_warn "Frontend CI workflow not found"
fi

echo ""
echo "Phase 6: Documentation"
echo "----------------------"

# Check critical documentation files
DOCS=("README.md" "docs/SETUP.md" "docs/ARCHITECTURE.md" "docs/API.md" "docs/CHANGELOG.md" "docs/ACCEPTANCE_CHECKLIST.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc not found"
    fi
done

# Check for autonomous release prompt
if [ -f "docs/AUTONOMOUS_RELEASE_PROMPT.md" ]; then
    check_pass "Autonomous release prompt exists"
else
    check_warn "Autonomous release prompt not found"
fi

echo ""
echo "Phase 7: Release Readiness"
echo "--------------------------"

# Check Makefile
if [ -f "Makefile" ]; then
    check_pass "Makefile exists"
else
    check_warn "Makefile not found"
fi

# Check for seed script
if [ -f "backend/manage.py" ]; then
    cd backend
    if python manage.py help seed_demo > /dev/null 2>&1; then
        check_pass "Demo seed command available"
    else
        check_warn "Demo seed command not found"
    fi
    cd ..
fi

# Check for version tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
if [ "$LATEST_TAG" != "none" ]; then
    check_pass "Version tag exists: $LATEST_TAG"
else
    check_warn "No version tag found (git tag needed for release)"
fi

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "The repository is ready for release."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo "The repository is mostly ready, but some optional items need attention."
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo "Please address the errors before proceeding with release."
    exit 1
fi
