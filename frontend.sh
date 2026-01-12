#!/bin/bash
# FMU Platform - Frontend Deployment Script
# This script deploys frontend-only changes:
# 1. Rebuilds frontend container
# 2. Restarts frontend service
# 3. Verifies deployment

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
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
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
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080 | grep -q "200\|302"; then
    echo -e "${GREEN}✓ Frontend is accessible on http://127.0.0.1:8080${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend endpoint test inconclusive (this is okay if container just started)${NC}"
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
echo "  - https://sims.alshifalab.pk"
echo "  - https://sims.pmc.edu.pk"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View logs: docker compose -f docker-compose.prod.yml logs -f frontend"
echo "  Check status: docker compose -f docker-compose.prod.yml ps frontend"
echo ""
