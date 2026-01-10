#!/bin/bash
# Database Backup Script for FMU Platform
# Creates timestamped backups with retention policy
#
# Usage:
#   ./scripts/backup_db.sh                    # Uses default retention (7 days)
#   RETENTION_DAYS=14 ./scripts/backup_db.sh  # Keep backups for 14 days

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-backups/db}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PREFIX="fmu_platform"

# Helper functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

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
    
    print_info "Using database container: ${DB_CONTAINER}"
    print_info "Database: ${POSTGRES_DB}"
    print_info "User: ${POSTGRES_USER}"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "${BACKUP_DIR}"
    print_info "Backup directory: ${BACKUP_DIR}"
}

# Create database backup
create_backup() {
    local backup_file="${BACKUP_DIR}/${BACKUP_PREFIX}_${TIMESTAMP}.sql.gz"
    
    print_info "Creating database backup..."
    print_info "Backup file: ${backup_file}"
    
    # Create backup using pg_dump through docker exec
    # Use custom format for better compression and faster restore
    if docker exec "${DB_CONTAINER}" pg_dump \
        -U "${POSTGRES_USER}" \
        -Fc \
        "${POSTGRES_DB}" 2>/dev/null | gzip > "${backup_file}"; then
        print_success "Backup created successfully"
    else
        # Fallback to plain SQL format
        print_warning "Custom format backup failed, trying plain SQL format..."
        if docker exec "${DB_CONTAINER}" pg_dump \
            -U "${POSTGRES_USER}" \
            -Fp \
            "${POSTGRES_DB}" 2>/dev/null | gzip > "${backup_file}"; then
            print_success "Backup created successfully (plain SQL format)"
        else
            print_error "Failed to create backup"
            exit 1
        fi
    fi
    
    # Verify backup file was created
    if [ ! -f "${backup_file}" ]; then
        print_error "Backup file was not created"
        exit 1
    fi
    
    # Get file size
    local file_size=$(du -h "${backup_file}" | cut -f1)
    print_info "Backup file size: ${file_size}"
    
    # Store backup file path for summary
    BACKUP_FILE="${backup_file}"
    BACKUP_SIZE="${file_size}"
}

# Apply retention policy
apply_retention() {
    print_info "Applying retention policy (keeping last ${RETENTION_DAYS} days)..."
    
    # Calculate cutoff time (in seconds since epoch)
    local cutoff_time=$(date -d "${RETENTION_DAYS} days ago" +%s 2>/dev/null || \
                        date -v-${RETENTION_DAYS}d +%s 2>/dev/null || \
                        echo "0")
    
    if [ "${cutoff_time}" = "0" ]; then
        print_warning "Could not calculate cutoff time, using file age instead"
        # Fallback: delete files older than retention days
        find "${BACKUP_DIR}" -name "${BACKUP_PREFIX}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    else
        # Delete backups older than retention period
        local deleted_count=0
        while IFS= read -r file; do
            if [ -n "${file}" ] && [ -f "${file}" ]; then
                local file_time=$(stat -c %Y "${file}" 2>/dev/null || \
                                 stat -f %m "${file}" 2>/dev/null || \
                                 echo "0")
                
                if [ "${file_time}" != "0" ] && [ "${file_time}" -lt "${cutoff_time}" ]; then
                    print_info "Deleting old backup: $(basename "${file}")"
                    rm -f "${file}"
                    deleted_count=$((deleted_count + 1))
                fi
            fi
        done < <(find "${BACKUP_DIR}" -name "${BACKUP_PREFIX}_*.sql.gz" -type f 2>/dev/null || true)
        
        if [ "${deleted_count}" -gt 0 ]; then
            print_info "Deleted ${deleted_count} old backup(s)"
        else
            print_info "No old backups to delete"
        fi
    fi
    
    # Count remaining backups
    local remaining_count=$(find "${BACKUP_DIR}" -name "${BACKUP_PREFIX}_*.sql.gz" -type f 2>/dev/null | wc -l)
    print_info "Remaining backups: ${remaining_count}"
}

# Print summary
print_summary() {
    echo ""
    echo "========================================"
    echo "  Backup Summary"
    echo "========================================"
    echo "Backup file: ${BACKUP_FILE}"
    echo "Backup size: ${BACKUP_SIZE}"
    echo "Backup directory: ${BACKUP_DIR}"
    echo "Retention: ${RETENTION_DAYS} days"
    echo "Timestamp: ${TIMESTAMP}"
    echo ""
    
    # List recent backups
    print_info "Recent backups:"
    ls -lh "${BACKUP_DIR}/${BACKUP_PREFIX}_"*.sql.gz 2>/dev/null | tail -5 || echo "  (none found)"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "  FMU Platform Database Backup"
    echo "========================================"
    echo "Timestamp: ${TIMESTAMP}"
    echo "Retention: ${RETENTION_DAYS} days"
    echo ""
    
    # Load configuration
    load_db_config
    
    # Create backup directory
    create_backup_dir
    
    # Create backup
    create_backup
    
    # Apply retention
    apply_retention
    
    # Print summary
    print_summary
    
    print_success "Backup completed successfully!"
    print_info "Backup file location: ${BACKUP_FILE}"
    print_info "To restore: ./scripts/restore_db.sh ${BACKUP_FILE}"
}

# Run main function
main "$@"