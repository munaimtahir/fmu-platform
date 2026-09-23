"""Secure, create-only student onboarding CSV import."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone

from sims_backend.academics.models import Batch, Group, Program
from sims_backend.people.models import ContactInfo, Person
from sims_backend.students.imports.models import ImportJob
from sims_backend.students.imports.templates import REQUIRED_COLUMNS, get_expected_columns
from sims_backend.students.imports.utils import normalize_row, parse_csv_file_with_headers, safe_csv_export
from sims_backend.students.models import Student
from sims_backend.students.onboarding import ProvisioningData, normalize_registration_number, provision_student

User = get_user_model()
REDACTED = "[REDACTED]"


def _file_hash(file) -> str:
    file.seek(0)
    digest = hashlib.sha256()
    for chunk in file.chunks():
        digest.update(chunk)
    file.seek(0)
    return digest.hexdigest()


def _parse_iso_date(value: str | None):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValidationError("date_of_birth must use YYYY-MM-DD") from exc


def _sanitize(row: dict[str, Any]) -> dict[str, Any]:
    return {key: (REDACTED if key == "initial_password" and value else value) for key, value in row.items()}


def _validate_file_contract(headers, rows):
    if not rows:
        raise ValidationError("CSV must include a header and at least one student row")
    if len(headers) != len(set(headers)):
        duplicates = sorted({header for header in headers if headers.count(header) > 1})
        raise ValidationError(f"Duplicate columns: {', '.join(duplicates)}")
    columns = set(headers)
    missing = set(REQUIRED_COLUMNS) - columns
    unknown = columns - set(get_expected_columns())
    if missing:
        raise ValidationError(f"Missing required columns: {', '.join(sorted(missing))}")
    if unknown:
        raise ValidationError(f"Unsupported columns: {', '.join(sorted(str(item) for item in unknown))}")
    expected_order = [column for column in get_expected_columns() if column in columns]
    if headers != expected_order:
        raise ValidationError("CSV columns must follow the downloaded template order")


def _error_messages(exc: Exception) -> list[dict[str, str]]:
    messages = exc.messages if isinstance(exc, ValidationError) else [str(exc)]
    return [{"column": "row", "message": message} for message in messages]


def _validated_row(row: dict[str, Any]) -> tuple[ProvisioningData, dict[str, Any]]:
    required = ["first_name", "last_name", "registration_number", "program_id", "batch_id", "initial_password"]
    missing = [field for field in required if not row.get(field)]
    if missing:
        raise ValidationError([f"Required field '{field}' is missing or empty" for field in missing])

    reg_no = normalize_registration_number(str(row["registration_number"]))
    try:
        program = Program.objects.get(pk=int(row["program_id"]), is_active=True)
        batch = Batch.objects.get(pk=int(row["batch_id"]), is_active=True)
    except (TypeError, ValueError, Program.DoesNotExist, Batch.DoesNotExist) as exc:
        raise ValidationError("Program and Batch IDs must identify active records") from exc
    if batch.program_id != program.id:
        raise ValidationError("Batch does not belong to Program")

    group = None
    if row.get("group_id"):
        try:
            group = Group.objects.get(pk=int(row["group_id"]), batch=batch)
        except (TypeError, ValueError, Group.DoesNotExist) as exc:
            raise ValidationError("Group must identify a record in the selected Batch") from exc

    email = str(row.get("email") or "").strip()
    if email:
        validate_email(email)
    gender = str(row.get("gender") or "").strip().lower()
    valid_genders = {choice[0] for choice in Person.GENDER_CHOICES}
    if gender and gender not in valid_genders:
        raise ValidationError(f"gender must be one of: {', '.join(sorted(valid_genders))}")
    password = str(row["initial_password"])
    validate_password(
        password,
        user=User(
            username=reg_no, first_name=row["first_name"], last_name=row["last_name"], email=row.get("email", "")
        ),
    )

    data = ProvisioningData(
        registration_number=reg_no,
        first_name=str(row["first_name"]).strip(),
        middle_name=str(row.get("middle_name") or "").strip(),
        last_name=str(row["last_name"]).strip(),
        initial_password=password,
        program=program,
        batch=batch,
        group=group,
        email=email,
        mobile_number=str(row.get("mobile_number") or "").strip(),
        date_of_birth=_parse_iso_date(row.get("date_of_birth")),
        gender=gender,
    )
    if not data.first_name or not data.last_name:
        raise ValidationError("First and last name are required")
    for field in ("first_name", "middle_name", "last_name"):
        if len(getattr(data, field)) > 100:
            raise ValidationError(f"{field} exceeds 100 characters")
    if len(data.mobile_number) > 20:
        raise ValidationError("mobile_number exceeds 20 characters")
    return data, _sanitize(row)


def _matches_existing(student: Student, data: ProvisioningData) -> bool:
    if not student.user_id or not student.person_id or student.user.username != data.registration_number:
        return False
    person = student.person
    email = person.contact_info.filter(type=ContactInfo.TYPE_EMAIL).order_by("-is_primary", "id").first()
    phone = person.contact_info.filter(type=ContactInfo.TYPE_PHONE).order_by("-is_primary", "id").first()
    return all(
        [
            person.first_name == data.first_name,
            person.middle_name == data.middle_name,
            person.last_name == data.last_name,
            person.date_of_birth == data.date_of_birth,
            person.gender == data.gender,
            (email.value if email else "") == data.email,
            (phone.value if phone else "") == data.mobile_number,
            student.program_id == data.program.id,
            student.batch_id == data.batch.id,
            student.group_id == (data.group.id if data.group else None),
        ]
    )


class StudentImportService:
    @staticmethod
    def preview(file, user) -> dict[str, Any]:
        headers, rows = parse_csv_file_with_headers(file)
        _validate_file_contract(headers, rows)
        file_hash = _file_hash(file)
        job = ImportJob.objects.create(
            created_by=user,
            original_filename=file.name,
            file_hash=file_hash,
            status=ImportJob.STATUS_PENDING,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        preview_rows: list[dict[str, Any]] = []
        seen: set[str] = set()
        counts = {"create_count": 0, "unchanged_count": 0, "reject_count": 0}

        for index, raw in enumerate(rows, start=2):
            row = normalize_row(raw)
            try:
                data, sanitized = _validated_row(row)
                if data.registration_number in seen:
                    raise ValidationError("Duplicate registration number in file")
                seen.add(data.registration_number)
                student = (
                    Student.objects.filter(reg_no__iexact=data.registration_number)
                    .select_related("user", "person")
                    .first()
                )
                user_exists = User.objects.filter(username__iexact=data.registration_number).exists()
                if student and _matches_existing(student, data):
                    action = "UNCHANGED"
                    counts["unchanged_count"] += 1
                elif student or user_exists:
                    raise ValidationError("Registration number collides with existing or mismatched records")
                else:
                    action = "CREATE"
                    counts["create_count"] += 1
                preview_rows.append({"row_number": index, "action": action, "errors": [], "data": sanitized})
            except Exception as exc:
                counts["reject_count"] += 1
                preview_rows.append(
                    {"row_number": index, "action": "REJECT", "errors": _error_messages(exc), "data": _sanitize(row)}
                )

        job.total_rows = len(rows)
        job.valid_rows = counts["create_count"] + counts["unchanged_count"]
        job.invalid_rows = counts["reject_count"]
        job.status = ImportJob.STATUS_PREVIEWED
        job.summary = counts
        job.save()
        return {
            "import_job_id": str(job.id),
            "total_rows": job.total_rows,
            "valid_rows": job.valid_rows,
            "invalid_rows": job.invalid_rows,
            "duplicate_file_warning": ImportJob.objects.filter(file_hash=file_hash, status=ImportJob.STATUS_COMMITTED)
            .exclude(id=job.id)
            .exists(),
            "preview_rows": preview_rows,
            "summary": counts,
        }

    @staticmethod
    def commit(import_job_id: str, file, user) -> dict[str, Any]:
        # Persist expiry outside the row-commit transaction: raising a validation
        # error inside that transaction would otherwise roll this state back.
        ImportJob.objects.filter(
            id=import_job_id,
            created_by=user,
            status=ImportJob.STATUS_PREVIEWED,
            expires_at__lte=timezone.now(),
        ).update(status=ImportJob.STATUS_FAILED, finished_at=timezone.now(), summary={"error": "Preview expired"})
        return StudentImportService._commit(import_job_id, file, user)

    @staticmethod
    @transaction.atomic
    def _commit(import_job_id: str, file, user) -> dict[str, Any]:
        try:
            job = ImportJob.objects.select_for_update().get(id=import_job_id, created_by=user)
        except ImportJob.DoesNotExist as exc:
            raise ValidationError("Import job not found") from exc
        if job.status == ImportJob.STATUS_COMMITTED:
            return StudentImportService._commit_response(job)
        if job.status != ImportJob.STATUS_PREVIEWED:
            raise ValidationError("Import job must be previewed before commit")
        if timezone.now() >= job.expires_at:
            job.status = ImportJob.STATUS_FAILED
            job.finished_at = timezone.now()
            job.summary = {"error": "Preview expired"}
            job.save(update_fields=["status", "finished_at", "summary", "updated_at"])
            raise ValidationError("Import preview expired; upload the file for a new preview")
        if _file_hash(file) != job.file_hash:
            raise ValidationError("Uploaded file does not match the previewed file")

        headers, rows = parse_csv_file_with_headers(file)
        _validate_file_contract(headers, rows)
        created = unchanged = failed = 0
        errors: list[dict[str, Any]] = []
        seen: set[str] = set()
        for index, raw in enumerate(rows, start=2):
            row = normalize_row(raw)
            try:
                data, _ = _validated_row(row)
                if data.registration_number in seen:
                    raise ValidationError("Duplicate registration number in file")
                seen.add(data.registration_number)
                with transaction.atomic():
                    student = (
                        Student.objects.filter(reg_no__iexact=data.registration_number)
                        .select_related("user", "person")
                        .first()
                    )
                    user_exists = User.objects.filter(username__iexact=data.registration_number).exists()
                    if student and _matches_existing(student, data):
                        unchanged += 1
                    elif student or user_exists:
                        raise ValidationError("Registration number collides with existing or mismatched records")
                    else:
                        provision_student(data, actor=user, import_job_id=str(job.id))
                        created += 1
            except Exception as exc:
                failed += 1
                errors.append(
                    {
                        **{key: value for key, value in _sanitize(row).items() if key != "initial_password"},
                        "row_number": index,
                        "error_message": "; ".join(item["message"] for item in _error_messages(exc)),
                    }
                )

        if errors:
            fields = [field for field in get_expected_columns() if field != "initial_password"] + [
                "row_number",
                "error_message",
            ]
            job.error_report_file.save(f"errors_{job.id}.csv", ContentFile(safe_csv_export(errors, fields)), save=False)
        job.created_count = created
        job.unchanged_count = unchanged
        job.failed_count = failed
        job.status = ImportJob.STATUS_COMMITTED
        job.finished_at = timezone.now()
        job.summary = {"created": created, "unchanged": unchanged, "failed": failed}
        job.save()
        return StudentImportService._commit_response(job)

    @staticmethod
    def _commit_response(job: ImportJob) -> dict[str, Any]:
        return {
            "import_job_id": str(job.id),
            "status": job.status,
            "created_count": job.created_count,
            "unchanged_count": job.unchanged_count,
            "failed_count": job.failed_count,
            "has_error_report": bool(job.error_report_file),
        }
