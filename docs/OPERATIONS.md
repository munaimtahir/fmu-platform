# Operations Runbook

This is the current operational guide for Vexel MedSIMS. Production runs on the
VM from `/home/munaim/srv/apps/fmu-platform` with the canonical
`docker-compose.yml`, `both.sh`, and host-level Caddy. Historical deployment
patterns and one-time reports are archived and are not operational guidance.

## Production topology

```text
https://sims.vexel.pk
        |
      Caddy (host)
        |
127.0.0.1:18010 -> vexel_medsims_backend
        |
PostgreSQL + Redis -> vexel_medsims_rq_worker
        |
127.0.0.1:18080 -> vexel_medsims_frontend
```

Expected production containers:

- `vexel_medsims_backend`
- `vexel_medsims_frontend`
- `vexel_medsims_db`
- `vexel_medsims_redis`
- `vexel_medsims_rq_worker`

Do not use `docker-compose.prod.yml`, obsolete `fmu_*`/`sims_*` container names,
or Nginx/Certbot instructions for the live deployment.

## Health and service checks

```bash
cd /home/munaim/srv/apps/fmu-platform
docker compose -f docker-compose.yml ps
curl -fsS -H 'X-Forwarded-Proto: https' http://127.0.0.1:18010/api/health/
curl -fsS https://sims.vexel.pk/api/health/
docker compose -f docker-compose.yml logs --tail=200 backend worker
```

`/api/health/` is the readiness authority. It must report `status: ok`, healthy
database and migrations, reachable Redis, and the expected deployed version.

If Redis is unavailable, health is degraded and enqueue operations should fail
with `ASYNC_UNAVAILABLE`; do not treat that as a successful production state.

## Service management

```bash
./both.sh
docker compose -f docker-compose.yml build worker
docker compose -f docker-compose.yml up -d worker
docker compose -f docker-compose.yml restart backend frontend worker
docker compose -f docker-compose.yml logs -f backend
docker compose -f docker-compose.yml logs -f worker
```

Use the production checklist in [`PRODUCTION_RUNBOOK.md`](PRODUCTION_RUNBOOK.md)
for deploys and rollbacks. Take and verify a backup before a deploy, especially
when migrations are involved.

## RQ worker and async jobs

The worker handles transcript generation and notification/email jobs. Verify it
before testing asynchronous features:

```bash
docker compose -f docker-compose.yml ps worker
docker compose -f docker-compose.yml logs --tail=200 worker
docker exec vexel_medsims_backend python manage.py rqstats
```

Production email requires a real SMTP backend. The application must not boot in
production with Django's console email backend. Test both transcript delivery
and notification delivery after SMTP configuration.

## Metrics and monitoring

`GET /metrics` is bearer-token protected:

```bash
curl -fsS -H "Authorization: Bearer $METRICS_TOKEN" https://sims.vexel.pk/metrics
```

Never place `METRICS_TOKEN` in the repository, shell history, issue reports, or
logs. Monitor health, RQ queue depth and failed jobs, disk usage, backup failures,
and certificate expiry.

## Backups

The repository scripts are designed for the VM and cover both PostgreSQL and
`backend/media`:

```bash
./scripts/backup_db.sh
RETENTION_DAYS=30 ./scripts/backup_db.sh
```

The script reads database credentials from the database container environment,
creates `db-<timestamp>.sql.gz` and `media-<timestamp>.tar.gz`, validates both
archives with `gzip -t`, and applies retention. Backups must remain untracked
and must be copied to an approved encrypted off-host destination before the
schedule is considered production-ready.

## Restore rehearsal and recovery

Restore is destructive and requires an approved maintenance window:

```bash
CONFIRM_RESTORE=YES ./scripts/restore_db.sh backups/db-<timestamp>.sql.gz
CONFIRM_RESTORE=YES MEDIA_ARCHIVE=backups/media-<timestamp>.tar.gz \
  ./scripts/restore_db.sh backups/db-<timestamp>.sql.gz
```

For rehearsal, restore into a disposable PostgreSQL instance on
`127.0.0.1:15499`, use a temporary media root and secret key, run migrations,
check health, and remove the throwaway instance afterward. Record RPO and RTO.
Never restore a production dump into a live database without an explicit
rollback plan.

## Configuration requirements

Production must have:

- `DJANGO_DEBUG=False`;
- `DJANGO_ALLOWED_HOSTS=sims.vexel.pk`;
- `CORS_ALLOWED_ORIGINS=https://sims.vexel.pk`;
- matching CSRF trusted origins;
- a unique `DJANGO_SECRET_KEY` stored only in the VM secret environment;
- real SMTP configuration;
- Redis reachable through the configured URL/host/port;
- a high-entropy `METRICS_TOKEN` if metrics scraping is enabled.

See [`ENV.md`](ENV.md) for the variable contract. Do not copy production
`.env` values into documentation or test fixtures.

## Incident and rollback rules

Trigger rollback if deployment fails, health is not `ok`, the worker is unhealthy,
representative user pages fail, or logs show repeated post-deploy exceptions.
Use the image IDs captured before rebuilding and follow the rollback procedure in
`PRODUCTION_RUNBOOK.md`. Restore the database only when a migration caused data
damage; code/image rollback alone is preferred otherwise.
