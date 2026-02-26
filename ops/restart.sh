#!/usr/bin/env bash
set -euo pipefail

PROJECT="fmu-platform"
docker compose -p "$PROJECT" restart
