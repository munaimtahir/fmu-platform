# Live Demonstration Runbook

The disposable live baseline is created with:

```bash
docker compose exec backend python manage.py seed_live_demo --reset --confirm-reset
```

The reset flushes the application database. Take and validate a PostgreSQL
backup first; this command is only for the agreed no-real-data environment.

## Demonstration accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Faculty | `faculty` | `faculty123` |
| Student | `student` | `student123` |
| Finance | `finance` | `finance123` |

Additional staff walkthrough accounts are `registrar`, `examcell`,
`coordinator`, and `office`, with the matching `...123` password.

## Suggested walkthrough

1. Log in as `admin`; review students by onboarding state, import history,
   compliance rules, academic setup, and audit activity.
2. Log in as `faculty`; open timetable, attendance input, learning materials,
   and gradebook/results.
3. Log in as `student`; show completed profile onboarding, learning feed,
   notifications, timetable, published result, and finance summary.
4. Log in as `finance`; show fee plans, five vouchers in varied states,
   payments, adjustments, ledger, defaulters, and aging reports.

The seed creates 20 linked student records in four onboarding states, and five
or more examples for every user-facing workflow. All generated entities use
the `DEMO_` / `demo_` naming convention.
