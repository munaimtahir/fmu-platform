# Security & Production Deployment Guide

## Overview

This guide covers security best practices and deployment configuration for FMU SIMS in production environments.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Security Settings](#security-settings)
3. [Database Security](#database-security)
4. [Production Deployment](#production-deployment)
5. [HTTPS Configuration](#https-configuration)
6. [Security Checklist](#security-checklist)

## Environment Variables

### Required for Production

All sensitive configuration MUST be set via environment variables, never hardcoded:

```bash
# Generate a strong secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Critical Settings

#### Django Secret Key

```env
DJANGO_SECRET_KEY=your-generated-secret-key-here-at-least-50-characters-long
```

**Requirements:**
- At least 50 characters long
- Random and unique
- Never reuse across environments
- Never commit to version control

#### Debug Mode

```env
DJANGO_DEBUG=False
```

**CRITICAL:** Always set to `False` in production! Debug mode exposes:
- Detailed error pages with stack traces
- Internal file paths
- SQL queries
- Environment variables

#### Allowed Hosts

```env
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
```

**Requirements:**
- List all domains/IPs that will serve the application
- Never use `*` in production
- Include all subdomains you'll use
- Separate multiple hosts with commas (no spaces)

## Security Settings

### 1. SECRET_KEY Management

**Development:**
```env
DJANGO_SECRET_KEY=dev-secret-key-not-for-production
```

**Production:**
```env
DJANGO_SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
```

Store in secure secret management:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Environment variables (for simple deployments)

### 2. HTTPS/SSL Configuration

**Always use HTTPS in production:**

The production security settings are **already implemented** in `settings.py` and automatically activate when `DEBUG=False`. These settings are configured for deployment behind a reverse proxy (Caddy) where TLS terminates at the proxy level.

**Current Deployment Architecture:**
- **Reverse Proxy**: Caddy running on host (not in Docker)
- **TLS Termination**: Caddy handles SSL/TLS certificates
- **App Configuration**: Django receives proxied HTTPS requests via `X-Forwarded-Proto` header

**Security settings in `settings.py` (production mode only):**
```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_HTTPONLY = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
```

**Note:** The `SECURE_PROXY_SSL_HEADER` setting is critical for deployments behind a reverse proxy. It tells Django to trust the `X-Forwarded-Proto` header from Caddy, preventing redirect loops.

### 3. CORS Configuration

**Development:**
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Production:**
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Important:**
- Only list trusted origins
- Use HTTPS URLs in production
- No wildcards for production

### 4. Database Security

**Development:**
```env
DB_PASSWORD=dev_password
```

**Production:**
```env
DB_PASSWORD=$(openssl rand -base64 32)
```

**Best Practices:**
- Use strong, randomly generated passwords
- Different passwords per environment
- Use connection pooling
- Enable SSL for database connections
- Restrict database access by IP
- Regular automated backups

### 5. JWT Token Security

**Production Settings:**
```env
# Short access token lifetime (15-60 minutes)
JWT_ACCESS_TOKEN_LIFETIME=60

# Longer refresh token lifetime (1-7 days)
JWT_REFRESH_TOKEN_LIFETIME=1440
```

**Recommendations:**
- Use short access token lifetimes
- Implement token rotation
- Store tokens securely on client
- Implement token blacklisting
- Monitor for suspicious activity

## Production Deployment

### Docker Compose Production

Use `docker-compose.prod.yml`:

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Environment File Structure

**Development:** `.env`
**Production:** `.env.production`

Never use the same `.env` file for both!

### Production Checklist

Before deploying:

```bash
# 1. Update environment variables
cp .env.example .env.production
# Edit .env.production with production values

# 2. Build production images
docker compose -f docker-compose.prod.yml build

# 3. Run migrations
docker compose -f docker-compose.prod.yml run backend python manage.py migrate

# 4. Collect static files
docker compose -f docker-compose.prod.yml run backend python manage.py collectstatic --noinput

# 5. Run security check
docker compose -f docker-compose.prod.yml run backend python manage.py check --deploy

# 6. Start services
docker compose -f docker-compose.prod.yml up -d
```

## HTTPS Configuration

### Current Deployment (Caddy)

**Primary Deployment Pattern:** The application is deployed behind **Caddy** running on the host, which handles TLS termination automatically.

- **Caddy** automatically obtains and renews Let's Encrypt certificates
- **Caddy** proxies requests to the Django container on `127.0.0.1:8010`
- Django receives proxied HTTPS requests via `X-Forwarded-Proto` header
- No additional SSL configuration needed in Django - security settings in `settings.py` handle HTTPS enforcement

**Caddy Configuration:** Configure Caddy on the host to:
- Handle TLS/SSL certificates automatically
- Proxy requests to `127.0.0.1:8010` (Django container)
- Set `X-Forwarded-Proto: https` header

### Alternative Deployment (Nginx + Certbot)

**Note:** The following sections are for **alternative deployment patterns** using nginx/certbot. These are **not used** in the current Caddy-based deployment but are documented for reference.

#### Using Let's Encrypt with Certbot

1. Install Certbot:
```bash
apt-get update
apt-get install certbot python3-certbot-nginx
```

2. Obtain Certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. Auto-renewal:
```bash
certbot renew --dry-run
```

#### Nginx SSL Configuration

Update `nginx/conf.d/production.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Your existing location blocks...
}
```

## Security Checklist

### Pre-Deployment

- [ ] `DJANGO_DEBUG=False`
- [ ] Strong `DJANGO_SECRET_KEY` generated
- [ ] `DJANGO_ALLOWED_HOSTS` configured with actual domains
- [ ] Database password changed from default
- [ ] Email credentials configured
- [ ] HTTPS/SSL certificates installed
- [ ] CORS origins restricted to production domains
- [ ] JWT token lifetimes configured appropriately
- [ ] All secrets stored in environment variables
- [ ] `.env` files not committed to version control

### Post-Deployment

- [ ] Run `python manage.py check --deploy`
- [ ] Test all authentication flows
- [ ] Verify HTTPS redirects work
- [ ] Test CORS from frontend domain
- [ ] Verify static files serve correctly
- [ ] Check database connections
- [ ] Verify email delivery
- [ ] Test JWT token refresh
- [ ] Monitor logs for errors
- [ ] Set up automated backups
- [ ] Configure log aggregation
- [ ] Set up monitoring/alerting

### Regular Security Maintenance

- [ ] Update dependencies regularly
- [ ] Review and rotate secrets quarterly
- [ ] Monitor for security advisories
- [ ] Perform security audits
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Update SSL certificates before expiry

## Security Tools

### Running Security Checks

```bash
# Django security check
python manage.py check --deploy

# Check for dependency vulnerabilities
pip-audit

# Run CodeQL analysis (GitHub Actions)
# See .github/workflows/codeql.yml
```

### Recommended Tools

- **pip-audit**: Check Python dependencies for known vulnerabilities
- **safety**: Alternative dependency checker
- **bandit**: Find common security issues in Python code
- **CodeQL**: Automated security scanning (GitHub)
- **Dependabot**: Automated dependency updates (GitHub)

## Monitoring & Logging

### Application Logging

Configure proper logging in production:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': '/var/log/sims/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Security Event Monitoring

Monitor for:
- Failed login attempts
- Permission denied errors
- SQL injection attempts
- XSS attempts
- Unusual API access patterns
- High rate of 4xx/5xx errors

## Backup & Recovery

### Database Backups

```bash
# Manual backup
docker compose exec postgres pg_dump -U sims_user sims_db > backup.sql

# Restore
docker compose exec -T postgres psql -U sims_user sims_db < backup.sql
```

### Automated Backups

Set up cron job:
```bash
0 2 * * * /path/to/backup-script.sh
```

## Support & Resources

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Emergency Contacts

In case of security incident:
1. Disable affected services immediately
2. Document the incident
3. Notify system administrator
4. Review logs for breach extent
5. Apply security patches
6. Rotate all credentials
7. Notify affected users if required
