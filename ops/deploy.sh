#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "Refusing to run as root: this host's git deploy key is only configured for the 'munaim' user, and docker is usable by 'munaim' without sudo. Re-run as: sudo -u munaim bash ops/deploy.sh (or just run it as munaim directly, no sudo)." >&2
  exit 1
fi

PROJECT="fmu-platform"
APPDIR="/home/munaim/srv/apps/fmu-platform"
COMPOSE_FILE="docker-compose.yml"
LOG="/home/munaim/srv/ops/logs/fmu-platform_deploy_$(date +%Y%m%d_%H%M%S).log"

# Bash reads this script from disk as it executes it. `git reset --hard` below
# rewrites this very file mid-run, which can corrupt execution partway through
# (lines silently skipped) once bash resumes reading past the rewrite. To avoid
# that, do only the git sync in this first pass, then re-exec a fresh copy of
# the (possibly now-updated) script for everything else.
if [ -z "${FMU_DEPLOY_REEXECED:-}" ]; then
  {
    echo "Deploying $PROJECT"
    cd "$APPDIR"

    if [ -d ".git" ]; then
      echo "Pulling latest code"
      git fetch --all
      git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)
    else
      echo "No git repo found. Skipping pull."
    fi
  } &> "$LOG"

  export FMU_DEPLOY_REEXECED=1
  export FMU_DEPLOY_LOG="$LOG"
  exec bash "$APPDIR/ops/deploy.sh"
fi

LOG="$FMU_DEPLOY_LOG"

{
  cd "$APPDIR"

  APP_VERSION="$(git rev-parse HEAD)"
  echo "Recording APP_VERSION=$APP_VERSION in .env"
  if [ -f ".env" ] && grep -q '^APP_VERSION=' ".env"; then
    sed -i "s/^APP_VERSION=.*/APP_VERSION=${APP_VERSION}/" ".env"
  else
    echo "APP_VERSION=${APP_VERSION}" >> ".env"
  fi

  echo "Rebuilding containers"
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT" build --pull

  echo "Bringing up containers"
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT" up -d

  echo "Restarting backend/worker to pick up new APP_VERSION"
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT" up -d --force-recreate backend worker

  echo "Deploy finished"

} &>> "$LOG"

echo "Log: $LOG"
