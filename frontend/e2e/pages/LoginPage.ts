/**
 * Login Page Object
 * Encapsulates login form interactions.
 */

import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.locator('form')).toBeVisible({ timeout: 10000 });
  }

  get identifierInput() {
    return this.page.locator('input[name="identifier"]');
  }

  get passwordInput() {
    return this.page.locator('input[name="password"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get errorMessage() {
    return this.page
      .locator('[role="alert"], [class*="error"], [class*="alert"]')
      .filter({ hasText: /invalid|incorrect|failed|wrong|not found/i })
      .first();
  }

  async login(username: string, password: string): Promise<void> {
    await this.identifierInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForDashboard(username: string, password: string): Promise<void> {
    await this.login(username, password);
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  }

  async expectErrorVisible(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 6000 });
  }
}
