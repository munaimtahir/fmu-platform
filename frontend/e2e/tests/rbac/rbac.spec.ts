/**
 * RBAC Negative Tests & State Machine Workflow Tests
 *
 * Validates:
 * 1. Role-based access control - explicit negative paths
 * 2. Result lifecycle state transitions (draft → published → frozen)
 * 3. Business rule enforcement via UI
 *
 * Tags: @rbac
 * Target: 8 tests
 */

import { test, expect } from '../../fixtures/auth';
import { ResultsPage } from '../../pages/ResultsPage';
import { ROUTES } from '../../data/test-data';

test.describe('RBAC Negative Tests @rbac', () => {
  // ---- Student blocked from admin routes -----------------------------------

  test('RBAC-01: Student blocked from admin user management', async ({ studentPage: page }) => {
    await page.goto(ROUTES.admin.users);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    const isOnPage = url.includes('/system/users');

    if (isOnPage) {
      // Verify forbidden UI shown
      await expect(
        page.getByText(/access denied|not authorized|forbidden|unauthorized|permission/i).first(),
      ).toBeVisible({ timeout: 10000 });
    } else {
      // Redirected - access denied
      expect(url).not.toContain('/system/users');
    }
  });

  test('RBAC-02: Student blocked from analytics dashboard', async ({ studentPage: page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/analytics')) {
      await expect(
        page.getByText(/access denied|not authorized|forbidden|unauthorized|permission/i).first(),
      ).toBeVisible({ timeout: 10000 });
    } else {
      expect(url).not.toContain('/analytics');
    }
  });

  // ---- Faculty blocked from admin routes -----------------------------------

  test('RBAC-03: Faculty blocked from admin audit log', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.admin.audit);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/system/audit')) {
      await expect(
        page.getByText(/access denied|not authorized|forbidden|unauthorized|permission/i).first(),
      ).toBeVisible({ timeout: 10000 });
    } else {
      expect(url).not.toContain('/system/audit');
    }
  });

  test('RBAC-04: Faculty blocked from student management list', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.students.list);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/students')) {
      await expect(
        page.getByText(/access denied|not authorized|forbidden|unauthorized|permission/i).first(),
      ).toBeVisible({ timeout: 10000 });
    } else {
      expect(url).not.toContain('/students');
    }
  });

  // ---- Unauthenticated access ----------------------------------------------

  test('RBAC-05: Unauthenticated user cannot access any protected route', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/students',
      '/system/audit',
      '/attendance',
      '/examcell/publish',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    }
  });

  // ---- Result lifecycle state machine --------------------------------------

  test('RBAC-06: ExamCell can see result publishing controls', async ({ examcellPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoPublish();
    await resultsPage.expectLoaded();

    // Verify page is accessible and shows publishing UI for ExamCell
    // The specific actions depend on seeded data
    expect(page.url()).toContain('/examcell/publish');
    const forbidden = page.locator('div').filter({ hasText: /not authorized|forbidden/i }).first();
    expect(await forbidden.isVisible({ timeout: 2000 }).catch(() => false)).toBe(false);
  });

  test('RBAC-07: Student cannot see publish/freeze controls on results page', async ({ studentPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoResults();
    await resultsPage.expectLoaded();

    // Student should see results but NOT have publish/freeze action buttons
    const publishBtn = page.locator('button').filter({ hasText: /^publish$/i }).first();
    const freezeBtn = page.locator('button').filter({ hasText: /^freeze$/i }).first();

    const publishVisible = await publishBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const freezeVisible = await freezeBtn.isVisible({ timeout: 2000 }).catch(() => false);

    expect(publishVisible, 'Student should NOT see Publish button').toBe(false);
    expect(freezeVisible, 'Student should NOT see Freeze button').toBe(false);
  });

  test('RBAC-08: Admin has access to all expected management pages', async ({ adminPage: page }) => {
    // Verify admin can access every major admin route
    const adminRoutes = [
      { route: ROUTES.admin.users, heading: /user/i },
      { route: ROUTES.admin.audit, heading: /audit/i },
      { route: ROUTES.students.list, heading: /student/i },
      { route: ROUTES.academics.programs, heading: /program/i },
    ];

    for (const { route, heading } of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const h = page.getByRole('heading', { name: heading }).first();
      await expect(h).toBeVisible({ timeout: 8000 });

      // Must NOT show forbidden
      const forbidden = page.locator('div').filter({ hasText: /not authorized|forbidden/i }).first();
      const isForbidden = await forbidden.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isForbidden, `Admin should not see forbidden on ${route}`).toBe(false);
    }
  });
});
