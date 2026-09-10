"""Mobile Student Read API Freeze 01.

A single, stable, read-only, student-scoped endpoint that gives the Android
client everything needed for a student's academic home screen without
exposing large administrative serializers or requiring multiple
administrative calls per screen load.
"""

from datetime import date

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sims_backend.attendance.models import Attendance
from sims_backend.mobile.serializers import MobileStudentHomeSerializer, MobileStudentTimetableSerializer
from sims_backend.mobile.timetable_resolution import get_student_today_schedule, get_student_week_schedule
from sims_backend.results.models import ResultHeader

LATEST_RESULTS_LIMIT = 5


def _not_a_student_response():
    return Response(
        {"error": {"code": "NOT_A_STUDENT", "message": "No student record linked to your account"}},
        status=404,
    )


class StudentHomeView(APIView):
    """GET /api/mobile/student/home/

    Student-scoped, read-only academic home aggregate. Returns 404 if the
    authenticated user has no linked student record (staff/faculty/admin
    accounts are not students and have no home screen).
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=MobileStudentHomeSerializer)
    def get(self, request):
        student = getattr(request.user, "student", None)
        if student is None:
            return _not_a_student_response()

        display_name = student.name or (student.person.full_name if student.person else student.reg_no)

        attendance_qs = Attendance.objects.filter(student=student)
        total = attendance_qs.count()
        present = attendance_qs.filter(status=Attendance.STATUS_PRESENT).count()
        absent = attendance_qs.filter(status=Attendance.STATUS_ABSENT).count()
        late = attendance_qs.filter(status=Attendance.STATUS_LATE).count()
        leave = attendance_qs.filter(status=Attendance.STATUS_LEAVE).count()
        percentage = round((present / total * 100), 2) if total > 0 else 0.0

        latest_results = (
            ResultHeader.objects.filter(
                student=student,
                status__in=[ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN],
            )
            .select_related("exam")
            .order_by("-created_at")[:LATEST_RESULTS_LIMIT]
        )

        payload = {
            "student": {
                "id": student.id,
                "reg_no": student.reg_no,
                "display_name": display_name,
            },
            "academic_placement": {
                "programme": student.program.name if student.program else None,
                "batch": student.batch.name if student.batch else None,
                "group": student.group.name if student.group else None,
                "status": student.status,
            },
            "attendance_summary": {
                "total": total,
                "present": present,
                "absent": absent,
                "late": late,
                "leave": leave,
                "percentage": percentage,
            },
            "latest_results": [
                {
                    "exam_id": r.exam_id,
                    "exam_title": r.exam.title if r.exam else "",
                    "status": r.status,
                    "final_outcome": r.final_outcome,
                    "total_obtained": str(r.total_obtained) if r.total_obtained is not None else None,
                }
                for r in latest_results
            ],
            "today_schedule": get_student_today_schedule(student),
        }
        return Response(payload, status=200)


class StudentTimetableView(APIView):
    """GET /api/mobile/student/timetable/

    Student-scoped, read-only weekly schedule. Accepts an optional
    `week_start_date` (YYYY-MM-DD, any date within the target week) query
    param; defaults to the current week. Returns 404 if the authenticated
    user has no linked student record.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=MobileStudentTimetableSerializer)
    def get(self, request):
        student = getattr(request.user, "student", None)
        if student is None:
            return _not_a_student_response()

        week_start_date = None
        raw_date = request.query_params.get("week_start_date")
        if raw_date:
            try:
                week_start_date = date.fromisoformat(raw_date)
            except ValueError:
                return Response(
                    {
                        "error": {
                            "code": "INVALID_DATE",
                            "message": "week_start_date must be in YYYY-MM-DD format",
                        }
                    },
                    status=400,
                )

        payload = get_student_week_schedule(student, week_start_date=week_start_date)
        return Response(payload, status=200)
