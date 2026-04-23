/**
 * Role-based authenticated fixture factory.
 *
 * Usage in tests:
 *
 *   import { test } from '../fixtures/auth';
 *
 *   test('admin can see audit log', async ({ adminPage }) => {
 *     await adminPage.goto('/system/audit');
 *     ...
 *   });
 */

import { test as base } from '@playwright/test';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { AUTH_STATE_FILES } from '../data/test-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type AuthFixtures = {
  adminPage: Page;
  registrarPage: Page;
  facultyPage: Page;
  studentPage: Page;
  examcellPage: Page;
};

/** Resolve auth state file from a relative path */
function authStatePath(relative: string): string {
  return path.resolve(__dirname, '..', relative);
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const stateFile = authStatePath(AUTH_STATE_FILES.admin);
    const context = await browser.newContext({ storageState: stateFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  registrarPage: async ({ browser }, use) => {
    const stateFile = authStatePath(AUTH_STATE_FILES.registrar);
    const context = await browser.newContext({ storageState: stateFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  facultyPage: async ({ browser }, use) => {
    const stateFile = authStatePath(AUTH_STATE_FILES.faculty);
    const context = await browser.newContext({ storageState: stateFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  studentPage: async ({ browser }, use) => {
    const stateFile = authStatePath(AUTH_STATE_FILES.student);
    const context = await browser.newContext({ storageState: stateFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  examcellPage: async ({ browser }, use) => {
    const stateFile = authStatePath(AUTH_STATE_FILES.examcell);
    const context = await browser.newContext({ storageState: stateFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
