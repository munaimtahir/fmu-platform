#!/usr/bin/env bash
set -Eeuo pipefail

# Production backup helper. Run from the VM checkout. It deliberately reads the
# PostgreSQL credentials from the database container environment and never puts a
# password on a command line or in a log.

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
DB_CONTAINER="${DB_CONTAINER:-vexel_medsims_db}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
MEDIA_ROOT="${MEDIA_ROOT:-$REPO_ROOT/backend/media}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || { echo "RETENTION_DAYS must be numeric" >&2; exit 1; }
[[ -d "$MEDIA_ROOT" ]] || { echo "media directory does not exist: $MEDIA_ROOT" >&2; exit 1; }
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || { echo "database container not found: $DB_CONTAINER" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
db_archive="$BACKUP_DIR/db-${timestamp}.sql.gz"
media_archive="$BACKUP_DIR/media-${timestamp}.tar.gz"

db_user="$(docker exec "$DB_CONTAINER" sh -c 'printf "%s" "${POSTGRES_USER:?}"')"
db_name="$(docker exec "$DB_CONTAINER" sh -c 'printf "%s" "${POSTGRES_DB:?}"')"

tmp_db="${db_archive}.tmp"
tmp_media="${media_archive}.tmp"
cleanup() { rm -f -- "$tmp_db" "$tmp_media"; }
trap cleanup EXIT

echo "Creating database backup: $(basename "$db_archive")"
docker exec "$DB_CONTAINER" pg_dump --no-owner --no-privileges -U "$db_user" -d "$db_name" \
  | gzip -c > "$tmp_db"
gzip -t "$tmp_db"
[[ -s "$tmp_db" ]] || { echo "database backup is empty" >&2; exit 1; }
mv -- "$tmp_db" "$db_archive"

echo "Creating media backup: $(basename "$media_archive")"
tar -C "$MEDIA_ROOT" -czf "$tmp_media" .
gzip -t "$tmp_media"
[[ -s "$tmp_media" ]] || { echo "media backup is empty" >&2; exit 1; }
mv -- "$tmp_media" "$media_archive"

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'db-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'media-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

echo "Backup verified: $(basename "$db_archive"), $(basename "$media_archive")"
