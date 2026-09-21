#!/usr/bin/env bash
set -Eeuo pipefail

# Restore helper for a maintenance window or throwaway rehearsal. It refuses to
# touch a database unless the operator explicitly confirms the destructive step.

DB_CONTAINER="${DB_CONTAINER:-vexel_medsims_db}"
BACKUP_FILE="${1:-}"
MEDIA_ARCHIVE="${MEDIA_ARCHIVE:-}"
MEDIA_ROOT="${MEDIA_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/../backend/media" && pwd)}"

if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "usage: CONFIRM_RESTORE=YES $0 path/to/db-<timestamp>.sql.gz" >&2
  exit 2
fi
[[ "$BACKUP_FILE" == *.sql.gz ]] || { echo "backup must be a .sql.gz archive" >&2; exit 2; }
[[ "${CONFIRM_RESTORE:-}" == YES ]] || {
  echo "refusing restore: set CONFIRM_RESTORE=YES during an approved maintenance window" >&2
  exit 1
}
command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || { echo "database container not found: $DB_CONTAINER" >&2; exit 1; }
gzip -t "$BACKUP_FILE"

db_user="$(docker exec "$DB_CONTAINER" sh -c 'printf "%s" "${POSTGRES_USER:?}"')"
db_name="$(docker exec "$DB_CONTAINER" sh -c 'printf "%s" "${POSTGRES_DB:?}"')"

echo "Restoring database archive: $(basename "$BACKUP_FILE")"
gunzip -c "$BACKUP_FILE" \
  | docker exec -i "$DB_CONTAINER" psql --set ON_ERROR_STOP=1 -U "$db_user" -d "$db_name"

if [[ -n "$MEDIA_ARCHIVE" ]]; then
  [[ -f "$MEDIA_ARCHIVE" ]] || { echo "media archive not found: $MEDIA_ARCHIVE" >&2; exit 1; }
  [[ "$MEDIA_ARCHIVE" == *.tar.gz ]] || { echo "media archive must be .tar.gz" >&2; exit 2; }
  gzip -t "$MEDIA_ARCHIVE"
  mkdir -p "$MEDIA_ROOT"
  tar -xzf "$MEDIA_ARCHIVE" -C "$MEDIA_ROOT"
  echo "Media archive restored to: $MEDIA_ROOT"
fi

echo "Database restore completed; run migrations and health checks before reopening traffic."
