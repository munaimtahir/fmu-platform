#!/bin/bash

# FMU Platform - Fresh Deployment Script
# This script performs a complete fresh deployment:
# 1. Stops and removes all existing containers
# 2. Removes old images
# 3. Removes volumes (fresh database)
# 4. Rebuilds everything from scratch
# 5. Starts services
# 6. Runs migrations
# 7. Collects static files

set -e  # Exit on error

echo "=========================================="
echo "FMU Platform - Fresh Deployment"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please create .env file with required environment variables."
    exit 1
fi

echo -e "${BLUE}Step 1: Stopping and removing existing containers...${NC}"
echo "-----------------------------------"
# Stop and remove containers from both dev and prod compose files
docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
docker compose -f docker-compose.yml down -v 2>/dev/null || true
# Also stop any manually named fmu containers
docker ps -a --filter "name=fmu" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
docker ps -a --filter "name=fmu" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
echo -e "${GREEN}✓ Existing containers stopped and removed${NC}"

echo ""
echo -e "${BLUE}Step 2: Removing old images...${NC}"
echo "-----------------------------------"
# Remove images built from this project
OLD_IMAGES=$(docker images | grep -E "fmu.*backend|fmu.*frontend|fmu-platform" | awk '{print $3}' | sort -u)
if [ -n "$OLD_IMAGES" ]; then
    echo "$OLD_IMAGES" | xargs -r docker rmi -f || true
    echo -e "${GREEN}✓ Old images removed${NC}"
else
    echo -e "${GREEN}✓ No old images to remove${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Pruning Docker system (optional cleanup)...${NC}"
echo "-----------------------------------"
docker system prune -f
echo -e "${GREEN}✓ Docker system pruned${NC}"

echo ""
echo -e "${BLUE}Step 4: Building fresh images...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✓ Images built successfully${NC}"

echo ""
echo -e "${BLUE}Step 5: Starting services...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ Services started${NC}"

echo ""
echo -e "${BLUE}Step 6: Waiting for services to be healthy...${NC}"
echo "-----------------------------------"
sleep 15

# Check if services are running
if ! docker compose -f docker-compose.prod.yml ps | grep -q "fmu_db_prod.*Up"; then
    echo -e "${YELLOW}⚠️  PostgreSQL container not running. Check logs: docker compose -f docker-compose.prod.yml logs db${NC}"
    exit 1
fi

if ! docker compose -f docker-compose.prod.yml ps | grep -q "fmu_backend_prod.*Up"; then
    echo -e "${YELLOW}⚠️  Backend container not running. Check logs: docker compose -f docker-compose.prod.yml logs backend${NC}"
    exit 1
fi

if ! docker compose -f docker-compose.prod.yml ps | grep -q "fmu_frontend_prod.*Up"; then
    echo -e "${YELLOW}⚠️  Frontend container not running. Check logs: docker compose -f docker-compose.prod.yml logs frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All services are running${NC}"

echo ""
echo -e "${BLUE}Step 7: Running database migrations...${NC}"
echo "-----------------------------------"
# Wait a bit more for database to be ready
sleep 5
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"

echo ""
echo -e "${BLUE}Step 8: Collecting static files...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Fresh Deployment Complete!${NC}"
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
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker compose -f docker-compose.prod.yml down"
echo "  Restart services: docker compose -f docker-compose.prod.yml restart"
echo ""
echo -e "${YELLOW}Note: If you need to seed demo data, run:${NC}"
echo "  docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo --students 30"
echo ""
