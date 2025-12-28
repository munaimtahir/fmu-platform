#!/bin/bash
# Stage 4 Backend Validation Script
# Validates all Definition-of-Done criteria

set -e

echo "=========================================="
echo "Stage 4 Backend Build - Validation Suite"
echo "=========================================="
echo ""

cd backend

# Setup environment
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=:memory:

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

# 1. Django System Checks
run_test "Django system checks" "python manage.py check"

# 2. Ruff Linting
run_test "Ruff linting" "ruff check ."

# 3. Type Checking
run_test "Type checking (mypy)" "mypy . --no-error-summary"

# 4. Migrations Check
run_test "Migrations linear" "python manage.py makemigrations --check --dry-run"

# 5. Test Suite
echo -n "Testing: Full test suite (220 tests)... "
if pytest -q --tb=line 2>&1 | grep -q "220 passed"; then
    echo -e "${GREEN}✓ PASSED (220/220)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# 6. Coverage Check
echo -n "Testing: Coverage ≥85%... "
COVERAGE=$(pytest --cov=. --cov-report=term-missing -q 2>&1 | grep -oP 'TOTAL.*\K[0-9]+(?=%)' | head -1)
if [ "$COVERAGE" -ge 85 ]; then
    echo -e "${GREEN}✓ PASSED (${COVERAGE}%)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED (${COVERAGE}%)${NC}"
    ((FAILED++))
fi

# 7. Module Existence Checks
run_test "Enrollment module" "test -f sims_backend/enrollment/models.py"
run_test "Assessments module" "test -f sims_backend/assessments/models.py"
run_test "Results module" "test -f sims_backend/results/models.py"
run_test "Transcripts module" "test -f sims_backend/transcripts/views.py"
run_test "Requests module" "test -f sims_backend/requests/models.py"
run_test "Audit module" "test -f sims_backend/audit/middleware.py"

# 8. Documentation Checks
cd ..
run_test "API documentation" "test -f docs/API.md"
run_test "Data model documentation" "test -f docs/DATAMODEL.md"
run_test "Setup guide" "test -f docs/SETUP.md"
run_test "Changelog" "test -f docs/CHANGELOG.md"
run_test "Completion summary" "test -f docs/archive/STAGE4_COMPLETION_SUMMARY.md"

# 9. Infrastructure Checks
run_test "Nightly backup workflow" "test -f .github/workflows/nightly-backup.yml"
run_test "Restore script" "test -f restore.sh"
run_test "Docker compose config" "test -f docker-compose.yml"

# 10. Migration Checks
run_test "Term migration" "test -f backend/sims_backend/academics/migrations/0004_term.py"
run_test "Enrollment migration" "test -f backend/sims_backend/enrollment/migrations/0003_enrollment_enrolled_at_enrollment_term.py"
run_test "Results migration" "test -f backend/sims_backend/results/migrations/0003_result_frozen_at_result_frozen_by_result_state_and_more.py"

echo ""
echo "=========================================="
echo "Validation Results"
echo "=========================================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL VALIDATIONS PASSED${NC}"
    echo ""
    echo "Definition of Done: COMPLETE ✅"
    echo "Ready for:"
    echo "  - Merge to main"
    echo "  - Tag: v0.4.0-stage4-backend-mvp"
    echo "  - Production deployment"
    exit 0
else
    echo -e "${RED}✗ SOME VALIDATIONS FAILED${NC}"
    echo ""
    echo "Please review and fix the failed checks."
    exit 1
fi
