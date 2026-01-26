#!/usr/bin/env python3
"""
Screenshot capture script for FMU Platform frontend pages.

This script captures screenshots of all dashboard and module pages.
It requires the application to be running and accessible.

Usage:
    python scripts/capture_screenshots.py --output screenshots/ --username admin --password admin123
    python scripts/capture_screenshots.py --url http://localhost:5173 --output screenshots/ --username admin --password admin123
"""

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
# You can set default credentials here to avoid typing them every time
# These can be overridden by environment variables or CLI arguments
DEFAULT_USERNAME = os.environ.get("FMU_ADMIN_USERNAME", "admin")
DEFAULT_PASSWORD = os.environ.get("FMU_ADMIN_PASSWORD", "admin123")


# Define all pages to capture with their routes and descriptions
# Define all pages to capture with their routes and descriptions
PAGES_TO_CAPTURE: List[Tuple[str, str, bool]] = [
    # (route, description, requires_auth)
    # Authentication
    ("/login", "Login Page", False),
    
    # Main Dashboard
    ("/dashboard", "Main Dashboard Home", True),
    
    # Role-specific Dashboards
    ("/dashboard/admin", "Admin Dashboard", True),
    ("/dashboard/registrar", "Registrar Dashboard", True),
    ("/dashboard/faculty", "Faculty Dashboard", True),
    ("/dashboard/student", "Student Dashboard", True),
    ("/dashboard/examcell", "Exam Cell Dashboard", True),
    
    # Demo Pages
    ("/demo/datatable", "DataTable Demo", True),

    # Finance Module
    ("/finance", "Finance Dashboard", True),
    ("/finance/fee-plans", "Fee Plans Page", True),
    ("/finance/vouchers", "Voucher Generation Page", True),
    ("/finance/vouchers/list", "Vouchers List Page", True),
    ("/finance/payments", "Payments Page", True),
    ("/finance/me", "Student Finance Page", True),
    ("/finance/reports/defaulters", "Defaulters Report", True),
    ("/finance/reports/collection", "Collection Report", True),
    ("/finance/reports/aging", "Aging Report", True),
    ("/finance/reports/statement", "Student Statement Report", True),
    
    # Attendance Module
    ("/attendance", "Attendance Dashboard", True),
    ("/attendance/input", "Attendance Input Page", True),
    ("/attendance/eligibility", "Eligibility Report", True),
    ("/attendance/bulk", "Bulk Attendance Page", True),
    
    # Academics Module
    ("/academics/programs", "Programs Page", True),
    ("/academics/programs/new", "New Program Page", True),
    ("/academics/batches", "Batches Page", True),
    ("/academics/periods", "Academic Periods Page", True),
    ("/academics/groups", "Groups Page", True),
    ("/academics/departments", "Departments Page", True),
    
    # Student Management
    ("/students", "Students Page", True),
    ("/admin/students/import", "Student Import Page", True),
    
    # Course Management
    ("/courses", "Courses Page", True),
    ("/sections", "Sections Page", True),
    ("/timetable", "Timetable Page", True),
    
    # Assessments & Exams
    ("/gradebook", "Gradebook Page", True),
    ("/exams", "Exams Page", True),
    ("/results", "Results Page", True),
    ("/examcell/publish", "Publish Results Page", True),
    
    # Admin Pages
    ("/admin/dashboard", "Admin Dashboard Page", True),
    ("/admin/users", "Users Management Page", True),
    ("/admin/roles", "Roles Management Page", True),
    ("/admin/syllabus", "Syllabus Manager Page", True),
    ("/admin/settings", "Admin Settings Page", True),
    ("/admin/audit", "Audit Log Page", True),
    
    # Other Pages
    ("/analytics", "Analytics Dashboard", True),
    ("/profile", "Profile Page", True),
    ("/notifications", "Notifications Page", True),
    ("/transcripts", "Transcripts Page", True),
    ("/apply", "Student Application Page", False),
]


async def login(page: Page, username: str, password: str, base_url: str) -> bool:
    """Login to the application."""
    try:
        login_url = f"{base_url}/login"
        print(f"  Navigating to login page...")
        await page.goto(login_url, wait_until="networkidle", timeout=30000)
        
        # Wait for form to be ready - wait for the identifier input specifically
        print(f"  Waiting for login form...")
        try:
            # Wait for the identifier input (react-hook-form uses name="identifier")
            await page.wait_for_selector('input[name="identifier"]', timeout=10000)
        except:
            # Fallback: wait for any password input
            await page.wait_for_selector('input[type="password"]', timeout=10000)
        
        # Small delay to ensure form is fully rendered
        await page.wait_for_timeout(500)
        
        # Fill identifier field - prioritize the name attribute since it's react-hook-form
        print(f"  Filling username/identifier...")
        identifier_selectors = [
            'input[name="identifier"]',  # Primary selector for react-hook-form
            'input[type="text"]:not([type="password"])',  # Text input that's not password
            'input[autocomplete="username"]',
        ]
        
        identifier_filled = False
        for selector in identifier_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    await element.fill('')
                    await element.type(username, delay=50)
                    identifier_filled = True
                    print(f"  ✓ Filled identifier using: {selector}")
                    break
            except Exception as e:
                continue
        
        if not identifier_filled:
            # Last resort: find first visible text input
            inputs = await page.query_selector_all('input[type="text"]')
            for inp in inputs:
                try:
                    is_visible = await inp.is_visible()
                    if is_visible:
                        await inp.fill('')
                        await inp.type(username, delay=50)
                        identifier_filled = True
                        break
                except:
                    continue
        
        if not identifier_filled:
            print(f"  ✗ Could not find identifier input field")
            return False
        
        # Fill password field
        print(f"  Filling password...")
        password_filled = False
        try:
            password_input = await page.query_selector('input[type="password"]')
            if password_input:
                await password_input.fill('')
                await password_input.type(password, delay=50)
                password_filled = True
        except Exception as e:
            print(f"  ⚠️  Error filling password: {e}")
        
        if not password_filled:
            print(f"  ✗ Could not find password input field")
            return False
        
        # Wait a bit before submitting
        await page.wait_for_timeout(300)
        
        # Submit form - try multiple approaches
        print(f"  Submitting login form...")
        submitted = False
        
        # Try clicking the submit button by text content
        submit_selectors = [
            ('button[type="submit"]', 'button type="submit"'),
            ('button:has-text("Sign In")', 'button with "Sign In" text'),
            ('button:has-text("Sign in")', 'button with "Sign in" text'),
            ('button:has-text("Login")', 'button with "Login" text'),
        ]
        
        for selector, desc in submit_selectors:
            try:
                button = await page.query_selector(selector)
                if button:
                    is_visible = await button.is_visible()
                    is_enabled = await button.is_enabled()
                    if is_visible and is_enabled:
                        await button.click()
                        submitted = True
                        print(f"  ✓ Clicked submit button ({desc})")
                        break
            except:
                continue
        
        if not submitted:
            # Try form submit
            try:
                form = await page.query_selector('form')
                if form:
                    await form.evaluate('form => form.requestSubmit()')
                    submitted = True
                    print(f"  ✓ Submitted via form.requestSubmit()")
            except:
                pass
        
        if not submitted:
            # Last resort: press Enter on password field
            try:
                await page.press('input[type="password"]', 'Enter')
                submitted = True
                print(f"  ✓ Submitted via Enter key")
            except:
                pass
        
        if not submitted:
            print(f"  ✗ Could not submit form")
            return False
        
        # Wait for navigation - the app should redirect to /dashboard after login
        print(f"  Waiting for login to complete...")
        try:
            # Wait for URL to change away from /login or wait for dashboard to load
            await page.wait_for_function(
                '() => !window.location.pathname.includes("/login")',
                timeout=15000
            )
        except:
            # If that doesn't work, wait for network to be idle and check URL
            try:
                await page.wait_for_load_state("networkidle", timeout=10000)
            except:
                await page.wait_for_timeout(3000)
        
        # Check if login was successful - verify we're not on login page
        current_url = page.url
        print(f"  Current URL after login attempt: {current_url}")
        
        if "/login" not in current_url:
            print(f"  ✓ Login successful - redirected to: {current_url}")
            # Wait for page to fully load
            await page.wait_for_timeout(1500)
            return True
        else:
            # Check for error messages
            try:
                error_selectors = [
                    '[role="alert"]',
                    '.error',
                    '.alert-error',
                    '[class*="error"]',
                    '[class*="Error"]'
                ]
                for selector in error_selectors:
                    error_elements = await page.query_selector_all(selector)
                    if error_elements:
                        for elem in error_elements:
                            try:
                                error_text = await elem.inner_text()
                                if error_text and len(error_text.strip()) > 0:
                                    print(f"  ✗ Login failed: {error_text[:150]}")
                                    return False
                            except:
                                continue
            except:
                pass
            
            print(f"  ✗ Login failed - still on login page")
            return False
            
    except Exception as e:
        print(f"  ✗ Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def capture_screenshot(
    page: Page,
    route: str,
    output_dir: Path,
    base_url: str,
    wait_time: int = 2000,
    requires_auth: bool = False
) -> bool:
    """Capture a screenshot of a specific route."""
    try:
        # Navigate to the page
        full_url = f"{base_url}{route}"
        print(f"  Navigating to {full_url}...")
        
        await page.goto(full_url, wait_until="networkidle", timeout=30000)
        
        # Wait a bit for any dynamic content to load
        await page.wait_for_timeout(wait_time)
        
        # Generate filename from route
        filename = route.strip("/").replace("/", "_") or "home"
        if not filename:
            filename = "home"
        filename = f"{filename}.png"
        filepath = output_dir / filename
        
        # Take screenshot
        await page.screenshot(path=str(filepath), full_page=True)
        print(f"  ✓ Screenshot saved: {filepath}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error capturing {route}: {e}")
        return False


async def main():
    parser = argparse.ArgumentParser(
        description="Capture screenshots of FMU Platform frontend pages"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="https://sims.alshifalab.pk",
        help="Base URL of the frontend application (default: https://sims.alshifalab.pk)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="screenshots",
        help="Output directory for screenshots (default: screenshots/)"
    )
    parser.add_argument(
        "--username",
        type=str,
        default=DEFAULT_USERNAME,
        help=f"Username for authentication (default: {DEFAULT_USERNAME})"
    )
    parser.add_argument(
        "--password",
        type=str,
        default=DEFAULT_PASSWORD,
        help="Password for authentication (default: configured in script/env)"
    )
    parser.add_argument(
        "--wait",
        type=int,
        default=2000,
        help="Wait time in milliseconds after page load (default: 2000)"
    )
    parser.add_argument(
        "--pages",
        type=str,
        nargs="+",
        default=None,
        help="Specific pages to capture (by route, e.g., /dashboard /finance). If not specified, all pages are captured."
    )
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir.absolute()}")
    
    # Filter pages if specific pages are requested
    pages_to_capture = PAGES_TO_CAPTURE
    if args.pages:
        requested_routes = set(args.pages)
        pages_to_capture = [p for p in PAGES_TO_CAPTURE if p[0] in requested_routes]
        if not pages_to_capture:
            print(f"Error: No matching pages found for routes: {args.pages}")
            return
    
    print(f"\n📸 Capturing screenshots of {len(pages_to_capture)} pages...")
    print(f"Base URL: {args.url}\n")
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
        )
        page = await context.new_page()
        
        # Login if credentials provided
        if args.username and args.password:
            print("🔐 Logging in...")
            login_success = await login(page, args.username, args.password, args.url)
            if not login_success:
                print("⚠️  Warning: Login failed. Some pages may not be accessible.")
        else:
            print("⚠️  No credentials provided. Skipping login. Protected pages may fail.")
        
        # Capture screenshots
        success_count = 0
        fail_count = 0
        
        for route, description, requires_auth in pages_to_capture:
            print(f"\n📄 {description} ({route})")
            
            if requires_auth and not (args.username and args.password):
                print(f"  ⚠️  Skipping (requires authentication)")
                fail_count += 1
                continue
            
            success = await capture_screenshot(page, route, output_dir, args.url, args.wait, requires_auth)
            if success:
                success_count += 1
            else:
                fail_count += 1
        
        await browser.close()
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 Screenshot Capture Summary")
    print(f"{'='*60}")
    print(f"✓ Successful: {success_count}")
    print(f"✗ Failed: {fail_count}")
    print(f"📁 Output directory: {output_dir.absolute()}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
