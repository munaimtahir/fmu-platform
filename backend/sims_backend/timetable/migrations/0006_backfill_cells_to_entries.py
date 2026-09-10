"""Data migration: best-effort backfill of legacy TimetableCell rows into
the normalized TimetableEntry model.

For every existing TimetableCell this migration tries to:
  - match `line1` free text against academics.Course.code / Course.name to
    find a candidate Section (scoped to the cell's weekly_timetable's
    academic_period), and to identify a Group name mentioned in the same
    text (scoped to the weekly_timetable's batch);
  - parse `line2` directly into TimetableEntry.room (same free-text shape);
  - fold `line3` (faculty free text, no FK target on TimetableEntry) into
    TimetableEntry.notes for traceability rather than dropping it silently;
  - parse `time_slot` (e.g. "09:00-10:00") into start_time/end_time.

On a confident single-Section match it creates a TimetableEntry
(status=SCHEDULED), guarding against duplicates for the same
weekly_timetable/day/section/group combination. On no match or an
ambiguous (multiple candidate Section) match, it logs a clear line to
stdout for manual follow-up and does NOT create an entry or raise.

This migration is data-only and does not alter schema. It is written to be
correct against arbitrary data (so it would work in production too) but has
only been exercised here against demo/seed data, per the retirement plan
for TimetableCell (see PENDING_WORK.md §4 / Workstream B).
"""

import re

from django.db import migrations


TIME_SLOT_RE = re.compile(r"^\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$")


def _parse_time_slot(time_slot):
    """Return (start_time, end_time) as datetime.time, or (None, None)."""
    from datetime import time as time_cls

    match = TIME_SLOT_RE.match(time_slot or "")
    if not match:
        return None, None
    start_h, start_m, end_h, end_m = (int(g) for g in match.groups())
    try:
        return time_cls(start_h, start_m), time_cls(end_h, end_m)
    except ValueError:
        return None, None


def _find_matching_sections(Course, Section, academic_period_id, text):
    """Return the queryset of candidate Sections whose Course code/name is
    referenced in `text` (case-insensitive substring match, best-effort)."""
    if not text:
        return Section.objects.none()

    text_lower = text.lower()

    candidate_course_ids = set()
    for course in Course.objects.all().only("id", "code", "name"):
        code = (course.code or "").strip()
        name = (course.name or "").strip()
        if code and code.lower() in text_lower:
            candidate_course_ids.add(course.id)
        elif name and name.lower() in text_lower:
            candidate_course_ids.add(course.id)

    if not candidate_course_ids:
        return Section.objects.none()

    qs = Section.objects.filter(course_id__in=candidate_course_ids)
    if academic_period_id is not None:
        qs = qs.filter(academic_period_id=academic_period_id)
    return qs


def _find_matching_group(Group, batch_id, text):
    """Return a single Group whose name is referenced in `text`, scoped to
    `batch_id`, or None if zero or more-than-one match is found."""
    if not text or batch_id is None:
        return None

    text_lower = text.lower()
    candidates = [
        g for g in Group.objects.filter(batch_id=batch_id).only("id", "name") if g.name and g.name.lower() in text_lower
    ]
    if len(candidates) == 1:
        return candidates[0]
    return None


def backfill_cells_to_entries(apps, schema_editor):
    TimetableCell = apps.get_model("timetable", "TimetableCell")
    TimetableEntry = apps.get_model("timetable", "TimetableEntry")
    Course = apps.get_model("academics", "Course")
    Section = apps.get_model("academics", "Section")
    Group = apps.get_model("academics", "Group")

    skipped = 0
    created = 0
    already_existed = 0

    for cell in TimetableCell.objects.select_related("weekly_timetable").all():
        weekly_timetable = cell.weekly_timetable
        line1 = (cell.line1 or "").strip()
        line2 = (cell.line2 or "").strip()
        line3 = (cell.line3 or "").strip()

        start_time, end_time = _parse_time_slot(cell.time_slot)
        if start_time is None or end_time is None:
            print(
                f"[timetable backfill] SKIP cell={cell.id} weekly_timetable={weekly_timetable_id_repr(weekly_timetable)}: "
                f"unparseable time_slot={cell.time_slot!r} line1={line1!r} line2={line2!r} line3={line3!r}"
            )
            skipped += 1
            continue

        if not line1:
            # Empty cell (no course text) - nothing to backfill.
            continue

        candidate_sections = _find_matching_sections(
            Course, Section, weekly_timetable.academic_period_id, line1
        )
        candidate_ids = list(candidate_sections.values_list("id", flat=True)[:5])

        if len(candidate_ids) != 1:
            print(
                f"[timetable backfill] SKIP cell={cell.id} weekly_timetable={weekly_timetable.id}: "
                f"{'no' if not candidate_ids else 'ambiguous'} course/section match "
                f"(candidates={candidate_ids}) line1={line1!r} line2={line2!r} line3={line3!r}"
            )
            skipped += 1
            continue

        section_id = candidate_ids[0]
        group = _find_matching_group(Group, weekly_timetable.batch_id, line1)

        # Avoid duplicate entries if some already exist for this combination
        # (e.g. a prior partial run, or manually-created entries).
        dup_qs = TimetableEntry.objects.filter(
            weekly_timetable_id=weekly_timetable.id,
            day_of_week=cell.day_of_week,
            section_id=section_id,
        )
        dup_qs = dup_qs.filter(group_id=group.id) if group is not None else dup_qs.filter(group_id__isnull=True)
        if dup_qs.exists():
            already_existed += 1
            continue

        notes = f"Backfilled from legacy TimetableCell #{cell.id}"
        if line3:
            notes += f"; line3 (faculty, free text): {line3}"
        notes = notes[:255]

        TimetableEntry.objects.create(
            weekly_timetable_id=weekly_timetable.id,
            section_id=section_id,
            group_id=group.id if group is not None else None,
            day_of_week=cell.day_of_week,
            start_time=start_time,
            end_time=end_time,
            room=line2[:100],
            status="SCHEDULED",
            notes=notes,
            created_by_id=weekly_timetable.created_by_id,
        )
        created += 1

    print(
        f"[timetable backfill] done: created={created} skipped={skipped} already_existed={already_existed}"
    )


def weekly_timetable_id_repr(weekly_timetable):
    return weekly_timetable.id if weekly_timetable is not None else None


def noop_reverse(apps, schema_editor):
    # Intentionally not reversible: we don't track which TimetableEntry rows
    # were created by this migration vs. created independently afterward.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("timetable", "0005_timetableentry"),
        ("academics", "0009_alter_batch_start_year"),
    ]

    operations = [
        migrations.RunPython(backfill_cells_to_entries, noop_reverse),
    ]
