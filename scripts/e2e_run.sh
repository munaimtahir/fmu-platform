#!/bin/bash
# E2E Test Runner for FMU Platform
# Bootstraps the stack, waits for readiness, and runs Playwright tests
#
# Usage:
#   ./scripts/e2e_run.sh                    # Uses default BASE_URL
#   BASE_URL=http://localhost:81 ./scripts/e2e_run.sh
#   E2E_START_DOCKER=1 ./scripts/e2e_run.sh  # Starts docker compose automatically

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8080}"
E2E_START_DOCKER="${E2E_START_DOCKER:-0}"
E2E_SEED="${E2E_SEED:-0}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-${BASE_URL}/api/health/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-2}"

# Helper functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if docker compose is available
check_docker_compose() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
}

# Start docker compose if requested
start_docker_compose() {
    if [ "${E2E_START_DOCKER}" = "1" ]; then
        print_info "Starting docker compose services..."
        
        # Determine compose command
        if command -v docker compose &> /dev/null; then
            COMPOSE_CMD="docker compose"
        else
            COMPOSE_CMD="docker-compose"
        fi
        
        # Build and start services
        ${COMPOSE_CMD} up -d --build
        
        print_info "Waiting for services to be ready (10 seconds)..."
        sleep 10
        
        print_success "Docker compose services started"
    else
        print_info "Skipping docker compose startup (set E2E_START_DOCKER=1 to enable)"
    fi
}

# Wait for health endpoint to be ready
wait_for_readiness() {
    print_info "Waiting for readiness endpoint: ${HEALTH_ENDPOINT}"
    print_info "Timeout: ${HEALTH_TIMEOUT}s, Interval: ${HEALTH_INTERVAL}s"
    
    local elapsed=0
    local max_attempts=$((HEALTH_TIMEOUT / HEALTH_INTERVAL))
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))
        elapsed=$((attempt * HEALTH_INTERVAL))
        
        # Check health endpoint
        if curl -sf "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
            # Verify response structure
            health_response=$(curl -sf "${HEALTH_ENDPOINT}" 2>/dev/null || echo "")
            
            if [ -z "${health_response}" ]; then
                print_warning "Health endpoint returned empty response (attempt ${attempt}/${max_attempts})"
                sleep "${HEALTH_INTERVAL}"
                continue
            fi
            
            # Check if jq is available for JSON parsing
            if command -v jq &> /dev/null; then
                db_status=$(echo "${health_response}" | jq -r '.checks.db.status // "unknown"')
                migrations_status=$(echo "${health_response}" | jq -r '.checks.migrations.status // "unknown"')
                
                if [ "${db_status}" = "ok" ] && [ "${migrations_status}" = "ok" ]; then
                    print_success "Service is ready! (attempt ${attempt}/${max_attempts}, elapsed: ${elapsed}s)"
                    echo "${health_response}" | jq '.'
                    return 0
                else
                    print_warning "Service not ready yet - DB: ${db_status}, Migrations: ${migrations_status} (attempt ${attempt}/${max_attempts})"
                fi
            else
                # Fallback: just check if we get a response
                if echo "${health_response}" | grep -q '"status"'; then
                    print_success "Service is ready! (attempt ${attempt}/${max_attempts}, elapsed: ${elapsed}s)"
                    echo "${health_response}"
                    return 0
                fi
            fi
        else
            print_warning "Health endpoint not reachable (attempt ${attempt}/${max_attempts}, elapsed: ${elapsed}s)"
        fi
        
        sleep "${HEALTH_INTERVAL}"
    done
    
    print_error "Timeout waiting for readiness after ${HEALTH_TIMEOUT}s"
    print_error "Showing recent logs for debugging:"
    
    # Show recent logs if docker compose is running
    if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
        COMPOSE_CMD=$(command -v docker compose 2>/dev/null || command -v docker-compose)
        print_error "Docker compose logs:"
        ${COMPOSE_CMD} logs backend frontend --tail=200 2>/dev/null || true
    fi
    
    exit 1
}

# Seed demo data if requested
seed_demo_data() {
    if [ "${E2E_SEED}" = "1" ]; then
        print_info "Seeding demo data..."
        
        # Determine compose command
        if command -v docker compose &> /dev/null; then
            COMPOSE_CMD="docker compose"
        else
            COMPOSE_CMD="docker-compose"
        fi
        
        # Run seed command
        if ${COMPOSE_CMD} exec -T backend python manage.py seed_demo_scenarios --students 20 2>/dev/null; then
            print_success "Demo data seeded successfully"
        else
            print_warning "Failed to seed demo data (continuing anyway)"
        fi
    else
        print_info "Skipping demo data seeding (set E2E_SEED=1 to enable)"
    fi
}

# Run Playwright tests
run_playwright_tests() {
    print_info "Running Playwright E2E tests..."
    print_info "BASE_URL: ${BASE_URL}"
    
    # Change to frontend directory
    cd frontend || {
        print_error "frontend directory not found"
        exit 1
    }
    
    # Check if Playwright is installed
    if [ ! -d "node_modules/@playwright" ]; then
        print_info "Playwright not installed, installing dependencies..."
        npm ci
    fi
    
    # Set environment variable for Playwright
    export PLAYWRIGHT_BASE_URL="${BASE_URL}"
    
    # Run Playwright tests
    if npx playwright test; then
        print_success "Playwright tests passed!"
        cd ..
        return 0
    else
        print_error "Playwright tests failed!"
        cd ..
        exit 1
    fi
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "  FMU Platform E2E Test Runner"
    echo "========================================"
    echo "BASE_URL: ${BASE_URL}"
    echo "E2E_START_DOCKER: ${E2E_START_DOCKER}"
    echo "E2E_SEED: ${E2E_SEED}"
    echo "HEALTH_ENDPOINT: ${HEALTH_ENDPOINT}"
    echo ""
    
    # Pre-flight checks
    check_docker_compose
    
    # Start docker compose if requested
    start_docker_compose
    
    # Wait for readiness
    wait_for_readiness
    
    # Seed demo data if requested
    seed_demo_data
    
    # Run Playwright tests
    run_playwright_tests
    
    print_success "E2E test run completed successfully!"
}

# Run main function
main "$@"