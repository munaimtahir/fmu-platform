/**
 * Reusable assertion helpers for common UI patterns in SIMS.
 * Use these instead of raw locators to keep tests readable and resilient.
 */

import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Toast / notification assertions
// ---------------------------------------------------------------------------

/**
 * Assert a success toast appeared (react-hot-toast).
 * Does NOT require exact text - pass substring.
 */
export async function expectSuccessToast(page: Page, text?: string): Promise<void> {
  const toastSelector = '[role="status"], [data-testid="toast"], .react-hot-toast, [class*="toast"]';
  const toast = page.locator(toastSelector).filter({ hasText: text ?? /success|saved|created|updated|deleted/i }).first();
  await expect(toast).toBeVisible({ timeout: 6000 });
}

/**
 * Assert an error toast appeared.
 */
export async function expectErrorToast(page: Page, text?: string): Promise<void> {
  const toastSelector = '[role="alert"], [data-testid="toast-error"], [class*="toast"]';
  const toast = page.locator(toastSelector).filter({ hasText: text ?? /error|failed|invalid|denied/i }).first();
  await expect(toast).toBeVisible({ timeout: 6000 });
}

// ---------------------------------------------------------------------------
// Route / redirect assertions
// ---------------------------------------------------------------------------

/**
 * Assert the page redirected to login (unauthenticated access).
 */
export async function expectRedirectedToLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
}

/**
 * Assert we are on an unauthorized/forbidden page.
 * ProtectedRoute renders 403/unauthorized content.
 */
export async function expectUnauthorizedPage(page: Page): Promise<void> {
  // Either URL changes to /unauthorized or page shows a forbidden message
  const isForbiddenUrl = page.url().includes('/unauthorized') || page.url().includes('/403');
  const hasUnauthorizedText = await page
    .getByText(/not authorized|access denied|forbidden|unauthorized|don't have permission/i)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!isForbiddenUrl && !hasUnauthorizedText) {
    // May also redirect back to dashboard
    const isDashboard = page.url().includes('/dashboard');
    expect(isDashboard || hasUnauthorizedText, 'Expected unauthorized state').toBeTruthy();
  }
}

// ---------------------------------------------------------------------------
// Table / list assertions
// ---------------------------------------------------------------------------

/**
 * Assert a data table row containing given text is visible.
 */
export async function expectTableRow(page: Page, text: string): Promise<void> {
  const row = page.locator('table tbody tr, [role="row"]').filter({ hasText: text }).first();
  await expect(row).toBeVisible({ timeout: 5000 });
}

/**
 * Assert table row count is >= minimum.
 */
export async function expectTableRowCount(page: Page, minCount: number): Promise<void> {
  const rows = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])');
  const count = await rows.count();
  expect(count, `Expected at least ${minCount} table rows`).toBeGreaterThanOrEqualTo(minCount);
}

// ---------------------------------------------------------------------------
// Badge / status assertions
// ---------------------------------------------------------------------------

/**
 * Assert a status badge with given text is visible on the page.
 * Used for result DRAFT / PUBLISHED / FROZEN badges.
 */
export async function expectStatusBadge(page: Page, status: string): Promise<void> {
  const badge = page
    .locator('[data-testid*="badge"], [class*="badge"], [class*="status"], span, td')
    .filter({ hasText: new RegExp(status, 'i') })
    .first();
  await expect(badge).toBeVisible({ timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Modal assertions
// ---------------------------------------------------------------------------

/**
 * Assert a confirmation modal/dialog is visible.
 */
export async function expectConfirmModal(page: Page): Promise<void> {
  const modal = page
    .locator('[role="dialog"], [data-testid="modal"], [class*="modal"]')
    .first();
  await expect(modal).toBeVisible({ timeout: 5000 });
}

/**
 * Dismiss a confirmation modal by clicking the confirm button.
 */
export async function confirmModal(page: Page): Promise<void> {
  const confirmBtn = page
    .locator('[role="dialog"] button, [data-testid="modal"] button')
    .filter({ hasText: /confirm|yes|ok|proceed|delete|submit/i })
    .first();
  await confirmBtn.click();
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

/**
 * Fill a labeled form field by its label text.
 */
export async function fillField(page: Page, label: string, value: string): Promise<void> {
  const field = page.getByLabel(label, { exact: false });
  await field.fill(value);
}

/**
 * Select an option in a labeled <select> by visible text.
 */
export async function selectOption(page: Page, label: string, value: string): Promise<void> {
  const select = page.getByLabel(label, { exact: false });
  await select.selectOption({ label: value });
}

// ---------------------------------------------------------------------------
// Navigation / sidebar helpers
// ---------------------------------------------------------------------------

/**
 * Assert a sidebar navigation link is visible (role-appropriate nav item present).
 */
export async function expectNavItem(page: Page, text: string): Promise<void> {
  const navItem = page
    .locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button, aside a, aside button, [data-testid*="nav"]')
    .filter({ hasText: new RegExp(text, 'i') })
    .first();
  await expect(navItem).toBeVisible({ timeout: 5000 });
}

/**
 * Assert a sidebar nav link is NOT present (hidden for role).
 */
export async function expectNavItemAbsent(page: Page, text: string): Promise<void> {
  const navItem = page
    .locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button, aside a, aside button, [data-testid*="nav"]')
    .filter({ hasText: new RegExp(text, 'i') })
    .first();
  const visible = await navItem.isVisible({ timeout: 2000 }).catch(() => false);
  expect(visible, `Nav item "${text}" should be absent`).toBe(false);
}

/**
 * Assert an action button (Create, Edit, Delete, Publish, etc.) is absent.
 * Used to verify forbidden actions are hidden for given role.
 */
export async function expectButtonAbsent(page: Page, text: string): Promise<void> {
  const btn = page
    .locator('button, [role="button"]')
    .filter({ hasText: new RegExp(text, 'i') })
    .first();
  // Button should either not exist or not be visible
  const visible = await btn.isVisible({ timeout: 2000 }).catch(() => false);
  expect(visible, `Button "${text}" should not be visible for this role`).toBe(false);
}

// ---------------------------------------------------------------------------
// Page loading helpers
// ---------------------------------------------------------------------------

/**
 * Wait for a page to finish loading API data (no pending network requests).
 * More reliable than waitForLoadState('networkidle') in some SPA scenarios.
 */
export async function waitForPageData(page: Page, heading?: string): Promise<void> {
  if (heading) {
    await expect(
      page.getByRole('heading', { name: new RegExp(heading, 'i') }).first(),
    ).toBeVisible({ timeout: 10000 });
  } else {
    await page.waitForLoadState('domcontentloaded');
    // Wait for spinners to disappear
    const spinner = page.locator('[class*="spinner"], [class*="loading"], [aria-label*="loading"]').first();
    await spinner.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }
}
