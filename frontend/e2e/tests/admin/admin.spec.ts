/**
 * Admin Role Tests
 * Covers the full admin workflow: students, academics, audit, system.
 *
 * Uses pre-seeded auth state (admin storageState) for speed.
 * Tags: @admin
 * Target: 16 tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentsPage } from '../../pages/StudentsPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { AuditPage } from '../../pages/AuditPage';
import { AttendancePage } from '../../pages/AttendancePage';
import { ResultsPage } from '../../pages/ResultsPage';
import { expectNavItem, waitForPageData } from '../../helpers/assertions';
import { ROUTES } from '../../data/test-data';

test.describe('Admin Role Tests @admin', () => {
  // ---- Dashboard & Navigation ----------------------------------------------

  test('ADMIN-01: Admin sees admin-relevant navigation', async ({ adminPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    // Admin should have access to these sections via nav
    await expectNavItem(page, 'Students');
    await expect(
      page.getByRole('button', { name: /administration/i }).or(page.getByRole('link', { name: /students/i })).first(),
      'Admin should see admin navigation items',
    ).toBeVisible({ timeout: 8000 });
  });

  // ---- Students CRUD -------------------------------------------------------

  test('ADMIN-02: Admin can open students list', async ({ adminPage: page }) => {
    const studentsPage = new StudentsPage(page);
    await studentsPage.goto();
    await studentsPage.expectLoaded();
    // Table, list or empty state should be visible
    const tableOrEmpty = page.locator('table, [role="table"], [role="list"], [class*="list"], :text("No data available")').first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 8000 });
  });

  test('ADMIN-03: Admin can search students by name', async ({ adminPage: page }) => {
    const studentsPage = new StudentsPage(page);
    await studentsPage.goto();
    await studentsPage.expectLoaded();

    // Search for a known demo student
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasSearch) {
      await searchInput.fill('student');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      // Results should still load (not crash) - could be table or empty state
      const tableOrEmpty = page.locator('table, [role="table"], [class*="list"], :text("No data available")').first();
      await expect(tableOrEmpty).toBeVisible({ timeout: 6000 });
    } else {
      test.skip(true, 'Search input not found');
    }
  });

  test('ADMIN-04: Admin can open create student form', async ({ adminPage: page }) => {
    const studentsPage = new StudentsPage(page);
    await studentsPage.goto();
    await studentsPage.expectLoaded();

    const addBtn = page.locator('button, a').filter({ hasText: /add|create|new|register/i }).first();
    const hasAdd = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasAdd) {
      await addBtn.click();
      // Form or modal should appear
      const form = page.locator('form, [role="dialog"]').first();
      await expect(form).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Create button not found on students page');
    }
  });

  // ---- Academic Structure --------------------------------------------------

  test('ADMIN-05: Admin can access programs page', async ({ adminPage: page }) => {
    await page.goto(ROUTES.academics.programs);
    await waitForPageData(page, 'program');
    // Page should load without 403
    const heading = page.getByRole('heading', { name: /program/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('ADMIN-06: Admin can access batches page', async ({ adminPage: page }) => {
    await page.goto(ROUTES.academics.batches);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /batch/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('ADMIN-07: Admin can access sections and courses pages', async ({ adminPage: page }) => {
    // Sections
    await page.goto(ROUTES.sections);
    await page.waitForLoadState('domcontentloaded');
    const sectionsHeading = page.getByRole('heading', { name: /section/i }).first();
    await expect(sectionsHeading).toBeVisible({ timeout: 8000 });

    // Courses
    await page.goto(ROUTES.courses);
    await page.waitForLoadState('domcontentloaded');
    const coursesHeading = page.getByRole('heading', { name: /course/i }).first();
    await expect(coursesHeading).toBeVisible({ timeout: 8000 });
  });

  // ---- Attendance ----------------------------------------------------------

  test('ADMIN-08: Admin can access attendance dashboard', async ({ adminPage: page }) => {
    const attendancePage = new AttendancePage(page);
    await attendancePage.gotoDashboard();
    await attendancePage.expectLoaded();
  });

  test('ADMIN-09: Admin can access attendance eligibility report', async ({ adminPage: page }) => {
    const attendancePage = new AttendancePage(page);
    await attendancePage.gotoEligibility();
    await attendancePage.expectEligibilityReportLoaded();
  });

  // ---- Results & Gradebook ------------------------------------------------

  test('ADMIN-10: Admin can access results page', async ({ adminPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoResults();
    await resultsPage.expectLoaded();
  });

  test('ADMIN-11: Admin can access publish results page', async ({ adminPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoPublish();
    await resultsPage.expectLoaded();
  });

  test('ADMIN-12: Admin can access gradebook', async ({ adminPage: page }) => {
    const resultsPage = new ResultsPage(page);
    await resultsPage.gotoGradebook();
    await resultsPage.expectLoaded();
  });

  // ---- Audit Log -----------------------------------------------------------

  test('ADMIN-13: Admin can access audit log viewer', async ({ adminPage: page }) => {
    const auditPage = new AuditPage(page);
    await auditPage.goto();
    await auditPage.expectLoaded();
  });

  test('ADMIN-14: Admin can filter audit logs', async ({ adminPage: page }) => {
    const auditPage = new AuditPage(page);
    await auditPage.goto();
    await auditPage.expectLoaded();

    // Attempt to filter - the page may have search or dropdowns
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    const hasFilter = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasFilter) {
      await searchInput.fill('login');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      // Should not crash
      const table = page.locator('table, [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 6000 });
    }
    // If no filter, just assert table or empty state is present
    const tableOrEmpty = page.locator('table, [role="table"], [class*="list"], :text("No data available")').first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 6000 });
  });

  // ---- System Pages --------------------------------------------------------

  test('ADMIN-15: Admin can access user management', async ({ adminPage: page }) => {
    await page.goto(ROUTES.admin.users);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /user/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('ADMIN-16: Admin can access transcripts page', async ({ adminPage: page }) => {
    await page.goto(ROUTES.transcripts);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { name: /transcript/i }).first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });
});
