/**
 * Navigation helper for common page transitions.
 * Wraps page.goto() with proper wait strategies for the SPA.
 */

import { Page, expect } from '@playwright/test';

/**
 * Navigate to a route and wait for the app shell to render.
 * For SPA apps: waits for domcontentloaded + a short settle.
 */
export async function goto(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigate and assert we landed on the expected URL pattern.
 */
export async function gotoAndExpect(
  page: Page,
  path: string,
  expectedUrlPattern?: RegExp,
): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  if (expectedUrlPattern) {
    await expect(page).toHaveURL(expectedUrlPattern, { timeout: 8000 });
  }
}

/**
 * Click a sidebar or nav link by its text and wait for navigation.
 */
export async function clickNavLink(page: Page, text: string): Promise<void> {
  const link = page
    .locator('nav a, [role="navigation"] a, aside a, [data-testid*="nav"]')
    .filter({ hasText: new RegExp(text, 'i') })
    .first();
  await link.click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Open a dropdown or action menu by its trigger text.
 */
export async function openMenu(page: Page, triggerText: string): Promise<void> {
  const trigger = page
    .locator('button, [role="button"]')
    .filter({ hasText: new RegExp(triggerText, 'i') })
    .first();
  await trigger.click();
}

/**
 * Click the first "Edit" button on a table row matching rowText.
 */
export async function clickEditOnRow(page: Page, rowText: string): Promise<void> {
  const row = page
    .locator('table tbody tr, [role="row"]')
    .filter({ hasText: rowText })
    .first();
  const editBtn = row.locator('button, a').filter({ hasText: /edit/i }).first();
  await editBtn.click();
}

/**
 * Click the first "Delete" button on a table row matching rowText.
 */
export async function clickDeleteOnRow(page: Page, rowText: string): Promise<void> {
  const row = page
    .locator('table tbody tr, [role="row"]')
    .filter({ hasText: rowText })
    .first();
  const deleteBtn = row.locator('button, a').filter({ hasText: /delete|remove/i }).first();
  await deleteBtn.click();
}

/**
 * Click the primary CTA button (Add / Create / New).
 */
export async function clickCreate(page: Page): Promise<void> {
  const btn = page
    .locator('button, a')
    .filter({ hasText: /^(add|create|new|register)\b/i })
    .first();
  await btn.click();
}

/**
 * Submit the current form.
 */
export async function submitForm(page: Page): Promise<void> {
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
}

/**
 * Wait for a specific URL and return when navigation completes.
 */
export async function waitForUrl(page: Page, pattern: RegExp, timeout = 10000): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout });
}
