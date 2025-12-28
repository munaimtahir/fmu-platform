#!/bin/bash
# Database Restore Script for SIMS
# Usage: ./restore.sh <backup_file.sql.gz>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <backup_file.sql.gz>"
    print_info "Example: $0 sims_db_backup_20251021_020000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables from .env if it exists
if [ -f .env ]; then
    print_info "Loading database configuration from .env file"
    export $(grep -v '^#' .env | xargs)
else
    print_warning ".env file not found, using default values or environment variables"
fi

# Set database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sims_db}
DB_USER=${DB_USER:-sims_user}

print_info "Database connection parameters:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter database password: " DB_PASSWORD
    echo
    export PGPASSWORD=$DB_PASSWORD
fi

# Confirm restore operation
print_warning "This will REPLACE all data in database: $DB_NAME"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Restore cancelled."
    exit 0
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Extract the compressed backup
print_info "Extracting backup file..."
TEMP_FILE="${BACKUP_FILE%.gz}"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Check if extraction was successful
if [ ! -f "$TEMP_FILE" ]; then
    print_error "Failed to extract backup file"
    exit 1
fi

# Drop existing connections to the database
print_info "Dropping existing connections to database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    2>/dev/null || print_warning "Could not drop connections (database may not exist yet)"

# Drop and recreate database (optional - comment out if you want to restore into existing DB)
print_info "Recreating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore the backup
print_info "Restoring database from backup..."
pg_restore \
    --host=$DB_HOST \
    --port=$DB_PORT \
    --username=$DB_USER \
    --dbname=$DB_NAME \
    --verbose \
    --clean \
    --if-exists \
    "$TEMP_FILE"

# Check restore status
if [ $? -eq 0 ]; then
    print_info "Database restore completed successfully!"
else
    print_error "Database restore failed!"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Clean up temporary file
rm -f "$TEMP_FILE"

# Run migrations to ensure schema is up to date
print_info "Running Django migrations to ensure schema is current..."
cd backend
python manage.py migrate --noinput

print_info "Restore process completed!"
print_info "You may want to restart the application to ensure all changes take effect."
