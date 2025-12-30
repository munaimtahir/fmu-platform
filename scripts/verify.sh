#!/bin/bash
# FMU Platform Verification Script
# This script runs basic health checks on the repository

# Note: Do not use 'set -e' here; individual checks handle failures via print_status.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "FMU Platform - Repository Verification"
echo "================================================"
echo ""

# Track overall status
ISSUES=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ISSUES=$((ISSUES + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: Python version
echo "Checking Python version..."
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
    MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 11 ]; then
        print_status 0 "Python $PYTHON_VERSION (compatible)"
    else
        print_status 1 "Python $PYTHON_VERSION (requires 3.11+)"
    fi
else
    print_status 1 "Python not found"
fi
echo ""

# Check 2: Required files exist
echo "Checking required files..."
REQUIRED_FILES=(
    "backend/manage.py"
    "backend/requirements.txt"
    "backend/sims_backend/settings.py"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    ".env.example"
    "RUNBOOK.md"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done
echo ""

# Check 3: Environment file
echo "Checking environment configuration..."
if [ -f ".env" ]; then
    print_status 0 ".env file exists"
    
    # Check for required variables
    REQUIRED_VARS=("DJANGO_SECRET_KEY" "POSTGRES_PASSWORD" "DB_PASSWORD")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            print_status 0 "$var is set"
        else
            print_status 1 "$var not set in .env"
        fi
    done
else
    print_warning ".env file not found (copy from .env.example)"
fi
echo ""

# Check 4: Django checks (if dependencies installed)
echo "Running Django system checks..."
if [ -d "backend/venv" ] || command -v django-admin &> /dev/null; then
    cd backend
    if python manage.py check --settings=sims_backend.test_settings 2>&1 | grep -q "no issues"; then
        print_status 0 "Django system checks passed"
    else
        print_status 1 "Django system checks failed"
    fi
    cd ..
else
    print_warning "Django not installed (run: pip install -r backend/requirements.txt)"
fi
echo ""

# Check 5: Migrations exist
echo "Checking migrations..."
MIGRATION_DIRS=(
    "backend/core/migrations"
    "backend/sims_backend/academics/migrations"
    "backend/sims_backend/students/migrations"
    "backend/sims_backend/timetable/migrations"
    "backend/sims_backend/attendance/migrations"
    "backend/sims_backend/exams/migrations"
    "backend/sims_backend/results/migrations"
    "backend/sims_backend/finance/migrations"
    "backend/sims_backend/audit/migrations"
)

for dir in "${MIGRATION_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        # Count migration files (excluding __init__.py and __pycache__)
        MIGRATION_COUNT=$(find "$dir" -name "*.py" ! -name "__init__.py" | wc -l)
        if [ "$MIGRATION_COUNT" -gt 0 ]; then
            print_status 0 "$dir ($MIGRATION_COUNT migrations)"
        else
            print_status 1 "$dir (no migrations found)"
        fi
    else
        print_status 1 "$dir missing"
    fi
done
echo ""

# Check 6: Admin registrations
echo "Checking admin registrations..."
ADMIN_FILES=(
    "backend/core/admin.py"
    "backend/sims_backend/academics/admin.py"
    "backend/sims_backend/students/admin.py"
    "backend/sims_backend/timetable/admin.py"
    "backend/sims_backend/attendance/admin.py"
    "backend/sims_backend/exams/admin.py"
    "backend/sims_backend/results/admin.py"
    "backend/sims_backend/finance/admin.py"
    "backend/sims_backend/audit/admin.py"
)

for file in "${ADMIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "@admin.register" "$file"; then
            print_status 0 "$file (has registrations)"
        else
            print_warning "$file (no @admin.register found)"
        fi
    else
        print_status 1 "$file missing"
    fi
done
echo ""

# Check 7: Docker Compose validation
echo "Checking Docker Compose configuration..."
if command -v docker &> /dev/null; then
    if docker compose -f docker-compose.yml config --quiet 2>&1; then
        print_status 0 "docker-compose.yml is valid"
    else
        print_status 1 "docker-compose.yml is invalid"
    fi
    
    if docker compose -f docker-compose.prod.yml config --quiet 2>&1; then
        print_status 0 "docker-compose.prod.yml is valid"
    else
        print_status 1 "docker-compose.prod.yml is invalid"
    fi
else
    print_warning "Docker not installed (cannot validate compose files)"
fi
echo ""

# Check 8: Git status
echo "Checking Git status..."
if command -v git &> /dev/null; then
    if [ -d ".git" ]; then
        UNCOMMITTED=$(git status --porcelain | wc -l)
        if [ "$UNCOMMITTED" -eq 0 ]; then
            print_status 0 "No uncommitted changes"
        else
            print_warning "$UNCOMMITTED uncommitted changes found"
        fi
    else
        print_warning "Not a Git repository"
    fi
else
    print_warning "Git not installed"
fi
echo ""

# Summary
echo "================================================"
echo "Verification Summary"
echo "================================================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "The repository is ready for deployment."
    exit 0
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Please review the issues above and fix them before deploying."
    echo "See RUNBOOK.md for detailed instructions."
    exit 1
fi
