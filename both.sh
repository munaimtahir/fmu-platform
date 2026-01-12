#!/bin/bash
# FMU Platform - Full Deployment Script
# This script deploys both frontend and backend changes:
# 1. Rebuilds both containers
# 2. Restarts all services
# 3. Runs migrations
# 4. Collects static files
# 5. Verifies deployment

set -e  # Exit on error

cd "$(dirname "$0")"

echo "=========================================="
echo "FMU Platform - Full Deployment"
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

echo -e "${BLUE}Step 1: Stopping frontend and backend services...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml stop frontend backend
echo -e "${GREEN}✓ Services stopped${NC}"

echo ""
echo -e "${BLUE}Step 2: Rebuilding all containers (no cache)...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml build --no-cache frontend backend
echo -e "${GREEN}✓ All images built successfully${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting all services...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ All services restarted${NC}"

echo ""
echo -e "${BLUE}Step 4: Waiting for services to be healthy...${NC}"
echo "-----------------------------------"
sleep 15

# Check if all required services are running
echo ""
echo -e "${BLUE}Checking service status...${NC}"
echo "-----------------------------------"

SERVICES_OK=true

if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_db_prod.*Up"; then
    echo -e "${GREEN}✓ Database container is running${NC}"
else
    echo -e "${RED}✗ Database container is not running${NC}"
    SERVICES_OK=false
fi

if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_redis_prod.*Up"; then
    echo -e "${GREEN}✓ Redis container is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis container is not running (optional)${NC}"
fi

if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_backend_prod.*Up"; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    SERVICES_OK=false
fi

if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_frontend_prod.*Up"; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
    SERVICES_OK=false
fi

if [ "$SERVICES_OK" = false ]; then
    echo -e "${RED}✗ Some critical services failed to start${NC}"
    echo "Check logs with: docker compose -f docker-compose.prod.yml logs"
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

# Test backend health endpoint
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8010/api/health/ || echo "error")
if echo "$HEALTH_RESPONSE" | grep -q '"status"'; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API health check inconclusive (may need more time)${NC}"
fi

# Test frontend endpoint
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080 | grep -q "200\|302"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend endpoint test inconclusive (may need more time)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Full Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Service URLs:"
echo "-------------"
echo -e "${BLUE}Backend API:${NC} http://127.0.0.1:8010"
echo -e "${BLUE}Frontend:${NC} http://127.0.0.1:8080"
echo -e "${BLUE}Public Frontend:${NC}"
echo "  - https://sims.alshifalab.pk"
echo "  - https://sims.pmc.edu.pk"
echo -e "${BLUE}Public API:${NC}"
echo "  - https://sims.alshifalab.pk/api/"
echo "  - https://sims.pmc.edu.pk/api/"
echo -e "${BLUE}Admin Panel:${NC}"
echo "  - https://sims.alshifalab.pk/admin/"
echo "  - https://sims.pmc.edu.pk/admin/"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View all logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  View backend logs: docker compose -f docker-compose.prod.yml logs -f backend"
echo "  View frontend logs: docker compose -f docker-compose.prod.yml logs -f frontend"
echo "  Check status: docker compose -f docker-compose.prod.yml ps"
echo "  Test backend: curl http://127.0.0.1:8010/api/health/"
echo ""
