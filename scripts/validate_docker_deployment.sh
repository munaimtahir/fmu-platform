#!/bin/bash

# Docker Deployment Validation Script
# Validates all Docker configurations before deployment

# Don't exit on error - we want to check everything
set +e

echo "=================================="
echo "Docker Deployment Validation"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check() {
    local exit_code=$1
    local message=$2
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $message${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $message${NC}"
        ((FAILED++))
    fi
}

echo "1. Checking Docker installation..."
docker --version > /dev/null 2>&1
check $? "Docker is installed"

docker compose version > /dev/null 2>&1
check $? "Docker Compose is installed"

echo ""
echo "2. Checking required files..."

# Docker files
test -f backend/Dockerfile
check $? "backend/Dockerfile exists"

test -f backend/.dockerignore
check $? "backend/.dockerignore exists"

test -f frontend/Dockerfile
check $? "frontend/Dockerfile exists"

test -f frontend/Dockerfile.prod
check $? "frontend/Dockerfile.prod exists"

test -f frontend/.dockerignore
check $? "frontend/.dockerignore exists"

# Docker Compose files
test -f docker-compose.yml
check $? "docker-compose.yml exists"

test -f docker-compose.prod.yml
check $? "docker-compose.prod.yml exists"

test -f docker-compose.staging.yml
check $? "docker-compose.staging.yml exists"

# nginx files (optional - not used in Caddy-based deployment)
# Note: These checks are warnings, not failures, as nginx is not used in current deployment
if [ -f "nginx/nginx.conf" ]; then
    echo -e "${GREEN}✅ nginx/nginx.conf exists (optional)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  nginx/nginx.conf not found (optional, not used in Caddy deployment)${NC}"
fi

if [ -f "nginx/nginx.staging.conf" ]; then
    echo -e "${GREEN}✅ nginx/nginx.staging.conf exists (optional)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  nginx/nginx.staging.conf not found (optional, not used in Caddy deployment)${NC}"
fi

if [ -f "nginx/conf.d/default.conf" ]; then
    echo -e "${GREEN}✅ nginx/conf.d/default.conf exists (optional)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  nginx/conf.d/default.conf not found (optional, not used in Caddy deployment)${NC}"
fi

if [ -f "nginx/conf.d/production.conf" ]; then
    echo -e "${GREEN}✅ nginx/conf.d/production.conf exists (optional)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  nginx/conf.d/production.conf not found (optional, not used in Caddy deployment)${NC}"
fi

# Environment file
test -f .env.example
check $? ".env.example exists"

echo ""
echo "3. Validating Docker Compose configurations..."

# Create temporary .env if it doesn't exist for validation
TEMP_ENV_CREATED=false
if [ ! -f .env ]; then
    cp .env.example .env
    TEMP_ENV_CREATED=true
    echo -e "${YELLOW}⚠️  Created temporary .env from .env.example for validation${NC}"
fi

docker compose -f docker-compose.yml config --quiet 2>&1
check $? "docker-compose.yml is valid"

docker compose -f docker-compose.prod.yml config --quiet 2>&1
check $? "docker-compose.prod.yml is valid"

docker compose -f docker-compose.staging.yml config --quiet 2>&1
check $? "docker-compose.staging.yml is valid"

# Clean up temporary file
if [ "$TEMP_ENV_CREATED" = true ]; then
    rm .env
    echo -e "${YELLOW}⚠️  Removed temporary .env file${NC}"
fi

echo ""
echo "4. Checking production domain configuration..."

# Check for production domain in .env.example (more relevant than IP for Caddy deployment)
if [ -f ".env.example" ]; then
    if grep -q "sims.alshifalab.pk" .env.example; then
        echo -e "${GREEN}✅ Production domain (sims.alshifalab.pk) found in .env.example${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Production domain not found in .env.example${NC}"
    fi
fi

# Optional: Check nginx config if it exists (for alternative deployments)
if [ -f "nginx/conf.d/production.conf" ]; then
    if grep -q "172.237.71.40" nginx/conf.d/production.conf; then
        echo -e "${GREEN}✅ IP found in nginx/conf.d/production.conf (optional, for alternative deployment)${NC}"
        ((PASSED++))
    fi
fi

echo ""
echo "5. Checking environment configuration..."

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    ((PASSED++))
    
    # Check critical variables
    grep -q "DJANGO_SECRET_KEY" .env
    check $? "DJANGO_SECRET_KEY is defined"
    
    grep -q "DB_PASSWORD" .env
    check $? "DB_PASSWORD is defined"
    
    grep -q "DJANGO_ALLOWED_HOSTS" .env
    check $? "DJANGO_ALLOWED_HOSTS is defined"
else
    echo -e "${YELLOW}⚠️  .env file not found (will need to create from .env.example)${NC}"
fi

echo ""
echo "6. Checking port conflicts..."

# Check if ports are in use
if command -v lsof > /dev/null 2>&1; then
    lsof -i :80 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Port 80 is in use (may need to stop existing service)${NC}"
        ((FAILED++))
    else
        echo -e "${GREEN}✅ Port 80 is available${NC}"
        ((PASSED++))
    fi
    
    lsof -i :81 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Port 81 is in use (may need to stop existing service)${NC}"
        ((FAILED++))
    else
        echo -e "${GREEN}✅ Port 81 is available${NC}"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️  lsof not available, skipping port check${NC}"
fi

echo ""
echo "=================================="
echo "Validation Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure .env file is configured (copy from .env.example)"
    echo "2. Run: docker compose -f docker-compose.prod.yml up -d --build"
    echo "3. Check status: docker compose -f docker-compose.prod.yml ps"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
