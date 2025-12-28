from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.academics.models import Section
from sims_backend.admissions.models import Student
from sims_backend.common_permissions import IsAdminOrRegistrarReadOnlyFacultyStudent

from .models import Enrollment
from .serializers import EnrollmentSerializer


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarReadOnlyFacultyStudent]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["student__reg_no", "section__course__code", "status"]
    ordering_fields = ["id", "status", "enrolled_at"]
    ordering = ["id"]


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrRegistrarReadOnlyFacultyStudent])
def enroll_in_section(request, section_id):
    """Enroll a student in a specific section"""
    student_id = request.data.get("student_id")

    if not student_id:
        return Response(
            {"error": {"code": 400, "message": "student_id is required"}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        section = Section.objects.get(id=section_id)
    except Section.DoesNotExist:
        return Response(
            {"error": {"code": 404, "message": "Section not found"}},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response(
            {"error": {"code": 404, "message": "Student not found"}},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check for duplicate enrollment
    if Enrollment.objects.filter(student=student, section=section).exists():
        return Response(
            {
                "error": {
                    "code": 409,
                    "message": "Student is already enrolled in this section",
                }
            },
            status=status.HTTP_409_CONFLICT,
        )

    # Create enrollment using serializer (includes validation)
    serializer = EnrollmentSerializer(
        data={"student": student.id, "section": section.id, "term": section.term}
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data, status=status.HTTP_201_CREATED)
