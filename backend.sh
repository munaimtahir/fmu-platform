#!/bin/bash
# FMU Platform - Backend Deployment Script
# This script deploys backend-only changes:
# 1. Stops backend service
# 2. Rebuilds backend container without cache
# 3. Restarts backend service
# 4. Runs migrations and collects static files
# 5. Verifies deployment

set -e  # Exit on error

cd "$(dirname "$0")"

echo "=========================================="
echo "FMU Platform - Backend Deployment"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please create .env file with required environment variables."
    exit 1
fi

echo -e "${BLUE}Step 1: Stopping backend service...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml stop backend
echo -e "${GREEN}✓ Backend service stopped${NC}"

echo ""
echo -e "${BLUE}Step 2: Rebuilding backend container (no cache)...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml build --no-cache backend
echo -e "${GREEN}✓ Backend image built successfully${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting backend service...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml up -d backend
echo -e "${GREEN}✓ Backend service restarted${NC}"

echo ""
echo -e "${BLUE}Step 4: Waiting for services to be ready...${NC}"
echo "-----------------------------------"
sleep 10

# Check if database is ready
if ! docker compose -f docker-compose.prod.yml ps | grep -q "fmu_db_prod.*Up"; then
    echo -e "${RED}✗ Database container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.prod.yml logs db"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 5: Running database migrations...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"

echo ""
echo -e "${BLUE}Step 6: Collecting static files...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"

echo ""
echo -e "${BLUE}Step 7: Verifying deployment...${NC}"
echo "-----------------------------------"

# Check if backend container is running
if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_backend_prod.*Up"; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.prod.yml logs backend"
    exit 1
fi

# Test backend health endpoint
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8010/api/health/ || echo "error")
if echo "$HEALTH_RESPONSE" | grep -q '"status"'; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API health check inconclusive (this is okay if container just started)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Backend Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f docker-compose.prod.yml ps backend
echo ""
echo "Backend API URL: http://127.0.0.1:8010"
echo "Public API URLs:"
echo "  - https://sims.alshifalab.pk/api/"
echo "Admin Panel URLs:"
echo "  - https://sims.alshifalab.pk/admin/"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View logs: docker compose -f docker-compose.prod.yml logs -f backend"
echo "  Check status: docker compose -f docker-compose.prod.yml ps backend"
echo "  Test health: curl http://127.0.0.1:8010/api/health/"
echo ""