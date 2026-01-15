#!/bin/bash
# FMU Platform - Frontend Deployment Script
# This script deploys frontend-only changes:
# 1. Stops frontend service
# 2. Rebuilds frontend container without cache
# 3. Restarts frontend service
# 4. Verifies deployment

set -e  # Exit on error

cd "$(dirname "$0")"

echo "=========================================="
echo "FMU Platform - Frontend Deployment"
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

echo -e "${BLUE}Step 1: Stopping frontend service...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml stop frontend
echo -e "${GREEN}✓ Frontend service stopped${NC}"

echo ""
echo -e "${BLUE}Step 2: Rebuilding frontend container (no cache)...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml build --no-cache frontend
echo -e "${GREEN}✓ Frontend image built successfully${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting frontend service...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml up -d frontend
echo -e "${GREEN}✓ Frontend service restarted${NC}"

echo ""
echo -e "${BLUE}Step 4: Waiting for service to be ready...${NC}"
echo "-----------------------------------"
sleep 5

echo ""
echo -e "${BLUE}Step 5: Verifying deployment...${NC}"
echo "-----------------------------------"

# Check if frontend container is running
if docker compose -f docker-compose.prod.yml ps | grep -q "fmu_frontend_prod.*Up"; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.prod.yml logs frontend"
    exit 1
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
echo -e "${GREEN}✅ Frontend Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f docker-compose.prod.yml ps frontend
echo ""
echo "Frontend URL: http://127.0.0.1:8080"
echo "Public URLs:"
echo "  - https://sims.alshifalab.pk/"
echo "  - http://34.16.82.13/"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View logs: docker compose -f docker-compose.prod.yml logs -f frontend"
echo "  Check status: docker compose -f docker-compose.prod.yml ps frontend"
echo "  Test frontend: curl -I http://127.0.0.1:8080/"
echo ""
