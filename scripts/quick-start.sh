#!/bin/bash
# Quick Start Script for SIMS Development

set -e

echo "================================================"
echo "SIMS - Student Information Management System"
echo "Quick Start Script"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created. You can edit it if needed."
else
    echo "✅ .env already exists"
fi

echo ""
echo "🚀 Starting Docker services..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "🔄 Running database migrations..."
docker exec -it sims_backend python manage.py migrate

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Services are running at:"
echo "  - Frontend:     http://localhost:5173"
echo "  - Backend API:  http://localhost:8000"
echo "  - Admin Panel:  http://localhost:8000/admin"
echo "  - Full App:     http://localhost (via Nginx)"
echo ""
echo "To create a superuser, run:"
echo "  docker exec -it sims_backend python manage.py createsuperuser"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
echo ""
echo "To stop services:"
echo "  docker compose down"
echo ""
