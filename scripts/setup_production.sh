#!/bin/bash

# FMU SIMS - Production Setup Script
# This script sets up the production environment:
# 1. Starts Docker services
# 2. Runs database migrations
# 3. Collects static files
# 4. Creates superuser (via seed_demo)
# 5. Seeds demo data

set -e  # Exit on error

echo "=========================================="
echo "FMU SIMS - Production Setup"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please review and update .env with your production values!${NC}"
    else
        echo -e "${YELLOW}✗ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

echo ""
echo "Step 1: Starting Docker services..."
echo "-----------------------------------"
docker compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 15

# Check if services are running
if ! docker compose ps | grep -q "sims_postgres.*Up"; then
    echo -e "${YELLOW}⚠️  PostgreSQL container not running. Check logs: docker compose logs postgres${NC}"
    exit 1
fi

if ! docker compose ps | grep -q "sims_redis.*Up"; then
    echo -e "${YELLOW}⚠️  Redis container not running. Check logs: docker compose logs redis${NC}"
    exit 1
fi

if ! docker compose ps | grep -q "sims_backend.*Up"; then
    echo -e "${YELLOW}⚠️  Backend container not running. Check logs: docker compose logs backend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All services are running${NC}"

echo ""
echo "Step 2: Running database migrations..."
echo "--------------------------------------"
docker compose exec -T backend python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"

echo ""
echo "Step 3: Building frontend..."
echo "-----------------------------------"
if [ -f "scripts/build_frontend.sh" ]; then
    chmod +x scripts/build_frontend.sh
    ./scripts/build_frontend.sh
    echo -e "${GREEN}✓ Frontend built${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend build script not found. Skipping frontend build.${NC}"
fi

echo ""
echo "Step 4: Collecting static files..."
echo "-----------------------------------"
docker compose exec -T backend python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"

echo ""
echo "Step 5: Creating superuser and seeding demo data..."
echo "-----------------------------------------------------"
echo "This will create:"
echo "  - Admin user: admin / admin123"
echo "  - Registrar user: registrar / registrar123"
echo "  - Faculty users: faculty1, faculty2, etc. / faculty123"
echo "  - Student users: student1, student2, etc. / student123"
echo "  - Demo programs, courses, terms, sections, and enrollment data"
echo ""

# Ask for number of students
read -p "Number of students to create (default: 30): " STUDENT_COUNT
STUDENT_COUNT=${STUDENT_COUNT:-30}

echo ""
echo "Seeding demo data with $STUDENT_COUNT students..."
docker compose exec -T backend python manage.py seed_demo --students "$STUDENT_COUNT"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Production Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Login Credentials:"
echo "------------------"
echo -e "${BLUE}Admin User:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${BLUE}Registrar User:${NC}"
echo "  Username: registrar"
echo "  Password: registrar123"
echo ""
echo -e "${BLUE}Faculty Users:${NC}"
echo "  Username: faculty1, faculty2, etc."
echo "  Password: faculty123"
echo ""
echo -e "${BLUE}Student Users:${NC}"
echo "  Username: student1, student2, etc."
echo "  Password: student123"
echo ""
echo "Next Steps:"
echo "----------"
echo "1. Access the admin panel at: https://sims.alshifalab.pk/admin/"
echo "2. Access the API at: https://sims.alshifalab.pk/api/"
echo "3. Check service status: docker compose ps"
echo "4. View logs: docker compose logs -f backend"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change default passwords in production!${NC}"
echo ""

