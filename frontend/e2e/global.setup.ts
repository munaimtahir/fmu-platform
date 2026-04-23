/**
 * Global test setup — runs once before all tests.
 *
 * Responsibilities:
 * 1. Generate and save auth storage states for all 5 roles.
 *    These are then reused by test projects via storageState.
 */

import { chromium, FullConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { USERS, AUTH_STATE_FILES, RoleName } from './data/test-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

/**
 * Perform a login via the UI and save the storage state.
 * UI login is used here (not API-only) so the full auth flow is tested at least once.
 */
async function saveAuthState(
  username: string,
  password: string,
  stateFile: string,
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  try {
    await page.goto('/login');
    await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });

    await page.fill('input[name="identifier"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });

    // Ensure auth state dir exists
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await context.storageState({ path: stateFile });
    console.log(`✓ Saved auth state for ${username} → ${stateFile}`);
  } catch (error) {
    console.error(`✗ Failed to create auth state for ${username}:`, error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('\n🔧 Global Setup: Preparing auth states for Frozen Pilot Baseline...\n');

  // Step 1: Generate auth storage states for all roles
  const roles: RoleName[] = ['admin', 'registrar', 'faculty', 'student', 'examcell'];

  for (const role of roles) {
    const user = USERS[role];
    // Resolve state file relative to this file's directory
    const stateFile = path.resolve(__dirname, AUTH_STATE_FILES[role]);
    await saveAuthState(user.username, user.password, stateFile);
  }

  console.log('\n✅ Global Setup complete.\n');
}
