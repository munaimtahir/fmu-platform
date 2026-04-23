/**
 * Dashboard / Main Layout Page Object
 * Encapsulates navigation sidebar, header, and role-based landing checks.
 */

import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  get sidebar() {
    return this.page.locator('nav, aside, [role="navigation"]').first();
  }

  get userMenu() {
    return this.page.locator('[data-testid="user-menu"], [aria-label*="user"], button').filter({ hasText: /profile|account|logout|sign out/i }).first();
  }

  get logoutButton() {
    return this.page.locator('button, a').filter({ hasText: /logout|sign out/i }).first();
  }

  navLink(text: string) {
    return this.page
      .locator('nav a, nav button, aside a, aside button, [role="navigation"] a, [role="navigation"] button')
      .filter({ hasText: new RegExp(text, 'i') })
      .first();
  }

  async expectNavVisible(text: string): Promise<void> {
    await expect(this.navLink(text)).toBeVisible({ timeout: 6000 });
  }

  async expectNavAbsent(text: string): Promise<void> {
    const visible = await this.navLink(text).isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible, `Nav item "${text}" should be absent`).toBe(false);
  }

  async logout(): Promise<void> {
    // Try direct logout button first
    const directLogout = this.page.locator('button, a').filter({ hasText: /logout|sign out/i }).first();
    const directVisible = await directLogout.isVisible({ timeout: 2000 }).catch(() => false);
    if (directVisible) {
      await directLogout.click();
    } else {
      // Open user menu first
      const userMenuBtn = this.page
        .locator('[data-testid="user-menu"], [aria-label="User menu"], [class*="avatar"], [class*="user-btn"]')
        .first();
      await userMenuBtn.click();
      await this.logoutButton.click();
    }
    await expect(this.page).toHaveURL(/\/login/, { timeout: 8000 });
  }

  async expectDashboardLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    // Page should show some content, not just a spinner
    await this.page.waitForLoadState('domcontentloaded');
  }
}
