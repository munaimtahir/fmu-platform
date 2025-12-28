# Archive Directory

This directory contains historical files, reports, and legacy content that are no longer actively used but preserved for reference.

## Structure

### `/reports`
Historical completion reports, deployment notes, and project milestone documents from various development phases. These include:
- AI agent guidelines and completion summaries
- Bug fix reports and remediation summaries
- Deployment checklists and review documents
- Migration logs and workflow fix summaries
- Phase completion reports (Stage 1-4)
- Frontend and backend integration reports
- Autonomous release framework documentation
- QA checklists and acceptance criteria

### `/diagnostics`
Historical diagnostic reports and verification logs, primarily from October 2025:
- Jazzmin Django admin theme diagnostic reports
- Autonomous release implementation summaries
- Verification checklists and final summaries

### `/logs`
Historical log files from various operations and deployments:
- `all.txt` - Deployment logs from Docker operations

### `/backend-docs`
Legacy backend documentation:
- `coverage_analysis.md` - Historical test coverage analysis

### `/seed-data`
Old seed data files (replaced by management commands):
- `demo_students.json` - Legacy demo student data (now use `python manage.py seed_demo`)

## Note

None of these files are required for running the application. The current, active documentation is in the `/docs` directory at the project root.

For active seed data generation, use:
```bash
docker compose exec backend python manage.py seed_demo --students 30
```
