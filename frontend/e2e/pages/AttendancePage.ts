/**
 * Attendance Page Object
 * Covers /attendance, /attendance/input, /attendance/bulk, /attendance/eligibility
 */

import { Page, expect } from '@playwright/test';

export class AttendancePage {
  constructor(private readonly page: Page) {}

  async gotoDashboard(): Promise<void> {
    await this.page.goto('/attendance');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoInput(): Promise<void> {
    await this.page.goto('/attendance/input');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoEligibility(): Promise<void> {
    await this.page.goto('/attendance/eligibility');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoBulk(): Promise<void> {
    await this.page.goto('/attendance/bulk');
    await this.page.waitForLoadState('domcontentloaded');
  }

  get heading() {
    return this.page
      .getByRole('heading', { name: /attendance/i })
      .first();
  }

  get sectionSelect() {
    return this.page.locator('select[name="section"], [data-testid="section-select"]').first();
  }

  get dateInput() {
    return this.page.locator('input[type="date"], input[name="date"]').first();
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]').first();
  }

  get attendanceTable() {
    return this.page.locator('table, [role="table"]').first();
  }

  /** Mark all students as present */
  async markAllPresent(): Promise<void> {
    const presentButtons = this.page.locator(
      'button:has-text("Present"), input[value="P"], [data-status="P"]'
    );
    const count = await presentButtons.count();
    for (let i = 0; i < count; i++) {
      await presentButtons.nth(i).click();
    }
  }

  /** Mark all students as absent */
  async markAllAbsent(): Promise<void> {
    const absentButtons = this.page.locator(
      'button:has-text("Absent"), input[value="A"], [data-status="A"]'
    );
    const count = await absentButtons.count();
    for (let i = 0; i < count; i++) {
      await absentButtons.nth(i).click();
    }
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 8000 });
  }

  async expectEligibilityReportLoaded(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: /eligibility/i }).first()
    ).toBeVisible({ timeout: 8000 });
  }
}
