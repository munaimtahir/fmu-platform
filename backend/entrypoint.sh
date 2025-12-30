#!/bin/bash
set -e
# Migrations will be run manually during setup
# python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec "$@"

