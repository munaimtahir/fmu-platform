# Caddy Reverse Proxy Configuration

This document provides Caddy configuration for routing requests to the FMU Platform MVP backend and frontend services.

## Overview

Caddy acts as a reverse proxy in front of:
- Backend API: Django REST Framework (typically port 8000)
- Frontend: Static files or development server (typically port 5173)

## Basic Configuration

### Caddyfile (Simple Setup)

```caddyfile
# FMU Platform MVP - Production Configuration

:80 {
    # Frontend (React app)
    handle / {
        root * /var/www/fmu-frontend/dist
        try_files {path} /index.html
        file_server
    }

    # Backend API
    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Admin panel
    handle /admin/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Static files (Django)
    handle /static/* {
        reverse_proxy localhost:8000
    }

    # Media files (Django)
    handle /media/* {
        reverse_proxy localhost:8000
    }

    # Health check
    handle /health {
        reverse_proxy localhost:8000
    }

    # OpenAPI schema
    handle /api/schema/* {
        reverse_proxy localhost:8000
    }

    # API documentation
    handle /api/docs/* {
        reverse_proxy localhost:8000
    }
}
```

## Production Configuration with HTTPS

### Caddyfile (HTTPS with Automatic Let's Encrypt)

```caddyfile
# FMU Platform MVP - Production with HTTPS

sims.example.com {
    # Enable automatic HTTPS
    encode gzip

    # Frontend (React app)
    handle / {
        root * /var/www/fmu-frontend/dist
        try_files {path} /index.html
        file_server
    }

    # Backend API
    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Admin panel
    handle /admin/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Static files
    handle /static/* {
        reverse_proxy localhost:8000
    }

    # Media files
    handle /media/* {
        reverse_proxy localhost:8000
    }

    # Health check
    handle /health {
        reverse_proxy localhost:8000
    }

    # API documentation
    handle /api/docs/* {
        reverse_proxy localhost:8000
    }

    handle /api/schema/* {
        reverse_proxy localhost:8000
    }

    handle /api/redoc/* {
        reverse_proxy localhost:8000
    }
}
```

## Development Configuration

### Caddyfile (Development with separate frontend dev server)

```caddyfile
# FMU Platform MVP - Development Configuration

localhost {
    # Frontend (Vite dev server)
    handle / {
        reverse_proxy localhost:5173 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Backend API
    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Admin panel
    handle /admin/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Static files
    handle /static/* {
        reverse_proxy localhost:8000
    }

    # Media files
    handle /media/* {
        reverse_proxy localhost:8000
    }

    # Health check
    handle /health {
        reverse_proxy localhost:8000
    }
}
```

## Multiple Domains

```caddyfile
# FMU Platform MVP - Multiple Domains

sims.example.com {
    # ... same as production config above
}

api.example.com {
    # API-only subdomain
    encode gzip

    handle / {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }
}
```

## CORS Configuration Note

When using Caddy, ensure Django's `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` settings include your Caddy domain(s).

Example:
```bash
CORS_ALLOWED_ORIGINS=https://sims.example.com,http://localhost
CSRF_TRUSTED_ORIGINS=https://sims.example.com,http://localhost
```

## Docker Compose Integration

If running with Docker Compose, update the backend service port mapping and Caddy configuration:

```yaml
# docker-compose.yml
services:
  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - app-network

  backend:
    # ... backend configuration
    networks:
      - app-network

  frontend:
    # ... frontend configuration
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
```

Update Caddyfile to use service names:
```caddyfile
localhost {
    handle /api/* {
        reverse_proxy backend:8000
    }
    
    handle / {
        reverse_proxy frontend:5173
    }
}
```

## Testing Configuration

Test your Caddy configuration:

```bash
# Validate Caddyfile
caddy validate --config Caddyfile

# Test configuration (dry run)
caddy adapt --config Caddyfile

# Start Caddy
caddy run --config Caddyfile
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check backend service is running on port 8000
   - Verify network connectivity
   - Check backend logs

2. **CORS Errors**
   - Ensure `CORS_ALLOWED_ORIGINS` includes Caddy domain
   - Check `Access-Control-Allow-Origin` headers in response

3. **Static Files Not Loading**
   - Verify `STATIC_ROOT` is correctly set
   - Run `python manage.py collectstatic`
   - Check file permissions

4. **HTTPS Not Working**
   - Verify domain DNS points to server
   - Check port 80/443 are open
   - Review Caddy logs for Let's Encrypt errors

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting for API endpoints
2. **Security Headers**: Add security headers via Caddy
3. **IP Whitelisting**: Restrict admin panel access if needed
4. **Logging**: Enable access logs for audit trails

Example with security headers:
```caddyfile
sims.example.com {
    header {
        # Security headers
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # ... rest of configuration
}
```

