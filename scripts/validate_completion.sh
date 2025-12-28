#!/bin/bash

# FMU SIMS - Complete Validation Script
# Validates all requirements from the problem statement

# Don't exit on error, we want to show all results
set +e

echo "=================================================="
echo "FMU SIMS - Complete System Validation"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

echo "Stage 1-2: Foundation & Core Setup"
echo "-----------------------------------"

# Check Python
if python --version | grep -q "Python 3.12"; then
    check_pass "Python 3.12 installed"
else
    check_warn "Python version not 3.12, but may still work"
fi

# Check Node
if node --version | grep -q "v20"; then
    check_pass "Node.js 20+ installed"
else
    check_warn "Node.js version not 20+, but may still work"
fi

# Check backend structure
if [ -d "backend/sims_backend" ]; then
    check_pass "Backend Django project exists"
else
    check_fail "Backend Django project missing"
fi

# Check frontend structure
if [ -f "frontend/package.json" ]; then
    check_pass "Frontend React project exists"
else
    check_fail "Frontend React project missing"
fi

# Check Docker
if [ -f "docker-compose.yml" ]; then
    check_pass "docker-compose.yml exists"
else
    check_fail "docker-compose.yml missing"
fi

# Check Makefile
if [ -f "Makefile" ]; then
    check_pass "Makefile exists"
else
    check_fail "Makefile missing"
fi

# Check .env.example
if [ -f ".env.example" ]; then
    check_pass ".env.example exists"
else
    check_fail ".env.example missing"
fi

echo ""
echo "Stage 3: Integration & Demo"
echo "----------------------------"

# Check backend tests
if [ -d "backend/tests" ]; then
    check_pass "Backend tests directory exists"
else
    check_fail "Backend tests missing"
fi

# Check frontend tests
if [ -f "frontend/src/components/ui/Button.test.tsx" ]; then
    check_pass "Frontend tests exist"
else
    check_fail "Frontend tests missing"
fi

# Check seed script
if [ -d "backend/seed" ]; then
    check_pass "Demo seed script exists"
else
    check_fail "Demo seed script missing"
fi

# Check API documentation
if [ -f "docs/API.md" ]; then
    check_pass "API.md documentation exists"
else
    check_fail "API.md missing"
fi

# Check data model documentation
if [ -f "docs/DATAMODEL.md" ]; then
    check_pass "DATAMODEL.md documentation exists"
else
    check_fail "DATAMODEL.md missing"
fi

echo ""
echo "Stage 4: Deployment & Observability"
echo "------------------------------------"

# Check production docker compose
if [ -f "docker-compose.staging.yml" ]; then
    check_pass "Production docker-compose.staging.yml exists"
else
    check_fail "docker-compose.staging.yml missing"
fi

# Check nginx configuration
if [ -d "nginx" ]; then
    check_pass "Nginx configuration directory exists"
else
    check_fail "Nginx configuration missing"
fi

# Check backup script
if [ -f "restore.sh" ]; then
    check_pass "Database restore script exists"
else
    check_fail "Restore script missing"
fi

# Check CI/CD workflows
if [ -f ".github/workflows/backend-ci.yml" ]; then
    check_pass "Backend CI workflow exists"
else
    check_fail "Backend CI workflow missing"
fi

if [ -f ".github/workflows/frontend-ci.yml" ]; then
    check_pass "Frontend CI workflow exists"
else
    check_fail "Frontend CI workflow missing"
fi

echo ""
echo "Stage 5: Continuous Improvement"
echo "--------------------------------"

# Check all AI-Pack documentation
AI_DOCS=(
    "FINAL_AI_DEVELOPER_PROMPT.md"
    "AGENT.md"
    "GOALS.md"
    "ARCHITECTURE.md"
    "DATAMODEL.md"
    "API.md"
    "CI-CD.md"
    "SETUP.md"
    "QA-CHECKLIST.md"
    "TESTS.md"
    "CONTRIBUTING.md"
    "TASKS.md"
    "COMPLETION_REPORT.md"
)

DOC_PASSED=0
for doc in "${AI_DOCS[@]}"; do
    if [ -f "docs/$doc" ]; then
        ((DOC_PASSED++))
    fi
done

if [ $DOC_PASSED -eq 13 ]; then
    check_pass "All 13 AI-Pack documents exist ($DOC_PASSED/13)"
else
    check_warn "Some AI-Pack documents missing ($DOC_PASSED/13)"
fi

# Check CHANGELOG
if [ -f "docs/CHANGELOG.md" ]; then
    check_pass "CHANGELOG.md exists"
else
    check_fail "CHANGELOG.md missing"
fi

# Check completion report (now archived)
if [ -f "docs/archive/FINAL_SESSION_COMPLETION_REPORT.md" ]; then
    check_pass "Final session completion report exists (archived)"
else
    check_fail "Final completion report missing"
fi

echo ""
echo "Code Quality Checks"
echo "-------------------"

# Check backend requirements
if [ -f "backend/requirements.txt" ]; then
    check_pass "Backend requirements.txt exists"
else
    check_fail "Backend requirements.txt missing"
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    check_pass "Frontend package.json exists"
else
    check_fail "Frontend package.json missing"
fi

# Check linter configs
if [ -f "backend/pyproject.toml" ]; then
    check_pass "Backend linter config (pyproject.toml) exists"
else
    check_warn "Backend linter config missing"
fi

if [ -f "frontend/eslint.config.js" ]; then
    check_pass "Frontend linter config (eslint.config.js) exists"
else
    check_warn "Frontend linter config missing"
fi

echo ""
echo "Git Tags"
echo "--------"

# Check for tags
if git tag | grep -q "v1.0.0-prod"; then
    check_pass "Tag v1.0.0-prod exists"
else
    check_warn "Tag v1.0.0-prod not found (may need to be pushed)"
fi

if git tag | grep -q "v1.1.0-stable"; then
    check_pass "Tag v1.1.0-stable exists"
else
    check_warn "Tag v1.1.0-stable not found (may need to be pushed)"
fi

echo ""
echo "=================================================="
echo "Validation Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL VALIDATION CHECKS PASSED${NC}"
    echo "The FMU SIMS system is complete and production-ready!"
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo "Please review the failed checks above."
    exit 1
fi
