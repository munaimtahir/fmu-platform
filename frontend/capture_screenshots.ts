import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Login Page
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '../docs/verification/artifacts/screenshots/login_page.png' });
  console.log('Captured login_page.png');

  // Login flow
  await page.fill('input[name="identifier"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait for navigation
  try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await page.waitForTimeout(3000); // Wait for animations
      await page.screenshot({ path: '../docs/verification/artifacts/screenshots/admin_dashboard.png' });
      console.log('Captured admin_dashboard.png');
  } catch (e) {
      console.error('Failed to login or load dashboard', e);
      await page.screenshot({ path: '../docs/verification/artifacts/screenshots/login_failure.png' });
  }

  // Navigate to other pages if login succeeded
  if (page.url().includes('dashboard')) {
      // Academics
      await page.goto('http://localhost:5173/academics');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '../docs/verification/artifacts/screenshots/academics_page.png' });
      console.log('Captured academics_page.png');

      // Students
      await page.goto('http://localhost:5173/students');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '../docs/verification/artifacts/screenshots/students_list.png' });
      console.log('Captured students_list.png');

      // Admin Users
      await page.goto('http://localhost:5173/admin/users');
       await page.waitForTimeout(3000);
      await page.screenshot({ path: '../docs/verification/artifacts/screenshots/admin_users.png' });
      console.log('Captured admin_users.png');

      // Admin Settings
      await page.goto('http://localhost:5173/admin/settings');
       await page.waitForTimeout(3000);
      await page.screenshot({ path: '../docs/verification/artifacts/screenshots/admin_settings.png' });
      console.log('Captured admin_settings.png');
  }

  await browser.close();
})();
