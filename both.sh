#!/bin/bash
# FMU Platform - Full Stack Deployment Script
# This script deploys both frontend and backend changes:
# 1. Stops both frontend and backend services
# 2. Rebuilds both containers without cache
# 3. Restarts both services
# 4. Runs migrations and collects static files
# 5. Verifies deployment

set -e  # Exit on error

cd "$(dirname "$0")"

echo "=========================================="
echo "FMU Platform - Full Stack Deployment"
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
echo -e "${BLUE}Step 2: Rebuilding containers (no cache)...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml build --no-cache frontend backend
echo -e "${GREEN}✓ Images built successfully${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting services...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml up -d frontend backend
echo -e "${GREEN}✓ Services restarted${NC}"

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

# Check if frontend container is running
if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_frontend_prod.*Up"; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.prod.yml logs frontend"
    exit 1
fi

# Test backend health endpoint
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8010/api/health/ || echo "error")
if echo "$HEALTH_RESPONSE" | grep -q '"status"'; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API health check inconclusive (this is okay if container just started)${NC}"
fi

# Test frontend endpoint
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/ || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "304" ]; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check inconclusive (HTTP $FRONTEND_RESPONSE)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Full Stack Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f docker-compose.prod.yml ps frontend backend
echo ""
echo "Local URLs:"
echo "  - Frontend: http://127.0.0.1:8080"
echo "  - Backend API: http://127.0.0.1:8010"
echo ""
echo "Public URLs:"
echo "  - Frontend: https://sims.alshifalab.pk/"
echo "  - Backend API: https://sims.alshifalab.pk/api/"
echo "  - Admin Panel: https://sims.alshifalab.pk/admin/"
echo "  - Server IP: http://34.16.82.13/"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  Check status: docker compose -f docker-compose.prod.yml ps"
echo "  Test backend: curl http://127.0.0.1:8010/api/health/"
echo "  Test frontend: curl -I http://127.0.0.1:8080/"
echo ""
