"""Service helpers for attendance input workflows."""

from __future__ import annotations

import csv
import hashlib
from dataclasses import dataclass
from datetime import date
from io import StringIO
from typing import Iterable, List, Mapping, MutableMapping, Optional

from django.contrib.auth.models import Group, User
from django.utils import timezone

from sims_backend.attendance.models import Attendance
from sims_backend.common_permissions import in_group
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session


STATUS_PRESENT = Attendance.STATUS_PRESENT
STATUS_ABSENT = Attendance.STATUS_ABSENT


@dataclass
class AttendanceInputJobSummary:
    matched: int
    unknown: int
    errors: List[Mapping[str, object]]
    duplicates: List[str]
    records: List[Mapping[str, object]]


def _has_admin_override(user: User) -> bool:
    return bool(
        user.is_superuser
        or in_group(user, "ADMIN")
        or in_group(user, "COORDINATOR")
        or in_group(user, "Admin")
    )


def parse_status_value(value: str | int | bool | None, default: str = STATUS_PRESENT) -> str:
    """Normalize incoming status tokens into Attendance constants."""
    if value is None or value == "":
        return default
    token = str(value).strip().lower()
    if token in {"p", "present", "1", "true", "t", "y", "yes"}:
        return STATUS_PRESENT
    if token in {"a", "absent", "0", "false", "f", "n", "no"}:
        return STATUS_ABSENT
    return default


def build_roster_for_session(
    *, session: Session, default_status: str = STATUS_PRESENT
) -> List[dict]:
    """Return roster for the session's group with any existing attendance."""
    students = Student.objects.filter(group=session.group).order_by("reg_no")
    existing = Attendance.objects.filter(session=session)
    status_map = {att.student_id: att.status for att in existing}

    roster: List[dict] = []
    for student in students:
        roster.append(
            {
                "student_id": student.id,
                "reg_no": student.reg_no,
                "name": student.name,
                "status": status_map.get(student.id),
                "default_status": default_status,
            }
        )
    return roster


def _validate_date(session: Session, target_date: Optional[date], user: User) -> None:
    """Validate date editing rules."""
    if not target_date:
        return
    today = timezone.localdate()
    if target_date < today and not _has_admin_override(user):
        raise ValueError("Editing attendance for past dates requires admin privileges.")
    session_date = session.starts_at.date()
    if session_date != target_date:
        # Allow near-matches but warn
        if not _has_admin_override(user):
            raise ValueError("Date does not match the session schedule.")


def bulk_upsert_attendance_for_session(
    *,
    session: Session,
    records: Iterable[Mapping[str, object]],
    default_status: str,
    actor: User,
    target_date: Optional[date] = None,
) -> Mapping[str, int]:
    """Upsert attendance rows for a session given minimal payload."""
    _validate_date(session, target_date, actor)
    students = Student.objects.filter(group=session.group)
    valid_ids = {student.id for student in students}
    statuses: MutableMapping[int, str] = {sid: default_status for sid in valid_ids}

    for record in records:
        sid = record.get("student_id") or record.get("student")
        reg_no = record.get("reg_no")
        status_val = parse_status_value(record.get("status"), default_status)
        if not sid and reg_no:
            try:
                sid = students.get(reg_no=reg_no).id
            except Student.DoesNotExist:
                continue
        if not sid or sid not in valid_ids:
            continue
        statuses[int(sid)] = status_val

    created = 0
    updated = 0
    absent = 0
    for status_val in statuses.values():
        if status_val == STATUS_ABSENT:
            absent += 1

    for sid, status_val in statuses.items():
        attendance, was_created = Attendance.objects.update_or_create(
            session=session,
            student_id=sid,
            defaults={
                "status": status_val,
                "marked_by": actor,
                "marked_at": timezone.now(),
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1

    return {"created": created, "updated": updated, "total": len(statuses), "absent": absent}


def _hash_file(file_obj) -> str:
    hasher = hashlib.sha256()
    for chunk in file_obj.chunks():
        hasher.update(chunk)
    return hasher.hexdigest()


def parse_csv_payload(
    *,
    file_obj,
    session: Session,
    default_status: str = STATUS_PRESENT,
) -> AttendanceInputJobSummary:
    """Parse a CSV upload into normalized records."""
    file_obj.seek(0)
    content = file_obj.read().decode("utf-8")
    reader = csv.DictReader(StringIO(content))

    students = Student.objects.filter(group=session.group)
    students_by_reg = {s.reg_no: s for s in students}
    duplicates: list[str] = []
    seen: set[str] = set()
    records: list[dict] = []
    errors: list[dict] = []

    for idx, row in enumerate(reader, start=2):
        reg_no = (row.get("reg_no") or row.get("roll_no") or "").strip()
        status_token = row.get("status") or row.get("present") or row.get("absent")
        if not reg_no:
            errors.append({"row": idx, "message": "Missing reg_no"})
            continue
        if reg_no in seen:
            duplicates.append(reg_no)
            continue
        seen.add(reg_no)

        student = students_by_reg.get(reg_no)
        if not student:
            errors.append({"row": idx, "reg_no": reg_no, "message": "Unknown student"})
            continue

        status_val = parse_status_value(status_token, default_status)
        records.append({"student_id": student.id, "reg_no": reg_no, "status": status_val})

    matched = len(records)
    unknown = sum(1 for e in errors if e.get("message") == "Unknown student")
    return AttendanceInputJobSummary(
        matched=matched,
        unknown=unknown,
        errors=errors,
        duplicates=duplicates,
        records=records,
    )


def compute_file_fingerprint(file_obj) -> str:
    """Return a short fingerprint for storage."""
    try:
        file_obj.seek(0)
    except Exception:
        pass
    digest = _hash_file(file_obj)
    try:
        file_obj.seek(0)
    except Exception:
        pass
    return digest[:16]
