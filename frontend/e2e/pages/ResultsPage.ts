/**
 * Results / Publish Results Page Object
 * Covers /results, /examcell/publish
 */

import { Page, expect } from '@playwright/test';

export class ResultsPage {
  constructor(private readonly page: Page) {}

  async gotoResults(): Promise<void> {
    await this.page.goto('/results');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoPublish(): Promise<void> {
    await this.page.goto('/examcell/publish');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoGradebook(): Promise<void> {
    await this.page.goto('/gradebook');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoExams(): Promise<void> {
    await this.page.goto('/exams');
    await this.page.waitForLoadState('domcontentloaded');
  }

  get heading() {
    return this.page
      .getByRole('heading', { name: /results|gradebook|exams|publish/i })
      .first();
  }

  get publishButton() {
    return this.page
      .locator('button')
      .filter({ hasText: /publish/i })
      .first();
  }

  get freezeButton() {
    return this.page
      .locator('button')
      .filter({ hasText: /freeze/i })
      .first();
  }

  get draftBadge() {
    return this.page
      .locator('[class*="badge"], [class*="status"], span, td')
      .filter({ hasText: /draft/i })
      .first();
  }

  get publishedBadge() {
    return this.page
      .locator('[class*="badge"], [class*="status"], span, td')
      .filter({ hasText: /published/i })
      .first();
  }

  get frozenBadge() {
    return this.page
      .locator('[class*="badge"], [class*="status"], span, td')
      .filter({ hasText: /frozen/i })
      .first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 8000 });
  }

  async expectPublishButtonVisible(): Promise<void> {
    await expect(this.publishButton).toBeVisible({ timeout: 5000 });
  }

  async expectFreezeButtonVisible(): Promise<void> {
    await expect(this.freezeButton).toBeVisible({ timeout: 5000 });
  }

  async clickPublish(): Promise<void> {
    await this.publishButton.click();
  }

  async clickFreeze(): Promise<void> {
    await this.freezeButton.click();
  }

  async expectPublishedBadgeVisible(): Promise<void> {
    await expect(this.publishedBadge).toBeVisible({ timeout: 6000 });
  }

  async expectFrozenBadgeVisible(): Promise<void> {
    await expect(this.frozenBadge).toBeVisible({ timeout: 6000 });
  }
}
