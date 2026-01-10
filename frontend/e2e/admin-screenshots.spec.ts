import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs/admin-runtime-report/screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Admin Runtime Screenshots', () => {
  // Helper function to login
  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="identifier"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.status() < 500,
        { timeout: 10000 }
      ).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }

  test.beforeEach(async ({ page }) => {
    // Set larger viewport for better screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('01 - Login Page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '01_login.png'),
      fullPage: true 
    });
  });

  test('02 - Login and Main Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[name="identifier"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit and wait for navigation
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.status() < 500,
        { timeout: 10000 }
      ).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '02_main_dashboard.png'),
      fullPage: true 
    });
  });

  test('03 - Admin Dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="identifier"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.status() < 500,
        { timeout: 10000 }
      ).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Navigate to admin dashboard
    await page.goto('/dashboard/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '03_admin_dashboard.png'),
      fullPage: true 
    });
  });

  test('04 - Students List', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/students', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '04_students_list.png'),
      fullPage: true 
    });
  });

  test('05 - Courses List', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/courses', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '05_courses_list.png'),
      fullPage: true 
    });
  });

  test('06 - Attendance Dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/attendance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '06_attendance_dashboard.png'),
      fullPage: true 
    });
  });

  test('07 - Finance Dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/finance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '07_finance_dashboard.png'),
      fullPage: true 
    });
  });

  test('08 - Admin Users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '08_admin_users.png'),
      fullPage: true 
    });
  });

  test('09 - Programs List', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/academics/programs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '09_programs_list.png'),
      fullPage: true 
    });
  });

  test('10 - Admin Settings', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '10_admin_settings.png'),
      fullPage: true 
    });
  });

  test('11 - Syllabus Manager', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/syllabus', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '11_syllabus_manager.png'),
      fullPage: true 
    });
  });
});
