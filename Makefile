.PHONY: help demo build test lint clean docker-up docker-down migrate seed admin-theme

help:
	@echo "FMU SIMS - Available Commands"
	@echo "=============================="
	@echo "make demo           - Complete demo setup (migrate + seed data)"
	@echo "make build          - Build backend and frontend"
	@echo "make test           - Run all tests (backend + frontend)"
	@echo "make lint           - Run all linters"
	@echo "make docker-up      - Start all Docker services"
	@echo "make docker-down    - Stop all Docker services"
	@echo "make migrate        - Run database migrations"
	@echo "make seed           - Seed demo data"
	@echo "make clean          - Clean build artifacts"
	@echo "make admin-theme    - Setup admin theme (Jazzmin + static files)"

demo: migrate seed
	@echo "✅ Demo environment ready!"
	@echo "Login credentials:"
	@echo "  Admin: admin / admin123"
	@echo "  Faculty: faculty / faculty123"
	@echo "  Student: student / student123"

build:
	@echo "Building backend and frontend..."
	cd backend && pip install -q -r requirements.txt
	cd frontend && npm ci
	cd frontend && npm run build
	@echo "✅ Build complete"

test:
	@echo "Running backend tests..."
	cd backend && export DB_ENGINE=django.db.backends.sqlite3 && export DB_NAME=:memory: && pytest tests --cov=. --cov-report=term-missing
	@echo "\nRunning frontend tests..."
	cd frontend && npm test -- --run
	@echo "✅ All tests passed"

lint:
	@echo "Linting backend..."
	cd backend && ruff check .
	cd backend && mypy .
	@echo "\nLinting frontend..."
	cd frontend && npm run lint
	cd frontend && npm run type-check
	@echo "✅ All linters passed"

migrate:
	@echo "Running database migrations..."
	cd backend && python manage.py migrate
	@echo "✅ Migrations complete"

seed:
	@echo "Seeding demo data..."
	cd backend && python manage.py seed_demo --students 30
	@echo "✅ Demo data seeded"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/htmlcov
	rm -rf backend/.coverage
	rm -rf backend/.pytest_cache
	rm -rf backend/__pycache__
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.cache
	@echo "✅ Clean complete"

docker-up:
	@echo "Starting Docker services..."
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	sleep 10
	@echo "Running migrations..."
	docker compose exec backend python manage.py migrate
	@echo "✅ Docker services started"

docker-down:
	@echo "Stopping Docker services..."
	docker compose down
	@echo "✅ Docker services stopped"

admin-theme:
	@echo "🌈 Setting up FMU SIMS Admin Theme..."
	cd backend && pip install -q django-jazzmin whitenoise
	mkdir -p backend/static/img
	cd backend && python manage.py collectstatic --noinput
	@echo "✅ Admin theme setup complete"
	@echo "Run 'cd backend && python manage.py runserver' to test the admin interface"
