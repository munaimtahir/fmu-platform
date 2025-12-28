# FMU Platform (Unified Repo Scaffold)

This is a **centered repo scaffold** based on `fmu-main`, prepared for modular merges.

## What is included now
- Existing `fmu-main` backend + frontend structure
- `modules/` placeholders for planned merges
- `docs_platform/` governance docs (branch rules + merge map + DoD template)

## Next actions (high level)
1) Create git repo from this folder, push to GitHub as `fmu-platform`.
2) Create branches:
   - `core/google-sso`
   - `module/intake_onboarding`
   - `module/results_portal`
   - `module/pg_sims`
   - `module/consult`
3) Start with `core/google-sso` then `module/intake_onboarding`.

## Notes
- This scaffold does not yet import code from the other repos; it is the clean “center” you requested.
- Merges will be done module-by-module to avoid breaking main.
