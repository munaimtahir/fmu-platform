#!/bin/bash
#
# Pre-Deploy Verification Script
#
# This script must be run before every deployment to verify critical system contracts.
# Exit non-zero on failure.
#
# Usage:
#   ./scripts/pre_deploy_verify.sh [API_BASE_URL]
#
# Environment Variables:
#   API_BASE_URL - Base URL for API (default: http://localhost:8010)
#   STUDENT_USERNAME - Student username for login test (default: student1)
#   STUDENT_PASSWORD - Student password for login test
#   FACULTY_USERNAME - Faculty username for login test (default: faculty1)
#   FACULTY_PASSWORD - Faculty password for login test
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${1:-${API_BASE_URL:-http://localhost:8010}}"
STUDENT_USERNAME="${STUDENT_USERNAME:-student1}"
STUDENT_PASSWORD="${STUDENT_PASSWORD:-}"
FACULTY_USERNAME="${FACULTY_USERNAME:-faculty1}"
FACULTY_PASSWORD="${FACULTY_PASSWORD:-}"

# Track failures
FAILURES=0
WARNINGS=0

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++)) || true
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILURES++)) || true
}

check_http() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    log_info "Checking: $description"
    
    response=$(curl -s -w "\n%{http_code}" "$url" || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        log_info "✓ $description (HTTP $http_code)"
        return 0
    else
        log_error "✗ $description (HTTP $http_code, expected $expected_status)"
        return 1
    fi
}

check_json() {
    local json=$1
    local key=$2
    local description=$3
    
    if echo "$json" | grep -q "\"$key\""; then
        log_info "✓ $description (found key: $key)"
        return 0
    else
        log_error "✗ $description (missing key: $key)"
        return 1
    fi
}

# Main verification
main() {
    echo "=========================================="
    echo "Pre-Deploy Verification"
    echo "=========================================="
    echo "API Base URL: $API_BASE_URL"
    echo ""
    
    # 1. Health Endpoint Checks
    echo "--- Health Endpoint Checks ---"
    check_http "$API_BASE_URL/health/" 200 "Health endpoint (/health/)"
    check_http "$API_BASE_URL/healthz/" 200 "Health endpoint (/healthz/)"
    check_http "$API_BASE_URL/api/health/" 200 "Health endpoint (/api/health/)"
    
    # Verify health response structure
    health_response=$(curl -s "$API_BASE_URL/health/")
    check_json "$health_response" "status" "Health response has 'status' field"
    check_json "$health_response" "service" "Health response has 'service' field"
    
    echo ""
    
    # 2. Login Test
    echo "--- Login Test ---"
    if [ -z "$STUDENT_PASSWORD" ]; then
        log_warn "STUDENT_PASSWORD not set, skipping login test"
    else
        login_response=$(curl -s -X POST "$API_BASE_URL/api/auth/login/" \
            -H "Content-Type: application/json" \
            -d "{\"identifier\":\"$STUDENT_USERNAME\",\"password\":\"$STUDENT_PASSWORD\"}" || echo "")
        
        if echo "$login_response" | grep -q "\"access\"" || echo "$login_response" | grep -q "\"tokens\""; then
            log_info "✓ Student login successful"
            STUDENT_TOKEN=$(echo "$login_response" | grep -o '"access":"[^"]*' | cut -d'"' -f4 || echo "")
        else
            log_error "✗ Student login failed"
            echo "Response: $login_response"
        fi
    fi
    
    echo ""
    
    # 3. Student Endpoint Test
    echo "--- Student Endpoint Test ---"
    if [ -n "${STUDENT_TOKEN:-}" ]; then
        student_response=$(curl -s -X GET "$API_BASE_URL/api/attendance/" \
            -H "Authorization: Bearer $STUDENT_TOKEN" || echo "")
        
        if echo "$student_response" | grep -q "\"results\"" || echo "$student_response" | grep -q "\[\]"; then
            log_info "✓ Student endpoint accessible (GET /api/attendance/)"
        else
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/api/attendance/" \
                -H "Authorization: Bearer $STUDENT_TOKEN" || echo "000")
            if [ "$http_code" = "200" ]; then
                log_info "✓ Student endpoint accessible (HTTP 200)"
            else
                log_error "✗ Student endpoint failed (HTTP $http_code)"
            fi
        fi
    else
        log_warn "Student token not available, skipping student endpoint test"
    fi
    
    echo ""
    
    # 4. Faculty Endpoint Test
    echo "--- Faculty Endpoint Test ---"
    if [ -z "$FACULTY_PASSWORD" ]; then
        log_warn "FACULTY_PASSWORD not set, skipping faculty login test"
    else
        faculty_login_response=$(curl -s -X POST "$API_BASE_URL/api/auth/login/" \
            -H "Content-Type: application/json" \
            -d "{\"identifier\":\"$FACULTY_USERNAME\",\"password\":\"$FACULTY_PASSWORD\"}" || echo "")
        
        if echo "$faculty_login_response" | grep -q "\"access\"" || echo "$faculty_login_response" | grep -q "\"tokens\""; then
            log_info "✓ Faculty login successful"
            FACULTY_TOKEN=$(echo "$faculty_login_response" | grep -o '"access":"[^"]*' | cut -d'"' -f4 || echo "")
            
            if [ -n "${FACULTY_TOKEN:-}" ]; then
                faculty_response=$(curl -s -X GET "$API_BASE_URL/api/sections/" \
                    -H "Authorization: Bearer $FACULTY_TOKEN" || echo "")
                
                http_code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/api/sections/" \
                    -H "Authorization: Bearer $FACULTY_TOKEN" || echo "000")
                
                if [ "$http_code" = "200" ]; then
                    log_info "✓ Faculty endpoint accessible (GET /api/sections/)"
                else
                    log_error "✗ Faculty endpoint failed (HTTP $http_code)"
                fi
            fi
        else
            log_error "✗ Faculty login failed"
            echo "Response: $faculty_login_response"
        fi
    fi
    
    echo ""
    
    # 5. No /api/api/ Bug Check
    echo "--- API Path Check ---"
    # Check if API base URL doesn't result in /api/api/
    if echo "$API_BASE_URL" | grep -q "/api$"; then
        log_error "✗ API_BASE_URL ends with /api (will cause /api/api/ bug)"
        log_error "  API_BASE_URL should be '/' or 'http://host:port', not 'http://host:port/api'"
    else
        log_info "✓ API base URL configuration correct (no /api/api/ bug)"
    fi
    
    echo ""
    
    # 6. Backend Localhost Binding Check (if running locally)
    echo "--- Backend Security Check ---"
    if echo "$API_BASE_URL" | grep -q "localhost\|127.0.0.1"; then
        log_info "✓ Backend appears to be bound to localhost (good for security)"
    else
        log_warn "Backend URL is not localhost - verify backend is bound to 127.0.0.1 in production"
    fi
    
    echo ""
    
    # Summary
    echo "=========================================="
    echo "Verification Summary"
    echo "=========================================="
    echo "Failures: $FAILURES"
    echo "Warnings: $WARNINGS"
    echo ""
    
    if [ $FAILURES -gt 0 ]; then
        log_error "Verification FAILED - $FAILURES error(s) found"
        echo ""
        echo "Fix the errors above before deploying."
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        log_warn "Verification PASSED with $WARNINGS warning(s)"
        echo ""
        echo "Review warnings above before deploying."
        exit 0
    else
        log_info "Verification PASSED - All checks successful"
        echo ""
        exit 0
    fi
}

# Run main function
main "$@"
