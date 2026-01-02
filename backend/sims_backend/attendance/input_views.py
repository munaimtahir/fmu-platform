"""API endpoints for advanced attendance input methods."""

from __future__ import annotations

from datetime import datetime

from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sims_backend.attendance.models import (
    Attendance,
    AttendanceInputJob,
    BiometricDevice,
    BiometricPunch,
)
from sims_backend.attendance.services import (
        AttendanceInputJobSummary,
        build_roster_for_session,
        bulk_upsert_attendance_for_session,
        compute_file_fingerprint,
        parse_csv_payload,
        parse_status_value,
)
from sims_backend.common_permissions import in_group
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session


def _json_error(message: str, code: int = status.HTTP_400_BAD_REQUEST) -> Response:
    return Response({"error": {"code": code, "message": message}}, status=code)


def _get_session(session_id: int) -> Session:
    try:
        return Session.objects.select_related("group", "faculty").get(id=session_id)
    except Session.DoesNotExist:
        raise ValueError("Session not found")


def _require_session_access(user, session: Session) -> None:
    if user.is_superuser or in_group(user, "ADMIN") or in_group(user, "COORDINATOR"):
        return
    if in_group(user, "FACULTY") and session.faculty_id == user.id:
        return
    raise PermissionError("You do not have access to this session.")


class LiveRosterAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        session_id = request.query_params.get("session_id")
        if not session_id:
            return _json_error("session_id is required")

        try:
            session = _get_session(session_id)
            _require_session_access(request.user, session)
        except ValueError as exc:
            return _json_error(str(exc), status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        roster = build_roster_for_session(session=session)
        return Response(
            {
                "session": session.id,
                "section": session.group_id,
                "date": session.starts_at.date(),
                "default_status": Attendance.STATUS_PRESENT,
                "students": roster,
            }
        )


class LiveSubmitAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        payload = request.data
        session_id = payload.get("session_id")
        if not session_id:
            return _json_error("session_id is required")

        default_status = parse_status_value(payload.get("default_status"), Attendance.STATUS_PRESENT)
        records = payload.get("records", [])
        date_str = payload.get("date")
        target_date = datetime.fromisoformat(date_str).date() if date_str else None

        try:
            session = _get_session(session_id)
            _require_session_access(request.user, session)
        except ValueError as exc:
            return _json_error(str(exc), status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        result = bulk_upsert_attendance_for_session(
            session=session,
            records=records,
            default_status=default_status,
            actor=request.user,
            target_date=target_date,
        )
        audit_summary = (
            f"Attendance bulk submit: session={session.id} "
            f"date={target_date or session.starts_at.date()} "
            f"present={result['total'] - (result.get('absent', 0))} "
            f"absent={result.get('absent', 0)} source=live"
        )
        result["audit_summary"] = audit_summary
        return Response(result, status=status.HTTP_200_OK)


class CSVDryRunAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        session_id = request.data.get("session_id")
        upload = request.FILES.get("file")
        date_str = request.data.get("date")
        if not session_id:
            return _json_error("session_id is required")
        if not upload:
            return _json_error("file is required")

        try:
            session = _get_session(session_id)
            _require_session_access(request.user, session)
        except ValueError as exc:
            return _json_error(str(exc), status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        summary = parse_csv_payload(file_obj=upload, session=session)
        job = AttendanceInputJob.objects.create(
            session=session,
            date=date_str or session.starts_at.date(),
            uploaded_by=request.user,
            input_type=AttendanceInputJob.TYPE_CSV,
            status=AttendanceInputJob.STATUS_DRAFT,
            original_filename=upload.name,
            file_fingerprint=compute_file_fingerprint(upload),
            summary={
                "matched": summary.matched,
                "unknown": summary.unknown,
                "errors": summary.errors,
                "duplicates": summary.duplicates,
                "records": summary.records,
            },
        )
        return Response(
            {
                "job_id": job.id,
                "matched": summary.matched,
                "unknown": summary.unknown,
                "errors": summary.errors,
                "duplicates": summary.duplicates,
                "summary": {
                    "total_rows": summary.matched + summary.unknown + len(summary.errors),
                    "matched": summary.matched,
                    "errors": len(summary.errors),
                },
            },
            status=status.HTTP_200_OK,
        )


class CSVCommitAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        job_id = request.data.get("job_id")
        if not job_id:
            return _json_error("job_id is required")

        try:
            job = AttendanceInputJob.objects.get(
                id=job_id,
                input_type=AttendanceInputJob.TYPE_CSV,
                status=AttendanceInputJob.STATUS_DRAFT,
            )
            _require_session_access(request.user, job.session)
        except AttendanceInputJob.DoesNotExist:
            return _json_error("Job not found or already committed", status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        records = job.summary.get("records", [])
        result = bulk_upsert_attendance_for_session(
            session=job.session,
            records=records,
            default_status=Attendance.STATUS_PRESENT,
            actor=request.user,
            target_date=job.date,
        )
        job.status = AttendanceInputJob.STATUS_COMMITTED
        job.summary["commit_result"] = result
        job.save(update_fields=["status", "summary", "updated_at"])

        return Response(
            {
                "job_id": job.id,
                "committed": True,
                "result": result,
            },
            status=status.HTTP_200_OK,
        )


class TickSheetTemplateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        session_id = request.query_params.get("session_id")
        if not session_id:
            return _json_error("session_id is required")

        try:
            session = _get_session(session_id)
            _require_session_access(request.user, session)
        except ValueError as exc:
            return _json_error(str(exc), status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        students = Student.objects.filter(group=session.group).order_by("reg_no")
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename=\"attendance_sheet_{session.id}.pdf\"'

        pdf = canvas.Canvas(response, pagesize=letter)
        width, height = letter
        y = height - inch
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(inch, y, f"Attendance Sheet - Session {session.id}")
        y -= 0.3 * inch
        pdf.setFont("Helvetica", 10)
        pdf.drawString(inch, y, f"Date: ____________   Faculty: {session.faculty.get_full_name()}")
        y -= 0.2 * inch
        pdf.drawString(inch, y, f"Group: {session.group.name}")
        y -= 0.4 * inch

        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(inch, y, "Reg No")
        pdf.drawString(inch + 1.5 * inch, y, "Name")
        pdf.drawString(inch + 4 * inch, y, "Present")
        pdf.drawString(inch + 5 * inch, y, "Absent")
        y -= 0.25 * inch
        pdf.setFont("Helvetica", 10)

        for student in students:
            if y < inch:
                pdf.showPage()
                y = height - inch
            pdf.drawString(inch, y, student.reg_no)
            pdf.drawString(inch + 1.5 * inch, y, student.name[:28])
            pdf.rect(inch + 4 * inch, y - 0.05 * inch, 0.3 * inch, 0.3 * inch)
            pdf.rect(inch + 5 * inch, y - 0.05 * inch, 0.3 * inch, 0.3 * inch)
            y -= 0.3 * inch

        pdf.showPage()
        pdf.save()
        return response


class TickSheetDryRunAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        session_id = request.data.get("session_id")
        upload = request.FILES.get("file")
        date_str = request.data.get("date")
        if not session_id or not upload:
            return _json_error("session_id and file are required")

        try:
            session = _get_session(session_id)
            _require_session_access(request.user, session)
        except ValueError as exc:
            return _json_error(str(exc), status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        students = Student.objects.filter(group=session.group).order_by("reg_no")
        inferred = [
            {
                "student_id": student.id,
                "reg_no": student.reg_no,
                "name": student.name,
                "detected_status": "UNKNOWN",
                "confidence": 0.1,
            }
            for student in students
        ]

        job = AttendanceInputJob.objects.create(
            session=session,
            date=date_str or session.starts_at.date(),
            uploaded_by=request.user,
            input_type=AttendanceInputJob.TYPE_SHEET,
            original_filename=upload.name,
            file_fingerprint=compute_file_fingerprint(upload),
            summary={"results": inferred},
        )

        return Response(
            {
                "job_id": job.id,
                "results": inferred,
                "warnings": ["Auto-detection is stubbed. Please review and confirm statuses."],
            },
            status=status.HTTP_200_OK,
        )


class TickSheetCommitAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        job_id = request.data.get("job_id")
        final_records = request.data.get("records", [])
        if not job_id:
            return _json_error("job_id is required")

        try:
            job = AttendanceInputJob.objects.get(
                id=job_id,
                input_type=AttendanceInputJob.TYPE_SHEET,
            )
            _require_session_access(request.user, job.session)
        except AttendanceInputJob.DoesNotExist:
            return _json_error("Job not found", status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return _json_error(str(exc), status.HTTP_403_FORBIDDEN)

        result = bulk_upsert_attendance_for_session(
            session=job.session,
            records=final_records or job.summary.get("results", []),
            default_status=Attendance.STATUS_PRESENT,
            actor=request.user,
            target_date=job.date,
        )
        job.status = AttendanceInputJob.STATUS_COMMITTED
        job.summary["commit_result"] = result
        job.save(update_fields=["status", "summary", "updated_at"])

        return Response({"job_id": job.id, "result": result})


class BiometricPunchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        punches = request.data.get("punches", [])
        if not isinstance(punches, list):
            return _json_error("punches must be a list")

        created = 0
        for punch in punches:
            reg_no = punch.get("reg_no")
            student_id = punch.get("student_id")
            device_id = punch.get("device_id")
            punched_at = punch.get("punched_at")
            raw_identifier = punch.get("raw_identifier", "")

            student = None
            if student_id:
                student = Student.objects.filter(id=student_id).first()
            elif reg_no:
                student = Student.objects.filter(reg_no=reg_no).first()
            if not student:
                continue

            device = None
            if device_id:
                device = BiometricDevice.objects.filter(id=device_id).first()

            BiometricPunch.objects.create(
                student=student,
                device=device,
                punched_at=punched_at or timezone.now(),
                raw_identifier=raw_identifier,
            )
            created += 1

        return Response({"accepted": created, "total": len(punches)})
