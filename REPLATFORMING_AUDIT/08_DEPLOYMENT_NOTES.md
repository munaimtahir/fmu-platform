# Deployment notes

Set `PUBLIC_APP_DOMAIN=sims.vexel.pk` and configure the matching HTTPS host in `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`. Keep `VITE_API_URL=/` for same-origin deployment so the frontend uses `/api/` and `/admin/` on the configured host.

The validated local Compose database uses `DB_NAME=vexel_medsims`, `DB_USER=vexel_medsims_app`, `DB_HOST=db`, and `DB_PORT=5432`. The generated local password is stored only in the ignored `.env`; `.env.example` contains a safe placeholder.

Configure the institution variables and `DEFAULT_FROM_EMAIL` in the deployment secret/environment store. DNS, TLS certificates, and production database credentials are verified for the current deployment. Production SMTP credentials remain intentionally deferred and are non-blocking. The previous PostgreSQL volumes remain available for separate cleanup review.

The old volumes were not modified: `fmu-platform_fmu_db_data` (approximately 45.8 MB) and `PROD_fmu_pgdata` (approximately 66.8 MB). The validated replacement volume is `vexel_medsims_postgres_data` (approximately 68.5 MB). Their sizes were measured without reading or altering database contents; retain the old volumes until an independent cleanup decision.
