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

  get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]').first();
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
   * Fill and submit the create-student form with minimal required fields.
   * Returns a partial reg_no / identifier for later verification.
   */
  async createStudent(overrides: Partial<{
    name: string;
    regNo: string;
    email: string;
  }> = {}): Promise<string> {
    const suffix = Date.now().toString().slice(-6);
    const name = overrides.name ?? `E2E Student ${suffix}`;
    const regNo = overrides.regNo ?? `TEST-${suffix}`;

    // Fill name - look for various field name conventions
    const nameField = this.page.locator(
      'input[name="name"], input[name="full_name"], input[placeholder*="name" i]'
    ).first();
    if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameField.fill(name);
    }

    // Fill registration number
    const regField = this.page.locator(
      'input[name="reg_no"], input[name="regNo"], input[name="registration_number"], input[placeholder*="reg" i]'
    ).first();
    if (await regField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await regField.fill(regNo);
    }

    // Fill email if field exists
    const emailField = this.page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailField.fill(overrides.email ?? `${suffix}@test.edu`);
    }

    // Submit
    await this.page.locator('button[type="submit"]').first().click();

    return regNo;
  }
}
