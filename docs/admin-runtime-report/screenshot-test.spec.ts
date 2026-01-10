import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://127.0.0.1:8080';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Admin Runtime Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set larger viewport for better screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('01 - Login Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '01_login.png'),
      fullPage: true 
    });
  });

  test('02 - Login and Main Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Find and fill login form
    const identifierInput = page.locator('input[name="identifier"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    
    await identifierInput.fill('admin');
    await passwordInput.fill('admin123');
    await submitButton.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '02_main_dashboard.png'),
      fullPage: true 
    });
  });

  test('03 - Admin Dashboard', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Navigate to admin dashboard
    await page.goto(`${BASE_URL}/dashboard/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '03_admin_dashboard.png'),
      fullPage: true 
    });
  });

  test('04 - Students List', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '04_students_list.png'),
      fullPage: true 
    });
  });

  test('05 - Courses List', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '05_courses_list.png'),
      fullPage: true 
    });
  });

  test('06 - Attendance Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '06_attendance_dashboard.png'),
      fullPage: true 
    });
  });

  test('07 - Finance Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/finance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '07_finance_dashboard.png'),
      fullPage: true 
    });
  });

  test('08 - Admin Users', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '08_admin_users.png'),
      fullPage: true 
    });
  });

  test('09 - Programs List', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/academics/programs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '09_programs_list.png'),
      fullPage: true 
    });
  });

  test('10 - Admin Settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '10_admin_settings.png'),
      fullPage: true 
    });
  });

  test('11 - Syllabus Manager', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="identifier"], input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    await page.goto(`${BASE_URL}/admin/syllabus`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '11_syllabus_manager.png'),
      fullPage: true 
    });
  });
});
