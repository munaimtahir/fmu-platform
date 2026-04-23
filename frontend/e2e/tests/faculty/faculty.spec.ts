/**
 * Faculty / Teacher Role Tests
 *
 * Tags: @faculty
 * Target: 12 tests
 */

import { test, expect } from '../../fixtures/auth';
import { AttendancePage } from '../../pages/AttendancePage';
import { ResultsPage } from '../../pages/ResultsPage';
import { ROUTES } from '../../data/test-data';

async function expectForbidden(page, message: string): Promise<void> {
  await expect(
    page.getByText(/access denied|not authorized|forbidden|unauthorized|permission|don't have/i).first(),
    message,
  ).toBeVisible({ timeout: 10000 });
}

test.describe('Faculty Role Tests @faculty', () => {
  // ---- Dashboard & Navigation ----------------------------------------------

  test('FAC-01: Faculty sees faculty dashboard', async ({ facultyPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    // Should see faculty-relevant nav
    await expect(page.getByRole('navigation', { name: /primary navigation/i })).toBeVisible({ timeout: 8000 });
  });

  test('FAC-02: Faculty can access sections page', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.sections);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /section/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('FAC-03: Faculty can access courses page', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.courses);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /course/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  // ---- Attendance ----------------------------------------------------------

  test('FAC-04: Faculty can access attendance dashboard', async ({ facultyPage: page }) => {
    const attendancePage = new AttendancePage(page);
    await attendancePage.gotoDashboard();
    await attendancePage.expectLoaded();
  });

  test('FAC-05: Faculty can access attendance input page', async ({ facultyPage: page }) => {
    const attendancePage = new AttendancePage(page);
    await attendancePage.gotoInput();
    await attendancePage.expectLoaded();
    // Should have section selector or session picker
    const selectorOrInput = page.locator('select, input[type="date"], [data-testid*="section"]').first();
    await expect(selectorOrInput).toBeVisible({ timeout: 8000 });
  });

  test('FAC-06: Faculty can access bulk attendance page', async ({ facultyPage: page }) => {
    const attendancePage = new AttendancePage(page);
    await attendancePage.gotoBulk();
    await attendancePage.expectLoaded();
  });

  test('FAC-07: Faculty cannot access eligibility report (Registrar/Admin only)', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.attendance.eligibility);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/attendance/eligibility')) {
      await expectForbidden(page, 'Faculty should see forbidden on eligibility report');
    } else {
      expect(url).not.toContain('/attendance/eligibility');
    }
  });

  // ---- Gradebook & Marks --------------------------------------------------

  test('FAC-08: Faculty can access gradebook', async ({ facultyPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoGradebook();
    await resultsPage.expectLoaded();
  });

  test('FAC-09: Faculty can access results page', async ({ facultyPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoResults();
    await resultsPage.expectLoaded();
  });

  test('FAC-10: Faculty can access exams page', async ({ facultyPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoExams();
    await resultsPage.expectLoaded();
  });

  // ---- Forbidden routes ----------------------------------------------------

  test('FAC-11: Faculty cannot access student list (Admin/Registrar only)', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.students.list);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/students')) {
      await expectForbidden(page, 'Faculty should see forbidden on students page');
    } else {
      expect(url).not.toContain('/students');
    }
  });

  test('FAC-12: Faculty cannot access publish results (ExamCell/Admin only)', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.examcell.publish);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/examcell/publish')) {
      await expectForbidden(page, 'Faculty should see forbidden on publish results page');
    } else {
      expect(url).not.toContain('/examcell/publish');
    }
  });
});
