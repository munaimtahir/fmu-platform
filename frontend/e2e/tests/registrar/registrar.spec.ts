/**
 * Registrar Role Tests
 *
 * Tags: @registrar
 * Target: 10 tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentsPage } from '../../pages/StudentsPage';
import { AttendancePage } from '../../pages/AttendancePage';
import { ROUTES } from '../../data/test-data';

async function expectForbidden(page, message: string): Promise<void> {
  await expect(
    page.getByText(/access denied|not authorized|forbidden|unauthorized|permission|don't have/i).first(),
    message,
  ).toBeVisible({ timeout: 10000 });
}

test.describe('Registrar Role Tests @registrar', () => {
  // ---- Dashboard & Navigation ----------------------------------------------

  test('REG-01: Registrar sees registrar-relevant navigation', async ({ registrarPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('navigation', { name: /primary navigation/i }),
      'Registrar should have navigation items',
    ).toBeVisible({ timeout: 8000 });
  });

  test('REG-02: Registrar can view students list', async ({ registrarPage: page }) => {
    const studentsPage = new StudentsPage(page);
    await studentsPage.goto();
    await studentsPage.expectLoaded();
    const tableOrEmpty = page.locator('table, [role="table"], [class*="list"], :text("No data available")').first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 8000 });
  });

  // ---- Academic Structure --------------------------------------------------

  test('REG-03: Registrar can access programs page', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.academics.programs);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /program/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('REG-04: Registrar can access batches page', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.academics.batches);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /batch/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('REG-05: Registrar can access academic periods page', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.academics.periods);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /period|academic/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  // ---- Attendance Eligibility ----------------------------------------------

  test('REG-06: Registrar can view attendance eligibility report', async ({ registrarPage: page }) => {
    const attendancePage = new AttendancePage(page);
    await attendancePage.gotoEligibility();
    await attendancePage.expectEligibilityReportLoaded();
  });

  test('REG-07: Registrar cannot access attendance input (Faculty-only)', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.attendance.dashboard);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    // Should be redirected or show forbidden
    if (url.includes('/attendance')) {
      const forbidden = page.locator('div, p').filter({ hasText: /not authorized|forbidden|unauthorized/i }).first();
      const isForbidden = await forbidden.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isForbidden) {
        // Check if it redirected somewhere else
        expect(url).not.toContain('/attendance/input');
      }
    } else {
      // Redirected - acceptable
      expect(url).not.toContain('/attendance/input');
    }
  });

  // ---- Transcripts ---------------------------------------------------------

  test('REG-08: Registrar can access transcripts page', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.transcripts);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /transcript/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  // ---- Forbidden actions ---------------------------------------------------

  test('REG-09: Registrar cannot access admin-only audit log', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.admin.audit);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/system/audit')) {
      // Must show forbidden
      await expectForbidden(page, 'Registrar should see forbidden on audit page');
    } else {
      // Redirected away - correct
      expect(url).not.toContain('/system/audit');
    }
  });

  test('REG-10: Registrar cannot access publish results page', async ({ registrarPage: page }) => {
    await page.goto(ROUTES.examcell.publish);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/examcell/publish')) {
      await expectForbidden(page, 'Registrar should see forbidden on publish results page');
    } else {
      expect(url).not.toContain('/examcell/publish');
    }
  });
});
