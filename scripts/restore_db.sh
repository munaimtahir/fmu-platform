#!/bin/bash
# Database Restore Script for FMU Platform
# Restores database from a backup file with safety checks
#
# Usage:
#   ./scripts/restore_db.sh <backup_file.sql.gz>
#   FORCE=1 ./scripts/restore_db.sh <backup_file.sql.gz>  # Skip confirmation prompt

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FORCE="${FORCE:-0}"
BACKUP_DIR="${BACKUP_DIR:-backups/db}"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if backup file is provided
if [ -z "${1:-}" ]; then
    print_error "Usage: $0 <backup_file.sql.gz>"
    print_info "Example: $0 backups/db/fmu_platform_20250103_120000.sql.gz"
    print_info "Environment variables:"
    print_info "  FORCE=1  - Skip confirmation prompt"
    exit 1
fi

BACKUP_FILE="$1"

# Handle relative paths
if [[ ! "$BACKUP_FILE" =~ ^/ ]]; then
    # If file doesn't start with /, check if it's relative to BACKUP_DIR
    if [ ! -f "$BACKUP_FILE" ] && [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    print_info "Available backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -10 || echo "  (none found)"
    exit 1
fi

print_info "Backup file: ${BACKUP_FILE}"
print_info "File size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Check if docker compose is available
check_docker_compose() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Determine compose command
    if command -v docker compose &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    echo "$COMPOSE_CMD"
}

# Load database configuration
load_db_config() {
    # Try to load from .env file
    if [ -f .env ]; then
        print_info "Loading database configuration from .env file"
        # Source .env safely (skip comments and empty lines)
        set -a
        source <(grep -v '^#' .env | grep -v '^$' | grep -E '^(POSTGRES_|DB_)')
        set +a
    else
        print_warning ".env file not found, using default values or environment variables"
    fi
    
    # Set defaults
    POSTGRES_DB="${POSTGRES_DB:-fmu_platform}"
    POSTGRES_USER="${POSTGRES_USER:-fmu_platform}"
    DB_CONTAINER="${DB_CONTAINER:-fmu_db}"
    
    # Check if container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        print_warning "Database container '${DB_CONTAINER}' not found, trying 'fmu_db_prod'..."
        DB_CONTAINER="fmu_db_prod"
        
        if ! docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
            print_error "Database container not found. Available containers:"
            docker ps -a --format '{{.Names}}' | grep -i db || echo "  (none found)"
            exit 1
        fi
    fi
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        print_warning "Database container '${DB_CONTAINER}' is not running. Starting it..."
        COMPOSE_CMD=$(check_docker_compose)
        ${COMPOSE_CMD} up -d db || {
            print_error "Failed to start database container"
            exit 1
        }
        print_info "Waiting for database to be ready..."
        sleep 5
    fi
    
    print_info "Database container: ${DB_CONTAINER}"
    print_info "Database: ${POSTGRES_DB}"
    print_info "User: ${POSTGRES_USER}"
}

# Load configuration
load_db_config
COMPOSE_CMD=$(check_docker_compose)

# Safety check: Create backup before restore (unless FORCE is set)
if [ "${FORCE}" != "1" ]; then
    print_warning "This will REPLACE all data in database: ${POSTGRES_DB}"
    print_warning "All current data will be lost!"
    
    # Offer to create a backup before restore
    read -p "Create a backup before restoring? (yes/no): " CREATE_BACKUP
    if [ "${CREATE_BACKUP}" = "yes" ] || [ "${CREATE_BACKUP}" = "y" ]; then
        print_info "Creating pre-restore backup..."
        if [ -f "scripts/backup_db.sh" ]; then
            ./scripts/backup_db.sh || {
                print_warning "Pre-restore backup failed (continuing anyway)"
            }
        else
            print_warning "Backup script not found, skipping pre-restore backup"
        fi
    fi
    
    # Final confirmation
    echo ""
    print_warning "Are you absolutely sure you want to restore from:"
    print_warning "  ${BACKUP_FILE}"
    print_warning "This will DELETE all current data in: ${POSTGRES_DB}"
    read -p "Type 'yes' to confirm: " CONFIRM
    
    if [ "${CONFIRM}" != "yes" ]; then
        print_info "Restore cancelled."
        exit 0
    fi
else
    print_warning "FORCE=1 is set, skipping confirmation prompts"
fi

# Stop backend and worker services to avoid connection issues
print_info "Stopping backend and worker services..."
${COMPOSE_CMD} stop backend rqworker 2>/dev/null || print_warning "Some services may not be running"

# Determine backup format (custom format or plain SQL)
BACKUP_FORMAT="unknown"
if file "${BACKUP_FILE}" | grep -q "gzip"; then
    # Check if it's a custom format dump (pg_dump -Fc) or plain SQL
    TEMP_CHECK=$(mktemp)
    gunzip -c "${BACKUP_FILE}" > "${TEMP_CHECK}" 2>/dev/null || {
        print_error "Failed to decompress backup file"
        exit 1
    }
    
    # Check for custom format magic bytes (starts with "PGDMP")
    if file "${TEMP_CHECK}" | grep -q "PostgreSQL"; then
        # Check first few bytes for custom format
        if head -c 5 "${TEMP_CHECK}" | grep -q "PGDMP" 2>/dev/null || head -c 5 "${TEMP_CHECK}" | hexdump -C | grep -q "50 47 44 4d 50"; then
            BACKUP_FORMAT="custom"
        else
            BACKUP_FORMAT="plain"
        fi
    else
        BACKUP_FORMAT="plain"
    fi
    rm -f "${TEMP_CHECK}"
else
    print_error "Backup file does not appear to be gzipped"
    exit 1
fi

print_info "Detected backup format: ${BACKUP_FORMAT}"

# Drop existing connections to the database
print_info "Dropping existing connections to database..."
docker exec "${DB_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
    2>/dev/null || print_warning "Could not drop connections (database may not exist yet)"

# Restore the backup
print_info "Restoring database from backup..."

if [ "${BACKUP_FORMAT}" = "custom" ]; then
    # Custom format restore (pg_restore)
    print_info "Using pg_restore for custom format backup..."
    
    # For custom format, we can restore directly from compressed file
    # by piping through gunzip
    if gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" pg_restore \
        -U "${POSTGRES_USER}" \
        -d postgres \
        --clean \
        --if-exists \
        --verbose \
        --create \
        --no-owner \
        --no-acl 2>&1 | tee /tmp/restore.log; then
        print_success "Database restore completed successfully!"
    else
        print_error "Database restore failed!"
        print_error "Restore log:"
        cat /tmp/restore.log 2>/dev/null || true
        rm -f /tmp/restore.log
        exit 1
    fi
    
    # Ensure database exists (pg_restore --create might have created it)
    docker exec "${DB_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c \
        "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}';" | grep -q 1 || {
        print_info "Creating database if it doesn't exist..."
        docker exec "${DB_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c \
            "CREATE DATABASE ${POSTGRES_DB};" 2>/dev/null || true
    }
    
    # If restore created the database with different name, we need to restore again
    # For now, assume the backup contains the correct database name
else
    # Plain SQL format restore
    print_info "Using psql for plain SQL format backup..."
    
    # Recreate database
    print_info "Recreating database..."
    docker exec "${DB_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c \
        "DROP DATABASE IF EXISTS ${POSTGRES_DB};" 2>/dev/null || true
    docker exec "${DB_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c \
        "CREATE DATABASE ${POSTGRES_DB};" || {
        print_error "Failed to create database"
        exit 1
    }
    
    # Restore from SQL file
    if gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --quiet \
        --set ON_ERROR_STOP=on 2>&1 | tee /tmp/restore.log; then
        print_success "Database restore completed successfully!"
    else
        print_error "Database restore failed!"
        print_error "Restore log (last 50 lines):"
        tail -50 /tmp/restore.log 2>/dev/null || true
        rm -f /tmp/restore.log
        exit 1
    fi
    rm -f /tmp/restore.log
fi

# Run migrations to ensure schema is up to date
print_info "Running Django migrations to ensure schema is current..."
${COMPOSE_CMD} exec -T backend python manage.py migrate --noinput 2>/dev/null || {
    print_warning "Failed to run migrations (backend may not be running). Run manually:"
    print_warning "  docker compose exec backend python manage.py migrate"
}

# Restart backend and worker services
print_info "Restarting backend and worker services..."
${COMPOSE_CMD} start backend rqworker 2>/dev/null || print_warning "Some services may not have restarted"

# Verify health endpoint (if available)
print_info "Waiting for services to be ready..."
sleep 3

if curl -sf http://localhost:8010/api/health/ > /dev/null 2>&1; then
    print_success "Health check passed!"
else
    print_warning "Health check failed (services may still be starting)"
fi

echo ""
print_success "Restore process completed!"
print_info "Database: ${POSTGRES_DB}"
print_info "Backup file: ${BACKUP_FILE}"
print_info ""
print_info "Next steps:"
print_info "  1. Verify the application is working correctly"
print_info "  2. Check health endpoint: curl http://localhost:8010/api/health/"
print_info "  3. Review application logs: docker compose logs backend"
