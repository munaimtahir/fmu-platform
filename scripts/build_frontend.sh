#!/bin/bash
# Frontend Build Script for FMU SIMS
# This script builds the frontend and outputs to ./frontend/dist

set -e

cd "$(dirname "$0")/.."

echo "=========================================="
echo "Building Frontend"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create dist directory if it doesn't exist
mkdir -p frontend/dist
chmod 777 frontend/dist 2>/dev/null || sudo chmod 777 frontend/dist 2>/dev/null || true

# Get VITE_API_URL from .env if it exists, otherwise use default
VITE_API_URL=${VITE_API_URL:-https://sims.alshifalab.pk/api}
if [ -f .env ]; then
    ENV_VITE_API_URL=$(grep -v '^#' .env | grep VITE_API_URL | cut -d '=' -f2 | tr -d ' \t"'"'" | head -1)
    if [ -n "$ENV_VITE_API_URL" ]; then
        VITE_API_URL="$ENV_VITE_API_URL"
    fi
fi

echo -e "${BLUE}Building frontend with API URL: ${VITE_API_URL}${NC}"
echo ""

# Build the frontend image
echo "Building frontend Docker image..."
docker compose build --build-arg VITE_API_URL="${VITE_API_URL}" frontend-builder

echo ""
echo "Running frontend builder to create build files..."
# Run the container - files will be copied to ./frontend/dist via volume mount
docker compose run --rm -e VITE_API_URL="${VITE_API_URL}" frontend-builder

# Verify files were created
echo ""
if [ "$(ls -A frontend/dist 2>/dev/null)" ]; then
    FILE_COUNT=$(find frontend/dist -type f | wc -l)
    echo -e "${GREEN}✓ Frontend build complete!${NC}"
    echo "Files are in: ./frontend/dist"
    echo "  $FILE_COUNT files created"
    echo ""
    echo "Top-level files:"
    ls -la frontend/dist/ | head -10
else
    echo -e "${YELLOW}⚠️  Frontend dist directory is empty.${NC}"
    echo "Please check the build logs above for errors."
    exit 1
fi

echo ""
