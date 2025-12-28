# Frontend Build Added to Docker Deployment ✅

## Summary

Frontend build has been added to the automated Docker deployment process.

## Changes Made

### 1. Docker Compose Configuration

Added `frontend-builder` service to `docker-compose.yml`:
- Uses `Dockerfile.build` for multi-stage build
- Builds frontend with Vite
- Outputs to `./frontend/dist` (bind mount)
- Uses `build` profile (runs only when explicitly requested)

### 2. Frontend Dockerfile

Created `frontend/Dockerfile.build`:
- Multi-stage build: Node.js builder + Alpine output
- Builds React/Vite frontend
- Configures `VITE_API_URL` at build time
- Outputs built files to `/output` directory

### 3. Build Script

Created `scripts/build_frontend.sh`:
- Automated frontend build script
- Reads `VITE_API_URL` from `.env` file
- Builds and outputs to `./frontend/dist`
- Includes error handling and verification

### 4. Production Setup Script

Updated `scripts/setup_production.sh`:
- Added Step 3: Build frontend (before collecting static files)
- Calls `build_frontend.sh` script
- Integrated into automated deployment flow

## Usage

### Manual Frontend Build

```bash
cd /home/munaim/srv/apps/fmu

# Build frontend only
./scripts/build_frontend.sh

# Or using docker-compose directly
docker compose build frontend-builder
docker compose run --rm frontend-builder
```

### Automated Full Deployment

```bash
cd /home/munaim/srv/apps/fmu

# Run production setup (includes frontend build)
./scripts/setup_production.sh
```

### Configuration

Set `VITE_API_URL` in `.env` file (optional, defaults to `https://sims.alshifalab.pk/api`):
```bash
VITE_API_URL=https://sims.alshifalab.pk/api
```

## Build Process

1. **Build Stage**: Node.js image installs dependencies and builds frontend
2. **Output Stage**: Alpine image copies built files to `/output`
3. **Volume Mount**: Files are mounted to `./frontend/dist` on host
4. **Caddy Serving**: Caddy serves files from `/home/munaim/srv/apps/fmu/frontend/dist`

## File Locations

- **Build Output**: `/home/munaim/srv/apps/fmu/frontend/dist`
- **Caddy Config**: Expects files at `/home/munaim/srv/apps/fmu/frontend/dist`
- **Dockerfile**: `frontend/Dockerfile.build`
- **Build Script**: `scripts/build_frontend.sh`

## Integration with Deployment

The frontend build is now part of the automated deployment:
1. Start Docker services (postgres, redis, backend)
2. Run database migrations
3. **Build frontend** ← NEW
4. Collect static files (Django)
5. Seed demo data (optional)

## Status

✅ Frontend build integrated into Docker deployment
✅ Build script created and tested
✅ Production setup script updated
✅ Files output to correct location for Caddy serving

