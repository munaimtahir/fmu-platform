"""Views for enrollment module."""
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task

from sims_backend.academics.models import Section, AcademicPeriod
from sims_backend.students.models import Student

from .models import Enrollment, EnrollmentError
from .serializers import EnrollmentSerializer, EnrollmentListSerializer


class EnrollmentFilter(filters.FilterSet):
    """Filter for Enrollment model."""

    student = filters.NumberFilter(field_name="student__id")
    section = filters.NumberFilter(field_name="section__id")
    academic_period = filters.NumberFilter(field_name="academic_period__id")
    status = filters.CharFilter(lookup_expr="iexact")

    class Meta:
        model = Enrollment
        fields = ["student", "section", "academic_period", "status"]


class EnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Enrollment model."""

    queryset = Enrollment.objects.all().select_related(
        "student", "section", "academic_period", "enrolled_by"
    )
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EnrollmentFilter
    search_fields = ["student__reg_no", "student__name", "section__course__code"]
    ordering_fields = ["enrolled_at", "status"]
    ordering = ["-enrolled_at"]
    required_tasks = ["enrollment.view"]

    def get_serializer_class(self):
        if self.action == "list":
            return EnrollmentListSerializer
        return EnrollmentSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["enrollment.view"]
        elif self.action == "create":
            self.required_tasks = ["enrollment.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["enrollment.update"]
        elif self.action == "destroy":
            self.required_tasks = ["enrollment.delete"]
        elif self.action == "drop":
            self.required_tasks = ["enrollment.drop"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: students can view their own enrollments."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "enrollment.view"):
            return qs

        # Otherwise, return only own enrollments
        if hasattr(user, "student"):
            return qs.filter(student=user.student)
        return qs.none()

    def create(self, request, *args, **kwargs):
        """Create enrollment with capacity and term validation."""
        student_id = request.data.get("student")
        section_id = request.data.get("section")
        academic_period_id = request.data.get("academic_period")

        try:
            student = Student.objects.get(id=student_id)
            section = Section.objects.get(id=section_id)
            academic_period = AcademicPeriod.objects.get(id=academic_period_id)
        except (Student.DoesNotExist, Section.DoesNotExist, AcademicPeriod.DoesNotExist) as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            enrollment = Enrollment.enroll_student(
                student=student,
                section=section,
                academic_period=academic_period,
                enrolled_by=request.user
            )
            serializer = self.get_serializer(enrollment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except EnrollmentError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message}},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["post"])
    def drop(self, request, pk=None):
        """Drop an enrollment."""
        enrollment = self.get_object()
        reason = request.data.get("reason", "")

        try:
            enrollment.drop(reason=reason)
            serializer = self.get_serializer(enrollment)
            return Response(serializer.data)
        except EnrollmentError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message}},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["get"], url_path="section/(?P<section_id>[^/.]+)/availability")
    def section_availability(self, request, section_id=None):
        """Check section availability (capacity)."""
        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Section not found"}},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get active enrollments for this section
        active_count = Enrollment.objects.filter(
            section=section,
            status=Enrollment.STATUS_ACTIVE
        ).count()

        return Response({
            "section_id": section.id,
            "capacity": section.capacity,
            "enrolled": active_count,
            "available": section.capacity - active_count,
            "is_available": active_count < section.capacity,
        })
