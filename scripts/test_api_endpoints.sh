#!/bin/bash

# API Endpoint Integration Test Script
# Tests all critical API endpoints for frontend-backend connectivity

set -e

BASE_URL=${BASE_URL:-"http://localhost:81"}
API_URL="${BASE_URL}/api"

echo "=========================================="
echo "API Endpoint Integration Test"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "API URL: $API_URL"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -n "Testing: $description ... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" -H "Content-Type: application/json")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test helper for authenticated requests
test_authenticated_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local token=$5
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -n "Testing: $description ... "
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "=== Health Check ==="
test_endpoint "GET" "/health" "200" "Health check endpoint"
test_endpoint "GET" "/healthz" "200" "Health check alias endpoint"
echo ""

echo "=== Authentication Endpoints ==="
test_endpoint "POST" "/auth/token/" "400" "Login endpoint (without credentials)" '{}'

# Note: These tests require valid credentials and database setup
echo -e "${YELLOW}Note: Some tests require authentication and seeded data${NC}"
echo ""

echo "=== Public API Endpoints (no auth required) ==="
# These should return 401 or 403 without authentication
test_endpoint "GET" "/students/" "401" "Students list (no auth)"
test_endpoint "GET" "/courses/" "401" "Courses list (no auth)"
test_endpoint "GET" "/sections/" "401" "Sections list (no auth)"
test_endpoint "GET" "/enrollments/" "401" "Enrollments list (no auth)"
test_endpoint "GET" "/attendance/" "401" "Attendance list (no auth)"
test_endpoint "GET" "/assessments/" "401" "Assessments list (no auth)"
test_endpoint "GET" "/assessment-scores/" "401" "Assessment scores list (no auth)"
echo ""

echo "=== Endpoint Path Verification ==="
echo "Verifying that endpoints don't have double /api paths..."

# Test multiple endpoints to ensure no double /api paths exist
DOUBLE_API_ENDPOINTS=(
    "/api/api/students/"
    "/api/api/courses/"
    "/api/api/sections/"
    "/api/api/enrollments/"
    "/api/api/attendance/"
)

for endpoint in "${DOUBLE_API_ENDPOINTS[@]}"; do
    TESTS_RUN=$((TESTS_RUN + 1))
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    if [ "$response" == "404" ]; then
        echo -e "${GREEN}PASS${NC} - $endpoint returns 404 (as expected)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAIL${NC} - $endpoint should return 404 but returned $response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
done

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Tests Run: $TESTS_RUN"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
