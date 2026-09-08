# Remaining references

Remaining marker matches are classified as follows:

- Historical/archive reports, old verification material, and git metadata: retained to preserve project history.
- Legacy documentation outside the active product guides: retained for traceability and should be archived or rewritten in a later documentation-only pass.
- Repository/project names such as `fmu-platform`, Docker container names, and filesystem paths: internal identifiers retained to avoid technical risk.
- Two legacy logo binaries remain in static/public storage but are no longer referenced by the application; institution branding defaults to a generated initial until `INSTITUTION_LOGO` is configured.
- The active runtime paths audited for Django settings, Jazzmin, emails, frontend UI, import templates, tests, both Compose configurations, deployment scripts, and frontend build defaults no longer depend on FMU/PMC/Faisalabad identity.
- Demo/seed commands use the configured `INSTITUTION_EMAIL_DOMAIN`; they do not hardcode an institutional domain.

The final active-path search should be read with the exclusions documented in `01_IDENTITY_AUDIT.md`; zero raw repository matches would incorrectly erase historical evidence and internal technical names.
