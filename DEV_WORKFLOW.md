# Real-Time Development Workflow

## Quick Start for Bug Fixing

### Current Setup
- **Backend**: Running in Docker on port 8010
- **Frontend**: Running in Docker on port 8080 (production build)

### Option 1: Frontend Dev Mode (Recommended for Real-Time)

1. **Stop the frontend container** (keep backend running):
   ```bash
   docker compose stop frontend
   ```

2. **Run frontend in development mode**:
   ```bash
   cd frontend
   npm install  # if not already done
   
   # Create/update .env file
   echo "VITE_API_URL=http://localhost:8010/api" > .env
   
   # Start dev server with hot-reload
   npm run dev
   ```

3. **Access the app**:
   - Frontend (dev): http://localhost:5173 (hot-reload enabled)
   - Backend: http://localhost:8010/api

4. **Now you can**:
   - Make changes to frontend code
   - See changes instantly in browser (hot-reload)
   - Fix bugs in real-time

### Option 2: Full Docker Development

Keep everything in Docker, but restart after changes:
```bash
# After making changes
docker compose restart frontend
# or rebuild if needed
docker compose up -d --build frontend
```

### Option 3: Both in Dev Mode

1. **Stop Docker services**:
   ```bash
   docker compose stop
   ```

2. **Run backend locally**:
   ```bash
   cd backend
   source venv/bin/activate  # or create venv first
   pip install -r requirements.txt
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Run frontend locally** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

## Quick Commands

```bash
# Check what's running
docker compose ps

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Restart specific service
docker compose restart frontend
docker compose restart backend

# Rebuild after dependency changes
docker compose up -d --build frontend
```

## Browser Access

- **Production (Docker)**: http://localhost:8080
- **Dev Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8010/api
- **Admin Panel**: http://localhost:8010/admin

## Hot Reload

When running `npm run dev`:
- ✅ Frontend changes reload automatically
- ✅ No need to restart
- ✅ Fast feedback loop

When using Docker:
- ⚠️ Need to restart/rebuild to see changes
- ✅ More stable, production-like environment
