#!/bin/bash
# FMU Platform - Smoke Test Script
# Tests key endpoints to verify system health after recovery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${API_URL:-http://localhost:8010}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password}"

# Counters
PASSED=0
FAILED=0

echo "======================================"
echo "FMU Platform Smoke Test"
echo "======================================"
echo "Base URL: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local auth=$4
    local expected_code=$5
    
    echo -n "Testing $name... "
    
    if [ -z "$auth" ]; then
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" -o /dev/null)
    else
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $auth" -o /dev/null)
    fi
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
    fi
}

# Function to test endpoint with JSON response
test_endpoint_json() {
    local name=$1
    local method=$2
    local endpoint=$3
    local auth=$4
    local expected_code=$5
    
    echo -n "Testing $name... "
    
    if [ -z "$auth" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $auth")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "=== Phase 1: Core Health ==="
test_endpoint "Health Check" GET "/health/" "" "200"
test_endpoint "API Health" GET "/api/health/" "" "200"
echo ""

echo "=== Phase 2: Authentication ==="
echo -n "Logging in... "
login_response=$(curl -s -X POST "$BASE_URL/api/auth/login/" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" 2>&1)

if echo "$login_response" | grep -q "access"; then
    TOKEN=$(echo "$login_response" | grep -o '"access":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Login failed. Please create superuser or check credentials."
    echo "Response: $login_response"
    ((FAILED++))
    TOKEN=""
fi
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}WARNING: No auth token. Skipping authenticated tests.${NC}"
    echo ""
else
    echo "=== Phase 3: API Endpoints (Read-Only) ==="
    test_endpoint "Programs List" GET "/api/academics/programs/" "$TOKEN" "200"
    test_endpoint "Batches List" GET "/api/academics/batches/" "$TOKEN" "200"
    test_endpoint "Groups List" GET "/api/academics/groups/" "$TOKEN" "200"
    test_endpoint "Departments List" GET "/api/academics/departments/" "$TOKEN" "200"
    test_endpoint "Students List" GET "/api/students/" "$TOKEN" "200"
    test_endpoint "People List" GET "/api/people/persons/" "$TOKEN" "200"
    test_endpoint "Attendance List" GET "/api/attendance/" "$TOKEN" "200"
    test_endpoint "Exams List" GET "/api/exams/" "$TOKEN" "200"
    test_endpoint "Results List" GET "/api/results/" "$TOKEN" "200"
    test_endpoint "Finance Vouchers" GET "/api/finance/vouchers/" "$TOKEN" "200"
    echo ""
    
    echo "=== Phase 4: New Endpoints (Schema Verification) ==="
    test_endpoint "Academic Periods" GET "/api/academics/periods/" "$TOKEN" "200"
    test_endpoint "Tracks" GET "/api/academics/tracks/" "$TOKEN" "200"
    test_endpoint "Learning Blocks" GET "/api/academics/blocks/" "$TOKEN" "200"
    test_endpoint "Modules" GET "/api/academics/modules/" "$TOKEN" "200"
    test_endpoint "Leave Periods" GET "/api/leave-periods/" "$TOKEN" "200"
    echo ""
    
    echo "=== Phase 5: Create Test (Programs) ==="
    echo -n "Creating test program... "
    create_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/academics/programs/" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Smoke Test Program","structure_type":"YEARLY","is_active":true}')
    
    http_code=$(echo "$create_response" | tail -n1)
    body=$(echo "$create_response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        PROGRAM_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        echo -e "${GREEN}✓ PASS${NC} (Created program ID: $PROGRAM_ID)"
        ((PASSED++))
        
        # Verify structure_type field exists in response
        if echo "$body" | grep -q "structure_type"; then
            echo -e "  ${GREEN}✓${NC} structure_type field present in response"
            ((PASSED++))
        else
            echo -e "  ${RED}✗${NC} structure_type field MISSING in response"
            ((FAILED++))
        fi
        
        # Clean up: delete test program
        echo -n "Cleaning up test program... "
        delete_code=$(curl -s -w "%{http_code}" -X DELETE \
            "$BASE_URL/api/academics/programs/$PROGRAM_ID/" \
            -H "Authorization: Bearer $TOKEN" -o /dev/null)
        
        if [ "$delete_code" = "204" ]; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASSED++))
        else
            echo -e "${YELLOW}WARNING${NC} (Got $delete_code, expected 204)"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected 201, got $http_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
    echo ""
fi

echo "=== Phase 6: Schema Verification (Database) ==="
if command -v docker &> /dev/null && [ -f docker-compose.yml ]; then
    echo -n "Checking students_student.person_id... "
    person_check=$(docker compose exec -T backend python manage.py dbshell <<EOF 2>&1
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students_student' AND column_name = 'person_id';
\q
EOF
)
    
    if echo "$person_check" | grep -q "person_id"; then
        echo -e "${GREEN}✓ PASS${NC} (Column exists)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Column missing)"
        ((FAILED++))
    fi
    
    echo -n "Checking academics_program.structure_type... "
    structure_check=$(docker compose exec -T backend python manage.py dbshell <<EOF 2>&1
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'academics_program' AND column_name = 'structure_type';
\q
EOF
)
    
    if echo "$structure_check" | grep -q "structure_type"; then
        echo -e "${GREEN}✓ PASS${NC} (Column exists)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Column missing)"
        ((FAILED++))
    fi
    
    echo -n "Checking people_person table... "
    people_check=$(docker compose exec -T backend python manage.py dbshell <<EOF 2>&1
SELECT COUNT(*) FROM people_person;
\q
EOF
)
    
    if echo "$people_check" | grep -qE "[0-9]+"; then
        echo -e "${GREEN}✓ PASS${NC} (Table exists)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Table missing)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}SKIPPED${NC} (Docker not available or not in project root)"
fi
echo ""

echo "======================================"
echo "Smoke Test Results"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo "System is healthy and ready for use."
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review the failures above and check:"
    echo "  1. Are migrations applied? (docker compose exec backend python manage.py migrate)"
    echo "  2. Is the database accessible?"
    echo "  3. Are credentials correct?"
    echo "  4. Check backend logs for errors"
    exit 1
fi
