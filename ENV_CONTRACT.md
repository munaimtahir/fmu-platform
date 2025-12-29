# Environment Variables Contract

This document defines all environment variables required for the FMU Platform MVP deployment.

## Core Settings

### Django Configuration

- `DJANGO_SECRET_KEY` (required)
  - Description: Django secret key for cryptographic signing
  - Default: None (must be set in production)
  - Security: **CRITICAL** - Change in production, use strong random value
  - Note: May temporarily exist in GitHub for MVP (document clearly)

- `DJANGO_DEBUG` (optional)
  - Description: Enable Django debug mode
  - Default: `False`
  - Values: `True` or `False`
  - Production: Must be `False`

- `DJANGO_ALLOWED_HOSTS` (required)
  - Description: Comma-separated list of allowed host headers
  - Default: `localhost,127.0.0.1`
  - Example: `sims.example.com,api.example.com,localhost`
  - Production: Set to your domain(s)

## Database Configuration

- `DB_ENGINE` (optional)
  - Description: Database engine
  - Default: `django.db.backends.postgresql`
  - Values: `django.db.backends.postgresql`, `django.db.backends.mysql`, etc.

- `DB_NAME` (required)
  - Description: Database name
  - Default: `sims_db`
  - Production: Set to your database name

- `DB_USER` (required)
  - Description: Database username
  - Default: `sims_user`
  - Production: Set to your database user

- `DB_PASSWORD` (required)
  - Description: Database password
  - Default: `sims_password`
  - Security: **CRITICAL** - Use strong password in production
  - Note: May temporarily exist in GitHub for MVP (document clearly)

- `DB_HOST` (optional)
  - Description: Database host
  - Default: `localhost`
  - Production: Set to your database host

- `DB_PORT` (optional)
  - Description: Database port
  - Default: `5432`
  - PostgreSQL default: `5432`
  - MySQL default: `3306`

## CORS & Security

- `CORS_ALLOWED_ORIGINS` (required)
  - Description: Comma-separated list of allowed CORS origins (must include scheme)
  - Default: `http://localhost,http://127.0.0.1`
  - Example: `https://sims.example.com,http://localhost:5173`
  - Format: Must include `http://` or `https://` prefix

- `CSRF_TRUSTED_ORIGINS` (required)
  - Description: Comma-separated list of trusted origins for CSRF (must include scheme)
  - Default: `http://localhost,http://127.0.0.1`
  - Example: `https://sims.example.com,http://localhost:5173`
  - Format: Must include `http://` or `https://` prefix

## Authentication

- `JWT_ACCESS_TOKEN_LIFETIME` (optional)
  - Description: JWT access token lifetime in minutes
  - Default: `60`
  - Format: Integer (minutes)

- `JWT_REFRESH_TOKEN_LIFETIME` (optional)
  - Description: JWT refresh token lifetime in minutes
  - Default: `1440` (24 hours)
  - Format: Integer (minutes)

## Email Configuration (Optional)

- `EMAIL_BACKEND` (optional)
  - Description: Email backend class
  - Default: `django.core.mail.backends.console.EmailBackend`
  - Development: `django.core.mail.backends.console.EmailBackend`
  - Production: `django.core.mail.backends.smtp.EmailBackend`

- `EMAIL_HOST` (optional)
  - Description: SMTP server host
  - Default: None

- `EMAIL_PORT` (optional)
  - Description: SMTP server port
  - Default: `587` (TLS) or `465` (SSL)

- `EMAIL_HOST_USER` (optional)
  - Description: SMTP server username
  - Default: None

- `EMAIL_HOST_PASSWORD` (optional)
  - Description: SMTP server password
  - Default: None
  - Security: Store securely, not in code

- `EMAIL_USE_TLS` (optional)
  - Description: Use TLS for SMTP
  - Default: `True`
  - Values: `True` or `False`

- `EMAIL_USE_SSL` (optional)
  - Description: Use SSL for SMTP
  - Default: `False`
  - Values: `True` or `False`

## Redis Configuration (Optional)

- `REDIS_URL` (optional)
  - Description: Redis connection URL
  - Default: `redis://localhost:6379/0`
  - Format: `redis://host:port/db`

## Static Files

- `STATIC_ROOT` (optional)
  - Description: Absolute path to static files directory
  - Default: `/app/staticfiles`
  - Production: Set to your static files directory

- `MEDIA_ROOT` (optional)
  - Description: Absolute path to media files directory
  - Default: `/app/media`
  - Production: Set to your media files directory

## Secret Management

**IMPORTANT**: For MVP, secrets may temporarily exist in GitHub repositories. This must be clearly documented and changed before production use.

### Secrets to Change in Production

1. `DJANGO_SECRET_KEY` - Generate new strong secret
2. `DB_PASSWORD` - Use strong database password
3. `EMAIL_HOST_PASSWORD` - If using email
4. Any API keys or third-party service credentials

### Generating Django Secret Key

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

## Example .env File

```bash
# Core
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=sims.example.com,localhost

# Database
DB_NAME=sims_db
DB_USER=sims_user
DB_PASSWORD=your-db-password-here
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://sims.example.com,http://localhost:5173
CSRF_TRUSTED_ORIGINS=https://sims.example.com,http://localhost:5173

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@example.com
EMAIL_HOST_PASSWORD=your-email-password
EMAIL_USE_TLS=True
```

## Validation

Ensure all required variables are set before starting the application:

```bash
# Check required variables
python manage.py check --deploy
```

## Production Checklist

- [ ] `DJANGO_SECRET_KEY` set to strong random value
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_ALLOWED_HOSTS` includes production domain
- [ ] `DB_PASSWORD` set to strong password
- [ ] `CORS_ALLOWED_ORIGINS` includes production frontend URL
- [ ] `CSRF_TRUSTED_ORIGINS` includes production domain
- [ ] All secrets removed from version control (if applicable)
- [ ] Environment variables secured in production environment

