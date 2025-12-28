
# Debugging Django `app_label` errors (Automated)

This pack adds a diagnostic workflow that prints *exact* mismatches causing
`Model class ... doesn't declare an explicit app_label and isn't in an application in INSTALLED_APPS`.

## What it does
- Validates that each app has `__init__.py`.
- Validates `apps.py` → `name` and `label` are consistent.
- Validates `INSTALLED_APPS` uses module paths (e.g., `sims_backend.admissions`).
- Scans models for direct cross-app imports that should be lazy strings.
- Inspects migrations dependencies for correct labels.
- Prints the Django app registry and resolves known models.

## How to use (GitHub Web, no terminal)
1. Create a branch (e.g., `fix/app-label-diagnostics`).
2. Upload these files at the repo root (keep folder structure):
   - `tools/diagnose_app_labels.py`
   - `.github/workflows/diagnose.yml`
   - `Docs/DEBUG-APP-LABEL.md` (this file)
3. Open a Pull Request to `main`. GitHub Actions will run and print the report.
4. Open the workflow logs and follow the FIX suggestions in the output.
5. Commit the edits in the web editor; re-run the workflow.

## After it passes
- Remove the workflow or keep it until CI is consistently green.
