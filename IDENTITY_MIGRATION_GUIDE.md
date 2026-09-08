# Vexel MedSIMS identity migration guide

Vexel MedSIMS is the platform provided by Vexel. The medical college using a deployment is configured independently and remains the dominant identity in operational academic screens.

Set the platform and institution variables in `.env` for Django and pass the matching `VITE_*` values at frontend build time. The canonical deployment variable names are listed in `.env.example`; `PUBLIC_APP_DOMAIN` controls same-origin deployment at `/`, `/api/`, and `/admin/`.

The migration is schema-free. No tables, primary keys, migrations, audit history, or academic APIs were renamed or reset. Registration numbers remain free-form unique values, and institution email generation uses `INSTITUTION_EMAIL_DOMAIN`.

The old FMU-specific runtime paths and domains are removed. Historical reports and archived project records retain legacy references where they document prior development. The current deployment uses `sims.vexel.pk` by setting `PUBLIC_APP_DOMAIN` and the corresponding host/origin allowlists.
