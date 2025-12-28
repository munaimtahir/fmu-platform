#!/bin/bash
# Integration test script for FMU SIMS
# Tests backend-frontend connectivity and key endpoints

set -e

echo "==================================="
echo "FMU SIMS Integration Tests"
echo "==================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
    fi
}

# Wait for backend to be ready
echo -e "\n${YELLOW}Waiting for backend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/healthz/ > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start${NC}"
        exit 1
    fi
    sleep 2
done

echo -e "\n${YELLOW}Testing Backend Endpoints${NC}"
echo "-----------------------------------"

# Health checks
test_endpoint "Health Check" "http://localhost:8000/healthz/" "200"
test_endpoint "API Schema" "http://localhost:8000/api/schema/" "200"
test_endpoint "Swagger UI" "http://localhost:8000/api/docs/" "200"

# Auth endpoints (should return 401/400 without credentials)
test_endpoint "Auth Token (no creds)" "http://localhost:8000/api/auth/token/" "400"

# API endpoints (should return 401 without auth)
test_endpoint "Students API (unauthorized)" "http://localhost:8000/api/students/" "401"
test_endpoint "Programs API (unauthorized)" "http://localhost:8000/api/programs/" "401"
test_endpoint "Courses API (unauthorized)" "http://localhost:8000/api/courses/" "401"

# Admin (should redirect to login)
test_endpoint "Admin Panel" "http://localhost:8000/admin/login/" "200"

echo -e "\n${YELLOW}Testing Frontend (if running)${NC}"
echo "-----------------------------------"

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    test_endpoint "Frontend Root" "http://localhost:5173/" "200"
    echo -e "${GREEN}Frontend is accessible${NC}"
else
    echo -e "${YELLOW}Frontend not running on port 5173${NC}"
fi

echo -e "\n==================================="
echo -e "Test Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "==================================="

if [ $FAILED -gt 0 ]; then
    exit 1
fi

exit 0
