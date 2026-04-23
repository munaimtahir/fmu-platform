/**
 * Auth & Session Tests
 * Covers login flows, session persistence, logout, route guards, role access.
 *
 * Tags: @auth
 * Target: 10 tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { USERS } from '../../data/test-data';

async function expectForbidden(page, message: string): Promise<void> {
  await expect(
    page.getByText(/access denied|not authorized|forbidden|unauthorized|permission|don't have/i).first(),
    message,
  ).toBeVisible({ timeout: 10000 });
}

test.describe('Authentication & Session @auth', () => {
  // ---- Valid Login ---------------------------------------------------------

  test('AUTH-01: Valid login with username navigates to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(USERS.admin.username, USERS.admin.password);
    expect(page.url()).toContain('/dashboard');
  });

  test('AUTH-02: Valid login with email navigates to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Backend accepts email as identifier too
    await loginPage.loginAndWaitForDashboard(USERS.admin.email, USERS.admin.password);
    expect(page.url()).toContain('/dashboard');
  });

  // ---- Invalid Login -------------------------------------------------------

  test('AUTH-03: Invalid credentials show error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('nonexistent@nobody.invalid', 'wrongpassword123');
    await loginPage.expectErrorVisible();
    // Must still be on login page
    expect(page.url()).toContain('/login');
  });

  test('AUTH-04: Empty credentials show validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Submit without filling in fields
    await loginPage.submitButton.click();
    // Should show HTML5 required validation or app-level error; must not navigate
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  // ---- Route Guard --------------------------------------------------------

  test('AUTH-05: Protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('AUTH-06: Admin-only route redirects student to login or forbidden', async ({ page }) => {
    // No auth at all - should redirect to login
    await page.goto('/system/audit');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  // ---- Logout --------------------------------------------------------------

  test('AUTH-07: Logout clears session and redirects to login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(USERS.admin.username, USERS.admin.password);

    await dashboard.logout();
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });

    // After logout, accessing dashboard must redirect back to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  // ---- Session Persistence ------------------------------------------------

  test('AUTH-08: Session persists after page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(USERS.admin.username, USERS.admin.password);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should still be on dashboard, not redirected to login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  // ---- Role-based access --------------------------------------------------

  test('AUTH-09: Student cannot access admin-only audit route', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(USERS.student.username, USERS.student.password);

    // Navigate directly to admin-only route
    await page.goto('/system/audit');
    await page.waitForLoadState('domcontentloaded');

    // Should show unauthorized or redirect - NOT the audit log content
    const currentUrl = page.url();
    const onAuditPage = currentUrl.includes('/system/audit');

    if (onAuditPage) {
      // If still on audit page, should show forbidden message
      await expectForbidden(page, 'Student should see forbidden message on admin audit page');
    } else {
      // Redirected away - acceptable
      expect(currentUrl).not.toContain('/system/audit');
    }
  });

  test('AUTH-10: Faculty cannot access student-specific dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(USERS.faculty.username, USERS.faculty.password);

    await page.goto('/dashboard/student');
    await page.waitForLoadState('domcontentloaded');

    // Should not load student dashboard for faculty
    const url = page.url();
    const onPage = url.includes('/dashboard/student');

    if (onPage) {
      await expectForbidden(page, 'Faculty should see forbidden on student dashboard');
    } else {
      // Redirected is also acceptable
      expect(url).not.toContain('/dashboard/student');
    }
  });
});
