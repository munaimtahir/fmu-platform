#!/usr/bin/env bash
set -euo pipefail

python_bin="${PYTHON:-python3}"
schema_file="$(mktemp)"
trap 'rm -f "$schema_file"' EXIT

"$python_bin" manage.py spectacular --file "$schema_file"
cmp --silent "$schema_file" ../docs/openapi-schema.yaml
cmp --silent "$schema_file" ../android/api/openapi-current.yaml
