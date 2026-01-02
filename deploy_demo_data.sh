#!/bin/bash
# deploy_demo_data.sh
# Script to deploy demo data to the FMU Platform SIMS application

set -e  # Exit on any error

echo "=================================================="
echo "FMU Platform - Demo Data Deployment Script"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo "Step 1: Starting Docker containers..."
docker compose up -d db
echo "✅ Database container started"
echo ""

echo "Step 2: Waiting for database to be ready..."
sleep 10
echo "✅ Database should be ready"
echo ""

echo "Step 3: Building backend container..."
docker compose build backend
echo "✅ Backend container built"
echo ""

echo "Step 4: Starting backend container..."
docker compose up -d backend
echo "✅ Backend container started"
echo ""

echo "Step 5: Waiting for backend to be ready..."
sleep 5
echo "✅ Backend should be ready"
echo ""

echo "Step 6: Running database migrations..."
docker compose exec backend python manage.py migrate
echo "✅ Migrations completed"
echo ""

echo "Step 7: Creating demo data with seed_demo_scenarios command..."
docker compose exec backend python manage.py seed_demo_scenarios --students 20
echo "✅ Demo data created successfully!"
echo ""

echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "Demo Data Summary:"
echo "  • 20 students across 8 workflow stages"
echo "  • 2 faculty users (demo_faculty1, demo_faculty2)"
echo "  • 3 courses and 3 sections"
echo "  • Complete academic structure"
echo ""
echo "Login Credentials:"
echo "  Faculty: demo_faculty1 / faculty123"
echo "  Students: demo_student001-020 / demo123"
echo ""
echo "Access Points:"
echo "  • Django Admin: http://localhost:8010/admin"
echo "  • API: http://localhost:8010/api"
echo "  • Frontend: http://localhost:8080"
echo ""
echo "To reset and recreate demo data:"
echo "  docker compose exec backend python manage.py seed_demo_scenarios --reset --students 20"
echo ""
echo "To view logs:"
echo "  docker compose logs -f backend"
echo ""
