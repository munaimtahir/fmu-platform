#!/bin/bash
# Vexel MedSIMS - Full Stack Deployment Script
# This script deploys both frontend and backend changes:
# 1. Stops both frontend and backend services
# 2. Rebuilds both containers without cache
# 3. Restarts both services
# 4. Runs migrations and collects static files
# 5. Verifies deployment
#
# Confirmed 2026-09-10 via direct production SSH: live Caddy
# (sims.vexel.pk /api/* -> 127.0.0.1:18010, default -> 127.0.0.1:18080) and
# `docker ps` both match docker-compose.yml + .env (BACKEND_HOST_PORT=18010,
# FRONTEND_HOST_PORT=18080), running as vexel_medsims_backend/frontend
# (non-_prod names), same as ops/deploy.sh. docker-compose.prod.yml is stale
# (hardcodes frontend port 8080, which Caddy does not point to) and should
# not be used.

set -e  # Exit on error

cd "$(dirname "$0")"

echo "=========================================="
echo "Vexel MedSIMS - Full Stack Deployment"
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

# Record the deployed commit in .env (same convention as ops/deploy.sh) so
# /api/health/'s "version" field reflects what's actually running.
APP_VERSION="$(git rev-parse HEAD)"
if grep -q '^APP_VERSION=' ".env"; then
    sed -i "s/^APP_VERSION=.*/APP_VERSION=${APP_VERSION}/" ".env"
else
    echo "APP_VERSION=${APP_VERSION}" >> ".env"
fi

echo -e "${BLUE}Step 1: Stopping frontend and backend services...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.yml stop frontend backend
echo -e "${GREEN}✓ Services stopped${NC}"

echo ""
echo -e "${BLUE}Step 2: Rebuilding containers (no cache)...${NC}"
echo "-----------------------------------"
PRE_DEPLOY_BACKEND_IMAGE=$(docker inspect --format='{{.Image}}' vexel_medsims_backend 2>/dev/null || echo "unavailable")
PRE_DEPLOY_FRONTEND_IMAGE=$(docker inspect --format='{{.Image}}' vexel_medsims_frontend 2>/dev/null || echo "unavailable")
echo -e "${YELLOW}Pre-rebuild image ID (backend):  ${PRE_DEPLOY_BACKEND_IMAGE}${NC}"
echo -e "${YELLOW}Pre-rebuild image ID (frontend): ${PRE_DEPLOY_FRONTEND_IMAGE}${NC}"
echo "  (keep these — needed to revert manually if this deploy goes wrong)"
docker compose -f docker-compose.yml build --no-cache frontend backend
echo -e "${GREEN}✓ Images built successfully${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting services...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.yml up -d frontend backend
echo -e "${GREEN}✓ Services restarted${NC}"

echo ""
echo -e "${BLUE}Step 4: Waiting for services to be ready...${NC}"
echo "-----------------------------------"
sleep 10

# Check if database is ready
if ! docker compose -f docker-compose.yml ps | grep -q "vexel_medsims_db.*Up"; then
    echo -e "${RED}✗ Database container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.yml logs db"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 5: Running database migrations...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.yml exec -T backend python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"

echo ""
echo -e "${BLUE}Step 6: Collecting static files...${NC}"
echo "-----------------------------------"
docker compose -f docker-compose.yml exec -T backend python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"

echo ""
echo -e "${BLUE}Step 7: Verifying deployment...${NC}"
echo "-----------------------------------"

# Check if backend container is running
if docker compose -f docker-compose.yml ps | grep -q "vexel_medsims_backend.*Up"; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.yml logs backend"
    exit 1
fi

# Check if frontend container is running
if docker compose -f docker-compose.yml ps | grep -q "vexel_medsims_frontend.*Up"; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
    echo "Check logs with: docker compose -f docker-compose.yml logs frontend"
    exit 1
fi

# Test backend health endpoint. Send X-Forwarded-Proto like Caddy does in
# production (SECURE_SSL_REDIRECT trusts that header) so this check exercises
# the same path real traffic takes instead of hitting Django's HTTPS redirect.
HEALTH_RESPONSE=$(curl -s -H "X-Forwarded-Proto: https" http://127.0.0.1:18010/api/health/ || echo "error")
if echo "$HEALTH_RESPONSE" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
    echo -e "${GREEN}✓ Backend API is responding and healthy (status: ok)${NC}"
else
    echo -e "${RED}✗ Backend health check FAILED (response: ${HEALTH_RESPONSE})${NC}"
    echo "Backend did not report \"status\": \"ok\" — this may indicate DB/migration/Redis trouble."
    echo "Pre-rebuild image IDs were: backend=${PRE_DEPLOY_BACKEND_IMAGE} frontend=${PRE_DEPLOY_FRONTEND_IMAGE}"
    echo "Check logs with: docker compose -f docker-compose.yml logs backend"
    exit 1
fi

# Test frontend endpoint
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18080/ || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "304" ]; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend health check failed (HTTP $FRONTEND_RESPONSE)${NC}"
    echo "Pre-rebuild image IDs were: backend=${PRE_DEPLOY_BACKEND_IMAGE} frontend=${PRE_DEPLOY_FRONTEND_IMAGE}"
    echo "Check logs with: docker compose -f docker-compose.yml logs frontend"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Full Stack Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f docker-compose.yml ps frontend backend
echo ""
echo "Local URLs:"
echo "  - Frontend: http://127.0.0.1:18080"
echo "  - Backend API: http://127.0.0.1:18010"
echo ""
echo "Public URLs:"
echo "  - Frontend: https://${PUBLIC_APP_DOMAIN:-sims.vexel.pk}/"
echo "  - Backend API: https://${PUBLIC_APP_DOMAIN:-sims.vexel.pk}/api/"
echo "  - Admin Panel: https://${PUBLIC_APP_DOMAIN:-sims.vexel.pk}/admin/"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "  View logs: docker compose -f docker-compose.yml logs -f"
echo "  Check status: docker compose -f docker-compose.yml ps"
echo "  Test backend: curl -H 'X-Forwarded-Proto: https' http://127.0.0.1:18010/api/health/"
echo "  Test frontend: curl -I http://127.0.0.1:18080/"
echo ""
