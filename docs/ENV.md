# Environment Variables (Truth Table)

    | Name | Type | Default | Required | Scope | Notes |
    |------|------|---------|----------|-------|-------|
    | `DJANGO_DEBUG` | bool | `True` | yes (dev) | backend | `False` for production |
    | `DJANGO_SECRET_KEY` | string | _none_ | yes | backend | Use a strong secret in prod |
    | `DJANGO_ALLOWED_HOSTS` | csv | `localhost,127.0.0.1` | yes | backend | set to the configured `PUBLIC_APP_DOMAIN` in production |
    | `DB_ENGINE` | string | `django.db.backends.postgresql` | yes | backend | Database engine |
    | `DB_NAME` | string | `vexel_medsims` | yes | backend | PostgreSQL database name |
    | `DB_USER` | string | `vexel_medsims_app` | yes | backend | PostgreSQL application user |
    | `DB_PASSWORD` | string | `change-me-in-production` | yes | backend | Store the real secret only in the runtime secret store or ignored `.env` |
    | `DB_HOST` | string | `db` | yes | backend | `db` in Compose, `localhost` for a host process |
    | `DB_PORT` | string | `5432` | yes | backend | Database port |
    | `REDIS_HOST` | string | `localhost` | yes | backend | Redis host for RQ |
    | `REDIS_PORT` | string | `6379` | yes | backend | Redis port |
    | `REDIS_URL` | url | constructed from `REDIS_HOST`/`REDIS_PORT` | no | backend | Redis cache URL; database 1 is used for shared throttle counters |
    | `METRICS_TOKEN` | string | _none_ | yes for metrics | backend | Secret bearer token required to scrape `GET /metrics`; keep out of source control |
    | `API_ANON_THROTTLE` | rate | `60/min` | no | backend | Anonymous API request rate |
    | `API_USER_THROTTLE` | rate | `600/hour` | no | backend | Authenticated API request rate |
    | `EMAIL_BACKEND` | string | `console` | no | backend | Email backend type |
    | `EMAIL_HOST` | string | `smtp.gmail.com` | no | backend | SMTP host |
    | `EMAIL_HOST_USER` | string | _none_ | no | backend | SMTP user |
    | `EMAIL_HOST_PASSWORD` | string | _none_ | no | backend | SMTP password |
    | `CORS_ALLOWED_ORIGINS` | csv | `http://localhost:5173` | yes | backend | Development allow-list; production must be `https://sims.vexel.pk` only |
    | `VITE_API_BASE_URL` | url | `http://localhost:8000` | yes | frontend | Backend API URL |

    - Keep secrets out of the repo. Use `.env` locally; use Docker/CI secrets in prod.
    - See `.env.example` for a complete template with all variables.
