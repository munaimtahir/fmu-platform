/**
 * Audit Log Page Object
 */

import { Page, expect } from '@playwright/test';

export class AuditPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/system/audit');
    await this.page.waitForLoadState('domcontentloaded');
  }

  get heading() {
    return this.page.getByRole('heading', { name: /audit/i }).first();
  }

  get logTable() {
    return this.page.locator('table, [role="table"]').first();
  }

  get filterInput() {
    return this.page.locator('input[type="search"], input[placeholder*="filter" i], input[placeholder*="search" i]').first();
  }

  get actionFilter() {
    return this.page.locator('select[name="action"], [data-testid="action-filter"]').first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 8000 });
  }

  async filterByAction(action: string): Promise<void> {
    const hasFilter = await this.actionFilter.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasFilter) {
      await this.actionFilter.selectOption(action);
    } else {
      // Try text filter as fallback
      await this.filterInput.fill(action);
    }
  }

  async expectEntryVisible(text: string): Promise<void> {
    const entry = this.page
      .locator('table tbody tr, [role="row"]')
      .filter({ hasText: text })
      .first();
    await expect(entry).toBeVisible({ timeout: 5000 });
  }
}
