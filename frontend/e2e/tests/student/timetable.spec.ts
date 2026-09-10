/**
 * Student Timetable Tests
 *
 * Exercises the read-only StudentTimetableView on /timetable: Today/This
 * Week toggle, previous/next week navigation, and both empty states.
 *
 * Fixture data is created by `backend/core/management/commands/
 * seed_timetable_demo.py`, tied to the `pilot_student` user (Student
 * record in "Timetable E2E Batch" / "Timetable E2E Group A"):
 *   - A PUBLISHED WeeklyTimetable for the CURRENT week with two
 *     TimetableEntry rows, deliberately placed on two weekdays that
 *     exclude today's weekday — so the "Today" tab always shows the
 *     empty state regardless of which day this spec runs on, while
 *     "This Week" shows real entries.
 *   - No WeeklyTimetable at all for the adjacent (prev/next) weeks, so
 *     navigating there always shows the "no published schedule" state.
 *
 * Tags: @student
 */

import { test, expect } from '../../fixtures/auth';
import { TimetablePage } from '../../pages/TimetablePage';
import { ROUTES } from '../../data/test-data';

const TODAY_EMPTY_TEXT = 'No classes scheduled for today.';
const WEEK_EMPTY_TEXT = 'No published schedule for this week yet.';

test.describe('Student Timetable Tests @student', () => {
  test('STU-11: Student sees My Timetable with Today tab active by default', async ({ studentPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await expect(page.getByRole('heading', { name: /my timetable/i })).toBeVisible({ timeout: 8000 });
    await expect(tt.todayTab).toBeVisible();
    await expect(tt.weekTab).toBeVisible();
  });

  test('STU-12: Today tab shows the empty state (seeded entries exclude today)', async ({ studentPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await tt.todayTab.click();
    await expect(page.getByText(TODAY_EMPTY_TEXT)).toBeVisible({ timeout: 8000 });
  });

  test('STU-13: This Week tab shows the published week entries', async ({ studentPage: page }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await tt.weekTab.click();
    await expect(page.getByText(/Room 20(1|2)/).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(WEEK_EMPTY_TEXT)).not.toBeVisible();
  });

  test('STU-14: Previous/Next week navigation shows the "no published schedule" empty state', async ({
    studentPage: page,
  }) => {
    const tt = new TimetablePage(page);
    await tt.goto();
    await tt.weekTab.click();
    await expect(page.getByText(/Room 20(1|2)/).first()).toBeVisible({ timeout: 8000 });

    await tt.prevWeekButton.click();
    await expect(page.getByText(WEEK_EMPTY_TEXT)).toBeVisible({ timeout: 8000 });

    await tt.backToCurrentWeekButton.click();
    await expect(page.getByText(/Room 20(1|2)/).first()).toBeVisible({ timeout: 8000 });

    await tt.nextWeekButton.click();
    await expect(page.getByText(WEEK_EMPTY_TEXT)).toBeVisible({ timeout: 8000 });

    await tt.backToCurrentWeekButton.click();
    await expect(page.getByText(/Room 20(1|2)/).first()).toBeVisible({ timeout: 8000 });
  });

  test('STU-15: Shows an error alert when the timetable API fails', async ({ studentPage: page }) => {
    await page.route('**/api/mobile/student/timetable/**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'error' }) }),
    );

    const tt = new TimetablePage(page);
    await tt.goto();

    await expect(page.getByText('Unable to load your timetable. Please try again later.')).toBeVisible({
      timeout: 8000,
    });
  });

  test('STU-16: /timetable is registered as an allowed student route', async ({ studentPage: page }) => {
    await page.goto(ROUTES.timetable);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/login');
    await expect(page.getByRole('heading', { name: /my timetable/i })).toBeVisible({ timeout: 8000 });
  });
});
