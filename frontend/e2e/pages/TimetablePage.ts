/**
 * Timetable Page Object
 * Covers /timetable — staff weekly-timetable view (batch/period select,
 * week list, EntriesPanel/EntryForm) and the student read-only view
 * (StudentTimetableView), rendered from the same route. The legacy
 * free-text TimetableCell grid editor was removed in Workstream B.
 */

import { Page, expect } from '@playwright/test';

export class TimetablePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/timetable');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ---- Staff: batch/period selection ---------------------------------

  get batchSelect() {
    return this.page.getByTestId('timetable-batch-select');
  }

  get academicPeriodSelect() {
    return this.page.getByTestId('timetable-academic-period-select');
  }

  /** Open the custom combobox and click the option with this exact label. */
  private async pickComboboxOption(trigger: ReturnType<Page['getByTestId']>, label: string): Promise<void> {
    await trigger.click();
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  async selectBatch(label: string): Promise<void> {
    await this.pickComboboxOption(this.batchSelect, label);
  }

  async selectAcademicPeriod(label: string): Promise<void> {
    await this.pickComboboxOption(this.academicPeriodSelect, label);
  }

  // ---- Staff: week list -------------------------------------------------

  weekCardEdit(weekId: number | string) {
    return this.page.getByTestId(`week-card-edit-${weekId}`);
  }

  weekCardView(weekId: number | string) {
    return this.page.getByTestId(`week-card-view-${weekId}`);
  }

  get statusBadge() {
    return this.page.getByTestId('timetable-status-badge');
  }

  get viewEditButton() {
    return this.page.getByTestId('timetable-view-edit-button');
  }

  get publishButton() {
    return this.page.getByTestId('timetable-publish-button');
  }

  get saveButton() {
    return this.page.getByTestId('timetable-save-button');
  }

  get cancelEditButton() {
    return this.page.getByTestId('timetable-cancel-button');
  }

  // ---- EntriesPanel / EntryForm ---------------------------------------

  entryRow(entryId: number | string) {
    return this.page.getByTestId(`entry-row-${entryId}`);
  }

  entryCancelButton(entryId: number | string) {
    return this.page.getByTestId(`entry-row-${entryId}-cancel-button`);
  }

  get entryFormSectionSelect() {
    return this.page.getByTestId('entry-form-section-select');
  }

  get entryFormGroupSelect() {
    return this.page.getByTestId('entry-form-group-select');
  }

  get entryFormDaySelect() {
    return this.page.getByTestId('entry-form-day-select');
  }

  get entryFormStartTime() {
    return this.page.getByTestId('entry-form-start-time');
  }

  get entryFormEndTime() {
    return this.page.getByTestId('entry-form-end-time');
  }

  get entryFormRoom() {
    return this.page.getByTestId('entry-form-room');
  }

  get entryFormSubmitButton() {
    return this.page.getByTestId('entry-form-submit-button');
  }

  async selectEntryFormSection(label: string): Promise<void> {
    await this.pickComboboxOption(this.entryFormSectionSelect, label);
  }

  // ---- Student view ---------------------------------------------------

  get todayTab() {
    return this.page.getByTestId('student-timetable-tab-today');
  }

  get weekTab() {
    return this.page.getByTestId('student-timetable-tab-week');
  }

  get prevWeekButton() {
    return this.page.getByTestId('student-timetable-prev-week');
  }

  get nextWeekButton() {
    return this.page.getByTestId('student-timetable-next-week');
  }

  get backToCurrentWeekButton() {
    return this.page.getByTestId('student-timetable-back-to-current-week');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /timetable/i }).first()).toBeVisible({ timeout: 8000 });
  }
}
