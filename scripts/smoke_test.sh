#!/bin/bash
# Smoke Test Script for FMU Platform
# Tests key endpoints to verify system is operational

set -e

API_URL="${API_URL:-http://localhost:8010}"
BASE_URL="${BASE_URL:-$API_URL}"

echo "🔍 FMU Platform Smoke Test"
echo "=========================="
echo "API URL: $API_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local auth_token=$5
    
    local url="${API_URL}${endpoint}"
    local headers=()
    
    if [ -n "$auth_token" ]; then
        headers=(-H "Authorization: Bearer $auth_token")
    fi
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" "${headers[@]}" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" "${headers[@]}" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" "${headers[@]}" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_status)"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "1. Health Check Tests"
echo "-------------------"

test_endpoint "GET" "/health" "200" "Health check endpoint"
test_endpoint "GET" "/api/health" "200" "API health check endpoint"

echo ""
echo "2. Schema Verification Tests"
echo "----------------------------"

# Test that we can query Student model without person_id error
echo -n "Testing Student model (person_id column exists)... "
if docker exec fmu_backend python manage.py shell -c "
from sims_backend.students.models import Student
try:
    count = Student.objects.count()
    print('OK')
except Exception as e:
    if 'person_id' in str(e) or 'column' in str(e).lower():
        print('FAIL: ' + str(e))
        exit(1)
    else:
        print('OK')
" 2>&1 | grep -q "OK"; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test that we can query Program model without structure_type error
echo -n "Testing Program model (structure_type column exists)... "
if docker exec fmu_backend python manage.py shell -c "
from sims_backend.academics.models import Program
try:
    count = Program.objects.count()
    p = Program.objects.first()
    if p:
        structure_type = p.structure_type  # This will fail if column missing
    print('OK')
except Exception as e:
    if 'structure_type' in str(e) or 'column' in str(e).lower():
        print('FAIL: ' + str(e))
        exit(1)
    else:
        print('OK')
" 2>&1 | grep -q "OK"; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "3. Admin Interface Tests"
echo "-----------------------"

test_endpoint "GET" "/admin/" "200" "Django admin interface"
test_endpoint "GET" "/admin/academics/program/" "200" "Program admin (should not 500)"
test_endpoint "GET" "/admin/students/student/" "200" "Student admin (should not 500)"

echo ""
echo "4. API Schema Endpoints"
echo "----------------------"

test_endpoint "GET" "/api/schema/" "200" "OpenAPI schema endpoint"
test_endpoint "GET" "/api/docs/" "200" "Swagger UI"

echo ""
echo "Summary"
echo "======="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some smoke tests failed.${NC}"
    exit 1
fi
