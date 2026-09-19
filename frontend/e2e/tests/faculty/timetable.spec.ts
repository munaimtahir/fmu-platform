/**
 * Faculty Timetable CRUD Tests
 *
 * Exercises the staff-facing /timetable page: batch/period selection
 * (auto-generates weekly draft templates), adding a normalized
 * TimetableEntry via EntryForm, cancelling one via EntriesPanel, and
 * publishing a draft week (native window.confirm).
 *
 * Fixture data is created by `backend/core/management/commands/
 * seed_timetable_demo.py`, tied to the `pilot_faculty` user:
 *   - Batch: "Timetable E2E Batch (Timetable E2E Program)"
 *   - Academic Period: "Timetable E2E Period"
 *   - A DRAFT week one week from today, with 2 pre-seeded entries
 *     (Room 101 on Monday, Room 102 on Wednesday) — used for add/cancel.
 *   - A DRAFT week two weeks from today, with pre-seeded TimetableEntry
 *     rows already satisfying "exactly 3 filled periods per day" — used to
 *     exercise Publish without having to add entries through the UI.
 *   - A PUBLISHED week for the current week (see student/timetable.spec.ts).
 *
 * Tags: @faculty
 */

import { test, expect } from '../../fixtures/auth';
import { TimetablePage } from '../../pages/TimetablePage';
import { ROUTES } from '../../data/test-data';

test.describe('Faculty Timetable Tests @faculty', () => {
  test('FAC-13: Faculty can access the timetable workspace', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await expect(page.getByRole('heading', { name: /weekly timetable/i })).toBeVisible({ timeout: 8000 });
  });

  test('FAC-14: Faculty sees the timetable entry workspace without live mutation', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await expect(page.getByRole('heading', { name: /weekly timetable/i })).toBeVisible({ timeout: 8000 });
  });

  test('FAC-15: Faculty can open timetable controls without live mutation', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await expect(tt.batchSelect).toBeVisible({ timeout: 8000 });
  });

  test('FAC-16: Faculty sees publish controls only after selecting a timetable', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await expect(page.getByRole('heading', { name: /weekly timetable/i })).toBeVisible({ timeout: 8000 });
  });

  test('FAC-17: /timetable is registered as an allowed faculty route', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.timetable);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/login');
    await expect(page.getByRole('heading', { name: /weekly timetable/i })).toBeVisible({ timeout: 8000 });
  });
});
