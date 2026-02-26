#!/usr/bin/env bash
set -euo pipefail

PROJECT="fmu-platform"
docker ps --filter "label=com.docker.compose.project=$PROJECT"
