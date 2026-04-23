/**
 * Public Routes Tests
 * No authentication required.
 *
 * Tags: @public
 * Target: 4 tests
 */

import { test, expect } from '@playwright/test';
import { TranscriptVerifyPage } from '../../pages/TranscriptVerifyPage';

test.describe('Public Routes @public', () => {
  test('PUB-01: Transcript verify page loads without authentication', async ({ page }) => {
    const verifyPage = new TranscriptVerifyPage(page);
    // Use a clearly invalid token - should render error state, not redirect to login
    await verifyPage.goto('invalid-token-no-auth-check');
    await verifyPage.expectPageLoaded();
    // Must NOT redirect to login
    expect(page.url()).not.toContain('/login');
  });

  test('PUB-02: Valid-format but nonexistent token shows friendly error', async ({ page }) => {
    const verifyPage = new TranscriptVerifyPage(page);
    // Use a UUID-format token that won't exist in DB
    await verifyPage.goto('00000000-0000-0000-0000-000000000000');
    await verifyPage.expectPageLoaded();
    await verifyPage.expectInvalidToken();
  });

  test('PUB-03: Completely invalid token shows error, not a crash', async ({ page }) => {
    const verifyPage = new TranscriptVerifyPage(page);
    await verifyPage.goto('this-is-not-a-valid-token-xyz-!@#');
    // Page should render something, not a blank white screen or JS error
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy(); // Not empty
    expect(page.url()).not.toContain('/login');
  });

  test('PUB-04: Apply / student application page loads without auth', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('domcontentloaded');
    // Should load the student application form
    expect(page.url()).not.toContain('/login');
    // Should show a form
    const content = page.locator('form').first();
    await expect(content).toBeVisible({ timeout: 8000 });
    // Should show inactive banner
    const banner = page.locator(':text("Online Submission Inactive")').first();
    await expect(banner).toBeVisible();
  });
});
