#!/usr/bin/env python3

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import List, Tuple

try:
    from playwright.async_api import async_playwright, Page, Browser
except ImportError:
    print("Error: Playwright is not installed.")
    print("Please install it with: pip install playwright && playwright install chromium")
    sys.exit(1)

# Configuration
DEFAULT_BASE_URL = "https://sims.alshifalab.pk"

# Default credentials for different roles
# These can be overridden by environment variables
CREDENTIALS = {
    "Admin": {
        "username": os.environ.get("FMU_ADMIN_USERNAME", "admin"),
        "password": os.environ.get("FMU_ADMIN_PASSWORD", "admin123")
    },
    "Faculty": {
        "username": os.environ.get("FMU_FACULTY_USERNAME", "demo_faculty1"),
        "password": os.environ.get("FMU_FACULTY_PASSWORD", "faculty123")
    },
    "Student": {
        "username": os.environ.get("FMU_STUDENT_USERNAME", "demo_student001"),
        "password": os.environ.get("FMU_STUDENT_PASSWORD", "demo123")
    },
    "Registrar": {
        # Fallback to admin if specific registrar not available, or assume admin works if multi-role
        "username": os.environ.get("FMU_REGISTRAR_USERNAME", "admin"),
        "password": os.environ.get("FMU_REGISTRAR_PASSWORD", "admin123")
    },
    "ExamCell": {
         # Fallback to admin if specific exam cell user not available
        "username": os.environ.get("FMU_EXAMCELL_USERNAME", "admin"),
        "password": os.environ.get("FMU_EXAMCELL_PASSWORD", "admin123")
    },
    "Finance": {
        # Fallback to admin
        "username": os.environ.get("FMU_FINANCE_USERNAME", "admin"),
        "password": os.environ.get("FMU_FINANCE_PASSWORD", "admin123")
    }
}


# Define all pages to capture with their routes, descriptions, and REQUIRED ROLE
# If role is None, it is public.
# If role is specified, we will attempt to capture it using that role's credentials.
PAGES_TO_CAPTURE: List[Tuple[str, str, str]] = [
    # (route, description, required_role)
    
    # --- Public Pages ---
    ("/login", "Login Page", None),
    ("/apply", "Student Application Page", None),

    # --- Admin Pages ---
    ("/dashboard", "Main Dashboard Home (Admin View)", "Admin"),
    ("/dashboard/admin", "Admin Dashboard", "Admin"),
    ("/admin/dashboard", "Admin Analytics Dashboard", "Admin"), # Keep if this route exists, otherwise remove/update
    ("/system/users", "Users Management Page", "Admin"),
    ("/system/roles", "Roles Management Page", "Admin"),
    ("/system/syllabus", "Syllabus Manager Page", "Admin"),
    ("/system/settings", "Admin Settings Page", "Admin"),
    ("/system/audit", "Audit Log Page", "Admin"),
    ("/system/students/import", "Student Import Page", "Admin"),
    
    # --- Finance Module (Admin/Finance) ---
    ("/finance", "Finance Dashboard", "Admin"),
    ("/finance/fee-plans", "Fee Plans Page", "Admin"),
    ("/finance/vouchers", "Voucher Generation Page", "Admin"),
    ("/finance/vouchers/list", "Vouchers List Page", "Admin"),
    ("/finance/payments", "Payments Page", "Admin"),
    ("/finance/reports/defaulters", "Defaulters Report", "Admin"),
    ("/finance/reports/collection", "Collection Report", "Admin"),
    ("/finance/reports/aging", "Aging Report", "Admin"),
    
    # --- Academics Module (Admin/Registrar) ---
    ("/academics/programs", "Programs Page", "Admin"),
    ("/academics/programs/new", "New Program Page", "Admin"),
    ("/academics/batches", "Batches Page", "Admin"),
    ("/academics/periods", "Academic Periods Page", "Admin"),
    ("/academics/groups", "Groups Page", "Admin"),
    ("/academics/departments", "Departments Page", "Admin"),
    ("/courses", "Courses Page", "Admin"),
    ("/sections", "Sections Page", "Admin"),
    ("/timetable", "Timetable Page", "Admin"),

    # --- Student Management (Admin/Registrar) ---
    ("/students", "Students Page", "Admin"),
    ("/transcripts", "Transcripts Page (Admin View)", "Admin"),

    # --- Registrar Pages ---
    ("/dashboard/registrar", "Registrar Dashboard", "Registrar"),
    ("/attendance/eligibility", "Eligibility Report", "Registrar"),

    # --- Faculty Pages ---
    ("/dashboard/faculty", "Faculty Dashboard", "Faculty"),
    ("/attendance", "Attendance Dashboard", "Faculty"),
    ("/attendance/input", "Attendance Input Page", "Faculty"),
    ("/attendance/bulk", "Bulk Attendance Page", "Faculty"),
    ("/gradebook", "Gradebook Page", "Faculty"),
    # Timetable is also visible to faculty
    
    # --- Student Pages ---
    ("/dashboard/student", "Student Dashboard", "Student"),
    ("/finance/me", "Student Finance Page", "Student"),
    ("/finance/reports/statement", "Student Statement Report", "Student"),
    ("/results", "Results Page", "Student"),
    # Timetable is also visible to student

    # --- Exam Cell Pages ---
    ("/dashboard/examcell", "Exam Cell Dashboard", "ExamCell"),
    ("/exams", "Exams Page", "ExamCell"),
    ("/examcell/publish", "Publish Results Page", "ExamCell"),
    
    # --- Other ---
    ("/analytics", "Analytics Dashboard", "Admin"),
    ("/profile", "Profile Page", "Admin"),
    ("/notifications", "Notifications Page", "Admin"),
    ("/demo/datatable", "DataTable Demo", "Admin"),
]


async def login(page: Page, username: str, password: str, base_url: str) -> bool:
    """Login to the application."""
    try:
        login_url = f"{base_url}/login"
        print(f"  Navigating to login page...")
        await page.goto(login_url, wait_until="networkidle", timeout=30000)
        
        # Check if already logged in (redirected to dashboard)
        if "/login" not in page.url:
             print("  Already logged in!")
             return True

        # Wait for form to be ready - wait for the identifier input specifically
        print(f"  Waiting for login form...")
        try:
            # Wait for the identifier input (react-hook-form uses name="identifier")
            await page.wait_for_selector('input[name="identifier"]', timeout=5000)
        except:
             # Fallback
             pass
        
        # Fill identifier field
        print(f"  Filling username: {username}") # Don't print password
        
        identifier_filled = False
        identifier_selectors = [
            'input[name="identifier"]',
            'input[type="text"]:not([type="password"])',
            'input[autocomplete="username"]',
        ]
        
        for selector in identifier_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    await element.fill('')
                    await element.type(username, delay=50)
                    identifier_filled = True
                    break
            except:
                continue
        
        if not identifier_filled:
            print(f"  ✗ Could not find identifier input field")
            return False
        
        # Fill password field
        password_filled = False
        try:
            password_input = await page.query_selector('input[type="password"]')
            if password_input:
                await password_input.fill('')
                await password_input.type(password, delay=50)
                password_filled = True
        except:
            pass
        
        if not password_filled:
            print(f"  ✗ Could not find password input field")
            return False
        
        # Submit form
        print(f"  Submitting login form...")
        
        # Try various submit buttons or Enter key
        try:
            await page.press('input[type="password"]', 'Enter')
        except:
            submit_btn = await page.query_selector('button[type="submit"]')
            if submit_btn:
                await submit_btn.click()
        
        # Wait for navigation
        print(f"  Waiting for login to complete...")
        try:
            await page.wait_for_function(
                '() => !window.location.pathname.includes("/login")',
                timeout=15000
            )
        except:
            pass
            
        current_url = page.url
        if "/login" not in current_url:
            print(f"  ✓ Login successful - redirected to: {current_url}")
            await page.wait_for_timeout(1000)
            return True
        else:
            print(f"  ✗ Login failed - still on login page")
            return False
            
    except Exception as e:
        print(f"  ✗ Login error: {str(e)}")
        return False

async def logout(page: Page, base_url: str):
    """Logout the current user."""
    try:
        print("  Logging out...")
        # Common pattern: click profile menu then logout
        # OR just clear cookies/storage
        # Since we are automating, clearing storage is safer and faster
        await page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        await page.context.clear_cookies()
        await page.goto(f"{base_url}/login")
        print("  ✓ Logged out")
    except Exception as e:
        print(f"  ⚠️ Error logging out: {e}")

async def capture_screenshot(
    page: Page,
    route: str,
    output_dir: Path,
    base_url: str,
    wait_time: int = 2000,
) -> bool:
    """Capture a screenshot of a specific route."""
    try:
        full_url = f"{base_url}{route}"
        print(f"  Navigating to {full_url}...")
        
        await page.goto(full_url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(wait_time)
        
        # Generate filename from route
        filename = route.strip("/").replace("/", "_") or "home"
        if not filename:
            filename = "home"
        filename = f"{filename}.png"
        filepath = output_dir / filename
        
        await page.screenshot(path=str(filepath), full_page=True)
        print(f"  ✓ Screenshot saved: {filepath}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error capturing {route}: {e}")
        return False


async def main():
    parser = argparse.ArgumentParser(description="Capture screenshots of FMU Platform frontend pages")
    parser.add_argument("--url", type=str, default=DEFAULT_BASE_URL, help=f"Base URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--output", type=str, default="screenshots", help="Output directory")
    parser.add_argument("--wait", type=int, default=2000, help="Wait time (ms)")
    parser.add_argument("--role", type=str, default=None, help="Capture only pages for a specific role (e.g. Admin, Student)")
    parser.add_argument(
        "--pages",
        type=str,
        nargs="+",
        default=None,
        help="Specific pages to capture (by route, e.g., /dashboard /finance). If specified, filters the list."
    )
    
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📸 Starting Multi-Role Screenshot Capture")
    print(f"Base URL: {args.url}")
    print(f"Output: {output_dir.absolute()}\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()

        # Filter pages if requested
        pages_to_capture = PAGES_TO_CAPTURE
        if args.pages:
            requested = set(args.pages)
            pages_to_capture = [p for p in PAGES_TO_CAPTURE if p[0] in requested]
            if not pages_to_capture:
                 print(f"Warning: No matching pages found for {args.pages}")

        # 1. Capture Public Pages first (no login needed)
        print("=== Capturing Public Pages ===")
        public_pages = [p for p in pages_to_capture if p[2] is None]
        for route, desc, _ in public_pages:
            print(f"📄 {desc} ({route})")
            await capture_screenshot(page, route, output_dir, args.url, args.wait)
        
        # 2. Group pages by Role
        # If user specified --role, filter by that.
        roles_to_process = CREDENTIALS.keys()
        if args.role:
            if args.role in CREDENTIALS:
                roles_to_process = [args.role]
            else:
                print(f"Error: Unknown role '{args.role}'")
                return

        for role in roles_to_process:
            role_pages = [p for p in pages_to_capture if p[2] == role]
            
            if not role_pages:
                continue
                
            print(f"\n=== Processing Role: {role} ===")
            creds = CREDENTIALS[role]
            
            if not creds["username"] or not creds["password"]:
                print(f"  ⚠️  No credentials configured for {role}. Skipping.")
                continue

            # Login
            print(f"🔐 Logging in as {role} ({creds['username']})...")
            # Ensure logged out first
            await logout(page, args.url)
            
            login_success = await login(page, creds["username"], creds["password"], args.url)
            
            if not login_success:
                print(f"  ❌ Failed to login as {role}. Skipping pages.")
                continue
                
            # Capture pages
            for route, desc, _ in role_pages:
                print(f"📄 {desc} ({route})")
                await capture_screenshot(page, route, output_dir, args.url, args.wait)
                
        await browser.close()
    
    print(f"\n{'='*60}")
    print(f"✅ Capture Complete")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
