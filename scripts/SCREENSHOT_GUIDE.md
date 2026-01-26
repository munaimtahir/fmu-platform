# Screenshot Capture Guide

This guide explains how to capture screenshots of all dashboard and module pages in the FMU Platform frontend.

## Prerequisites

1. **Install Playwright** (for automated screenshots):
   ```bash
   pip install playwright
   playwright install chromium
   ```

2. **Ensure the application is running**:
   - Development: `npm run dev` (runs on http://localhost:5173)
   - Docker: `docker compose up` (runs on http://localhost:8080)
   - Production: Access your production URL

## Automated Screenshot Capture

### Basic Usage

Capture all pages from production (default URL is now https://sims.alshifalab.pk):

```bash
# From the project root directory
python3 scripts/capture_screenshots.py \
  --output screenshots/ \
  --username admin \
  --password admin123
```

**Where to run:** Open a terminal/command prompt and navigate to your project directory (`/home/munaim/srv/apps/fmu-platform`), then run the command above.

### Options

- `--url`: Base URL of the frontend (default: https://sims.alshifalab.pk)
- `--output`: Output directory for screenshots (default: screenshots/)
- `--username`: Username for authentication (optional, defaults to `admin` or env var `FMU_ADMIN_USERNAME`)
- `--password`: Password for authentication (optional, defaults to `admin123` or env var `FMU_ADMIN_PASSWORD`)
- `--wait`: Wait time in milliseconds after page load (default: 2000)
- `--pages`: Capture specific pages only (e.g., `--pages /dashboard /finance`)

### Authentication Configuration

You can configure authentication in three ways:
1. **Command Line Arguments**: Pass `--username` and `--password` flags (overrides all other settings).
2. **Environment Variables**: Set `FMU_ADMIN_USERNAME` and `FMU_ADMIN_PASSWORD` in your environment.
3. **Script Configuration**: Edit the `DEFAULT_USERNAME` and `DEFAULT_PASSWORD` variables at the top of `scripts/capture_screenshots.py`.


### Examples

**Capture all pages from production (default):**
```bash
python3 scripts/capture_screenshots.py \
  --output screenshots/ \
  --username admin \
  --password admin123
```

**Capture from localhost (for development):**
```bash
python3 scripts/capture_screenshots.py \
  --url http://localhost:5173 \
  --output screenshots/ \
  --username admin \
  --password admin123
```

**Capture only dashboards:**
```bash
python scripts/capture_screenshots.py \
  --url http://localhost:5173 \
  --output screenshots/dashboards/ \
  --username admin \
  --password admin123 \
  --pages /dashboard /dashboard/admin /dashboard/registrar /dashboard/faculty /dashboard/student /dashboard/examcell
```

**Capture only finance module:**
```bash
python scripts/capture_screenshots.py \
  --url http://localhost:5173 \
  --output screenshots/finance/ \
  --username admin \
  --password admin123 \
  --pages /finance /finance/fee-plans /finance/vouchers /finance/payments
```

**Capture only Admin module:**
```bash
python scripts/capture_screenshots.py \
  --url http://localhost:5173 \
  --output screenshots/admin/ \
  --username admin \
  --password admin123 \
  --pages /admin/dashboard /admin/users /admin/roles /admin/settings /admin/audit
```

**Capture public pages only (no login required):**
```bash
python scripts/capture_screenshots.py \
  --url http://localhost:5173 \
  --output screenshots/public/ \
  --pages /login /apply
```

## Manual Screenshot Capture

If you prefer to take screenshots manually:

### Using Browser Developer Tools

1. Open the page in your browser
2. Press `F12` to open Developer Tools
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "screenshot" and select:
   - **Capture full size screenshot** - for full page
   - **Capture node screenshot** - for specific element
   - **Capture screenshot** - for viewport

### Using Browser Extensions

Popular extensions for full-page screenshots:
- **Full Page Screen Capture** (Chrome/Edge)
- **Fireshot** (Chrome/Firefox)
- **Awesome Screenshot** (Chrome/Firefox)

### Using Command Line Tools

**Using Playwright CLI:**
```bash
npx playwright screenshot http://localhost:5173/dashboard screenshots/dashboard.png --full-page
```

**Using Puppeteer:**
```bash
npx puppeteer screenshot --url http://localhost:5173/dashboard --output screenshots/dashboard.png
```

## Pages to Capture
    
### Authentication Pages
- `/login` - Login page

### Main Dashboards
- `/dashboard` - Main dashboard (redirects to role-specific)
- `/dashboard/admin` - Admin dashboard
- `/dashboard/registrar` - Registrar dashboard
- `/dashboard/faculty` - Faculty dashboard
- `/dashboard/student` - Student dashboard
- `/dashboard/examcell` - Exam Cell dashboard

### Demo Pages
- `/demo/datatable` - DataTable demo

### Finance Module
- `/finance` - Finance dashboard
- `/finance/fee-plans` - Fee plans management
- `/finance/vouchers` - Voucher generation
- `/finance/vouchers/list` - Vouchers list
- `/finance/payments` - Payments management
- `/finance/me` - Student finance view
- `/finance/reports/defaulters` - Defaulters report
- `/finance/reports/collection` - Collection report
- `/finance/reports/aging` - Aging report
- `/finance/reports/statement` - Student statement

### Attendance Module
- `/attendance` - Attendance dashboard
- `/attendance/input` - Attendance input
- `/attendance/eligibility` - Eligibility report
- `/attendance/bulk` - Bulk attendance

### Academics Module
- `/academics/programs` - Programs management
- `/academics/programs/new` - New program form
- `/academics/batches` - Batches management
- `/academics/periods` - Academic periods
- `/academics/groups` - Groups management
- `/academics/departments` - Departments management

### Student Management
- `/students` - Students list
- `/admin/students/import` - Student import

### Course Management
- `/courses` - Courses management
- `/sections` - Sections management
- `/timetable` - Timetable

### Assessments & Exams
- `/gradebook` - Gradebook
- `/exams` - Exams management
- `/results` - Results view
- `/examcell/publish` - Publish results

### Admin Pages
- `/admin/dashboard` - Admin dashboard (analytics/overview)
- `/admin/users` - Users management
- `/admin/roles` - Roles management
- `/admin/syllabus` - Syllabus manager
- `/admin/settings` - Admin settings
- `/admin/audit` - Audit log

### Other Pages
- `/analytics` - Analytics dashboard
- `/profile` - User profile
- `/notifications` - Notifications
- `/transcripts` - Transcripts
- `/apply` - Student application (public)

## Tips

1. **Wait for content to load**: Some pages have dynamic content. The script waits 2 seconds by default, but you may need to increase this with `--wait` for slower pages.

2. **Different user roles**: Some pages are role-specific. You may need to capture them with different user accounts:
   ```bash
   # Admin pages
   python scripts/capture_screenshots.py --username admin --password admin123 ...
   
   # Student pages
   python scripts/capture_screenshots.py --username student --password student123 ...
   ```

3. **Full page screenshots**: The script captures full-page screenshots by default. This ensures all content is visible, even if it requires scrolling.

4. **Organize by module**: Create separate directories for different modules:
   ```bash
   python scripts/capture_screenshots.py --output screenshots/finance/ --pages /finance ...
   python scripts/capture_screenshots.py --output screenshots/attendance/ --pages /attendance ...
   ```

5. **Production vs Development**: Capture screenshots from both environments to document differences:
   ```bash
   # Development
   python scripts/capture_screenshots.py --url http://localhost:5173 --output screenshots/dev/ ...
   
   # Production
   python scripts/capture_screenshots.py --url https://your-domain.com --output screenshots/prod/ ...
   ```

## Troubleshooting

**Issue: "Playwright is not installed"**
```bash
pip install playwright
playwright install chromium
```

**Issue: "Login failed"**
- Verify credentials are correct
- Check if the application is running
- Ensure the login form fields match the expected selectors

**Issue: "Page not found" or "404"**
- Verify the route exists in `appRoutes.tsx`
- Check if the page requires specific permissions
- Ensure you're logged in with the correct role

**Issue: "Timeout waiting for page"**
- Increase wait time with `--wait 5000`
- Check network connectivity
- Verify the application is accessible at the specified URL

**Issue: "Screenshots are blank or incomplete"**
- Increase wait time to allow dynamic content to load
- Check browser console for JavaScript errors
- Verify the page is fully rendered before screenshot
