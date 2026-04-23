/**
 * Student Role Tests
 * Students have read-only access to their own data.
 *
 * Tags: @student
 * Target: 10 tests
 */

import { test, expect } from '../../fixtures/auth';
import { ResultsPage } from '../../pages/ResultsPage';
import { ROUTES } from '../../data/test-data';

async function expectForbidden(page, message: string): Promise<void> {
  await expect(
    page.getByText(/access denied|not authorized|forbidden|unauthorized|permission|don't have/i).first(),
    message,
  ).toBeVisible({ timeout: 10000 });
}

test.describe('Student Role Tests @student', () => {
  // ---- Dashboard -----------------------------------------------------------

  test('STU-01: Student lands on student dashboard', async ({ studentPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    // Should not be redirected to login
    expect(page.url()).not.toContain('/login');
  });

  // ---- Own data access -----------------------------------------------------

  test('STU-02: Student can access own results', async ({ studentPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoResults();
    await resultsPage.expectLoaded();
    // Should not show forbidden
    const forbidden = page.locator('div, p').filter({ hasText: /not authorized|forbidden/i }).first();
    const isForbidden = await forbidden.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isForbidden).toBe(false);
  });

  test('STU-03: Student can access own gradebook', async ({ studentPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoGradebook();
    await resultsPage.expectLoaded();
    const forbidden = page.locator('div, p').filter({ hasText: /not authorized|forbidden/i }).first();
    const isForbidden = await forbidden.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isForbidden).toBe(false);
  });

  test('STU-04: Student can access finance/me page', async ({ studentPage: page }) => {
    await page.goto(ROUTES.finance.me);
    await page.waitForLoadState('domcontentloaded');
    // Page should load without redirect to login - can be "My Fees" or "No student profile linked"
    expect(page.url()).not.toContain('/login');
    const content = page.locator('h1, p').filter({ hasText: /My Fees|finance|fee|payment|statement|no student profile/i }).first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test('STU-05: Student can access profile page', async ({ studentPage: page }) => {
    await page.goto(ROUTES.profile);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /profile/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('STU-06: Student can access transcripts page', async ({ studentPage: page }) => {
    await page.goto(ROUTES.transcripts);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/login');
    const heading = page.getByRole('heading', { name: /transcript/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  // ---- Forbidden routes ----------------------------------------------------

  test('STU-07: Student cannot access admin audit log', async ({ studentPage: page }) => {
    await page.goto(ROUTES.admin.audit);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/system/audit')) {
      await expectForbidden(page, 'Student should see forbidden on audit log');
    } else {
      expect(url).not.toContain('/system/audit');
    }
  });

  test('STU-08: Student cannot access students management list', async ({ studentPage: page }) => {
    await page.goto(ROUTES.students.list);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/students')) {
      await expectForbidden(page, 'Student should see forbidden on students management page');
    } else {
      expect(url).not.toContain('/students');
    }
  });

  test('STU-09: Student cannot access attendance input (faculty tool)', async ({ studentPage: page }) => {
    await page.goto(ROUTES.attendance.input);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/attendance/input')) {
      await expectForbidden(page, 'Student should see forbidden on attendance input');
    } else {
      expect(url).not.toContain('/attendance/input');
    }
  });

  test('STU-10: Student cannot access publish results page', async ({ studentPage: page }) => {
    await page.goto(ROUTES.examcell.publish);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/examcell/publish')) {
      await expectForbidden(page, 'Student should see forbidden on publish results page');
    } else {
      expect(url).not.toContain('/examcell/publish');
    }
  });
});
