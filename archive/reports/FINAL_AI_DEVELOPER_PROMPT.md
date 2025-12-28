# FMU SIMS — Final AI Developer Prompt (Hardened)

    ## Mission
    Build a university Student Information Management System with modules:
    admissions, enrollment, attendance, assessments, results publishing, and transcript verification.

    ## Non-Goals (now)
    No HR/payroll, no hostel/transport, no research grants.

    ## Guardrails
    - Follow DRF/React patterns in existing repo structure.
    - Backend: ruff+black+isort+mypy; FE: eslint+prettier+typecheck.
    - Tests first for new endpoints/components.

    ## Directory Contract
    Do not rename core directories without an ADR. Keep files close to their domains.

    ## Security
    - Use role-based permissions; audit every write.
    - No PII in logs; secrets via env only.
    - JWT short expiry, refresh tokens rotated.

    ## Acceptance
    - CI green (lint, type, tests, coverage gates).
    - Docs updated (API/ERD/ENV).
    - CHANGELOG updated.
    - Demo fixtures seedable.

    ## Addendum: Enforcement & Outputs
    1) Code Quality Gates
       - BE coverage ≥ 80%; FE coverage ≥ 70%.
    2) Docs Autoupdate
       - If models/api change, update Docs/ and regenerate schema.
    3) Security & Auditing
       - All writes: actor+timestamp+summary.
    4) Demo Readiness
       - `make demo` or script to seed fixtures.
    5) Deliverables
       - Passing CI badge; Docker image built; screenshots for UI changes.
