/**
 * Transcript Verify Page Object
 * Covers the public /verify/:token route.
 */

import { Page, expect } from '@playwright/test';

export class TranscriptVerifyPage {
  constructor(private readonly page: Page) {}

  async goto(token: string): Promise<void> {
    await this.page.goto(`/verify/${token}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  get heading() {
    return this.page
      .getByRole('heading', { name: /transcript|verify|verification/i })
      .first();
  }

  get studentName() {
    return this.page.locator('[data-testid="student-name"], [class*="student-name"]').first();
  }

  get invalidTokenMessage() {
    return this.page
      .locator('[role="alert"], [class*="error"], p, div')
      .filter({ hasText: /invalid|not found|expired|could not verify/i })
      .first();
  }

  get verificationSuccessIndicator() {
    return this.page
      .locator('[class*="success"], [class*="verified"], [data-testid*="valid"]')
      .first();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 8000 });
  }

  async expectValidToken(): Promise<void> {
    // Either success indicator or student data is visible
    const hasSuccess = await this.verificationSuccessIndicator
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasStudentData = await this.page
      .locator('table, [class*="transcript"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasSuccess || hasStudentData, 'Expected valid transcript data to be shown').toBeTruthy();
  }

  async expectInvalidToken(): Promise<void> {
    await expect(this.invalidTokenMessage).toBeVisible({ timeout: 6000 });
  }
}
