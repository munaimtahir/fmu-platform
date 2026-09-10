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

import { Page } from '@playwright/test';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { test, expect } from '../../fixtures/auth';
import { TimetablePage } from '../../pages/TimetablePage';
import { ROUTES } from '../../data/test-data';

const BATCH_LABEL = 'Timetable E2E Batch (Timetable E2E Program)';
const PERIOD_LABEL = 'Timetable E2E Period';

function mondayOf(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function weekRangeText(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 5);
  return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
}

const today = new Date();
const entriesWeekRange = weekRangeText(addWeeks(mondayOf(today), 1));
const publishWeekRange = weekRangeText(addWeeks(mondayOf(today), 2));

/** Select batch + academic period and wait for the week list to render. */
async function selectBatchAndPeriod(page: Page, tt: TimetablePage): Promise<void> {
  await tt.goto();
  await tt.selectBatch(BATCH_LABEL);
  await tt.selectAcademicPeriod(PERIOD_LABEL);
  await expect(page.locator('[data-testid^="week-card-"]').first()).toBeVisible({ timeout: 20000 });
}

test.describe('Faculty Timetable Tests @faculty', () => {
  test('FAC-13: Faculty can access /timetable and select batch/period', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await expect(page.getByRole('heading', { name: /weekly timetable/i })).toBeVisible({ timeout: 8000 });

    await tt.selectBatch(BATCH_LABEL);
    await tt.selectAcademicPeriod(PERIOD_LABEL);

    const entriesWeekCard = page.locator('[data-testid^="week-card-draft-"]').filter({ hasText: entriesWeekRange });
    await expect(entriesWeekCard).toBeVisible({ timeout: 20000 });
  });

  test('FAC-14: Faculty can add a normalized entry via EntryForm', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await selectBatchAndPeriod(page, tt);

    const entriesWeekCard = page.locator('[data-testid^="week-card-draft-"]').filter({ hasText: entriesWeekRange });
    await entriesWeekCard.getByRole('button', { name: 'View', exact: true }).click();

    await expect(page.getByText('Course Entries')).toBeVisible({ timeout: 8000 });

    await tt.selectEntryFormSection('TTD-101 Section A');
    await tt.entryFormDaySelect.click();
    await page.getByRole('button', { name: 'Thursday', exact: true }).click();
    await tt.entryFormStartTime.fill('14:00');
    await tt.entryFormEndTime.fill('15:00');
    await tt.entryFormRoom.fill('Room 999');
    await tt.entryFormSubmitButton.click();

    await expect(page.getByText('Room 999')).toBeVisible({ timeout: 8000 });
  });

  test('FAC-15: Faculty can cancel an entry via EntriesPanel', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await selectBatchAndPeriod(page, tt);

    const entriesWeekCard = page.locator('[data-testid^="week-card-draft-"]').filter({ hasText: entriesWeekRange });
    await entriesWeekCard.getByRole('button', { name: 'View', exact: true }).click();

    const entryRow = page.locator('[data-testid^="entry-row-"]').filter({ hasText: 'Room 101' }).first();
    await expect(entryRow).toBeVisible({ timeout: 8000 });

    const cancelButton = entryRow.getByRole('button', { name: 'Cancel', exact: true });
    // Only present while the entry isn't already cancelled from a previous run.
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      await expect(entryRow.getByText('CANCELLED')).toBeVisible({ timeout: 8000 });
    } else {
      await expect(entryRow.getByText('CANCELLED')).toBeVisible({ timeout: 8000 });
    }
  });

  test('FAC-16: Faculty can publish a draft week', async ({ facultyPage: page }) => {
    const tt = new TimetablePage(page);
    await selectBatchAndPeriod(page, tt);

    const publishWeekCard = page.locator('[data-testid^="week-card-draft-"]').filter({ hasText: publishWeekRange });

    // Already published by a previous run of this spec — nothing to do.
    const alreadyPublished = await page
      .locator('[data-testid^="week-card-published-"]')
      .filter({ hasText: publishWeekRange })
      .isVisible()
      .catch(() => false);
    if (alreadyPublished) {
      test.skip(true, 'Publish-ready week already published by a previous run');
      return;
    }

    await publishWeekCard.getByRole('button', { name: 'View', exact: true }).click();
    await expect(tt.statusBadge).toHaveText('Draft', { timeout: 8000 });

    page.once('dialog', (dialog) => dialog.accept());
    await tt.publishButton.click();

    // handlePublish's onSuccess navigates back to the list view, so assert
    // the status change is reflected there: the week card moves from the
    // Draft section to the Published section.
    await expect(page.getByText('Timetable published successfully')).toBeVisible({ timeout: 10000 });
    const publishedCard = page.locator('[data-testid^="week-card-published-"]').filter({ hasText: publishWeekRange });
    await expect(publishedCard).toBeVisible({ timeout: 10000 });
    const stillDraft = page.locator('[data-testid^="week-card-draft-"]').filter({ hasText: publishWeekRange });
    await expect(stillDraft).toHaveCount(0);
  });

  test('FAC-17: /timetable is registered as an allowed faculty route', async ({ facultyPage: page }) => {
    await page.goto(ROUTES.timetable);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/login');
    await expect(page.getByRole('heading', { name: /weekly timetable/i })).toBeVisible({ timeout: 8000 });
  });
});
