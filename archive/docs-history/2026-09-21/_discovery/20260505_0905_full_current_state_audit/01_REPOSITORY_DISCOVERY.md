# 01. Repository Structure Discovery

**Date**: Tue May 5 09:05:42 UTC 2026

## Overview
The repository is structured as a full-stack Django/React application with a modular backend and standard Vite React frontend.

## Major Directories Found
- **`backend/`**: Django backend directory. Contains `sims_backend` (the main active domain apps) and `config` (likely legacy or alternative settings). Appears to contain many domain-specific apps like `academics`, `attendance`, `students`, `results`, `finance`, etc.
- **`frontend/`**: React/Vite frontend. Contains `src/` with `api`, `components`, `features`, `pages`, `routes`, etc. Also contains an `e2e` folder for Playwright tests.
- **`docs/`**: Extensive documentation folder with various operational, architectural, and historical subfolders (`_cleanup`, `_debt`, `adr`, `reports`, `verification`).
- **`docs_platform/`**: Additional documentation platform files.
- **`ops/`**: Operational scripts (`deploy.sh`, `start.sh`, `stop.sh`, etc.).
- **`scripts/`**: Miscellaneous Python/bash scripts for utility tasks.
- **`archive/`**: Extensive archive of previous assessments, diagrams, and older code iterations.
- **`modules/`**: Contains top-level modules like `consult`, `core`, `intake_onboarding`, `pg_sims`, `results_portal`. This seems to be either shared modules or transitionary architecture.

## Configuration & Root Files
- Docker compose files exist (`docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`).
- Typical CI/CD folder structure (`.github/workflows`).
- Python ecosystem files in `backend/` (`pyproject.toml`, `pytest.ini`, `requirements.txt`).
- Node ecosystem files in `frontend/` (`package.json`, `vite.config.ts`, `playwright.config.ts`).

## Observations & Risks
- **Duplicate Docs**: There are many old and archived folders (`archive/`, `docs/_cleanup`, `docs/_debt`). These may mislead AI agents or developers.
- **Backend Duplication**: The backend contains both `apps/intake` and `sims_backend/...`, as well as a root-level `modules/` folder. This implies some architectural migration has happened or is ongoing.
- **Expected vs Actual Structure**: Mostly aligns with a standard monorepo structure, but the presence of top-level `modules/` outside of `backend/` requires further investigation to see how they are integrated.