/**
 * Students Page Object
 */

import { Page, expect } from '@playwright/test';
import { expectTableRow } from '../helpers/assertions';

export class StudentsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/students');
    await this.page.waitForLoadState('domcontentloaded');
  }

  get heading() {
    return this.page.getByRole('heading', { name: /students/i }).first();
  }

  // Note: `input[placeholder*="search" i]` alone also matches Topbar's global
  // omnisearch ("Search students, courses, sections, programs...") which
  // renders before this page's own search box in the DOM, so .first() would
  // silently grab the wrong input - the exact placeholder disambiguates.
  get searchInput() {
    return this.page.getByPlaceholder('Search students...');
  }

  get addButton() {
    return this.page.locator('button, a').filter({ hasText: /add student|new student|create student|register/i }).first();
  }

  get table() {
    return this.page.locator('table, [role="table"]').first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 8000 });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    // Wait for debounce or press Enter
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectStudentInTable(name: string): Promise<void> {
    await expectTableRow(this.page, name);
  }

  async openCreateForm(): Promise<void> {
    await this.addButton.click();
    // Wait for modal or form to appear
    await this.page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });
  }

  /**
   * Fill and submit the create-student form (src/features/students/StudentForm.tsx).
   * Program and Batch are required cascading custom Selects (not native <select>,
   * so getByLabel doesn't apply - StudentForm doesn't pass an `id` to associate
   * the label) - this picks the first available option in each, which works
   * against any seeded data without needing to know exact program/batch names.
   * All locators are scoped to the modal dialog: the underlying page (sidebar
   * nav included) stays mounted behind the modal overlay, and an unscoped
   * `ul li button` also matches the sidebar's own nav list, clicking a point
   * the modal's backdrop actually intercepts.
   * Returns the generated name / reg_no for later verification.
   */
  async createStudent(overrides: Partial<{
    name: string;
    regNo: string;
  }> = {}): Promise<{ name: string; regNo: string }> {
    const suffix = Date.now().toString().slice(-6);
    const name = overrides.name ?? `E2E Student ${suffix}`;
    const regNo = overrides.regNo ?? `E2E-${suffix}`;

    const dialog = this.page.locator('[role="dialog"]');

    await dialog.getByLabel('Registration Number').fill(regNo);
    await dialog.getByLabel('Name').fill(name);

    await dialog.getByRole('button', { name: /select program/i }).click();
    await dialog.locator('ul li button').first().click();

    // Batch and Group are each disabled until their parent selection is made;
    // Playwright's actionability check waits for them to become enabled
    // before clicking. Both are required by the backend (Student.group has
    // no null=True), matching the Select's `required` prop.
    await dialog.getByRole('button', { name: /select batch/i }).click();
    await dialog.locator('ul li button').first().click();

    await dialog.getByRole('button', { name: /select group/i }).click();
    await dialog.locator('ul li button').first().click();

    // Status defaults to "Active" - no interaction needed.
    await dialog.getByRole('button', { name: /create new student/i }).click();

    return { name, regNo };
  }
}
