# UI validation

Live validation used the fresh PostgreSQL stack and Playwright Chromium. Login succeeded for Admin, Registrar, Faculty, and Student demo users; dashboard and role routes were visited; the Django admin login page returned HTTP 200. Screenshots are stored under `REPLATFORMING_AUDIT/screenshots/`.

The login, application, four role dashboards, academic/student/attendance/assessment/results/transcript/request routes, and Django admin page were checked for active FMU/domain references. The captured pages present `Example Medical College · Vexel MedSIMS` and contained no FMU references.
