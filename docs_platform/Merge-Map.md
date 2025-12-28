# Merge Map (Repositories → Modules)

## Source repos you provided
- `fmu-main` (UG SIMS backbone) ✅ base repo for unified platform
- `sims-main` (Postgraduate SIMS) → module `pg_sims`
- `consult-main` (Online Consultation) → module `consult`
- `Resultportal-main` (Results workflow + publish/verify) → module `results_portal`
- `result-main` (Flask prototype) 🗑 archive only (do not merge; keep as reference)

## Priority order (recommended)
1. `core` (Google SSO + roles/permissions + audit + notifications)
2. `intake_onboarding` (public intake form + verification queue + approval)
3. `results_portal` (verify/publish workflow)
4. `attendance` (next module branch to create)
5. `pg_sims`
6. `consult`

## Collision watchlist (things we will normalize in core)
- Multiple user models / auth flows across repos
- Different API path conventions
- Different Docker/Reverse-proxy approaches (nginx vs traefik)
- Overlapping “results” concepts (raw marks vs publish workflow)
