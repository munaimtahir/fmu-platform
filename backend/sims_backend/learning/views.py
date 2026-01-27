from __future__ import annotations

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sims_backend.academics.models import AcademicPeriod, Section
from sims_backend.common_permissions import in_group
from sims_backend.learning.models import LearningMaterial, LearningMaterialAudience
from sims_backend.learning.permissions import (
    IsAdminOrFaculty,
    IsStudentOnly,
    LearningMaterialObjectPermission,
)
from sims_backend.learning.serializers import (
    LearningMaterialAudienceSerializer,
    LearningMaterialSerializer,
)
from sims_backend.students.models import Student


class LearningMaterialViewSet(viewsets.ModelViewSet):
    queryset = LearningMaterial.objects.select_related("created_by").prefetch_related("audiences")
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFaculty, LearningMaterialObjectPermission]
    filterset_fields = ["status", "kind", "created_by"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "published_at"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        material = self.get_object()
        if not self._can_edit(material):
            return Response(
                {"detail": "You can only update your own draft materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        material = self.get_object()
        if not self._can_edit(material):
            return Response(
                {"detail": "You can only update your own draft materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def _can_edit(self, material: LearningMaterial) -> bool:
        user = self.request.user
        if user.is_superuser or in_group(user, "ADMIN"):
            return True
        return material.created_by_id == user.id and material.status == LearningMaterial.STATUS_DRAFT

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        material = self.get_object()
        user = request.user
        if not (user.is_superuser or in_group(user, "ADMIN")) and material.created_by_id != user.id:
            return Response(
                {"detail": "You can only publish your own materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if material.status == LearningMaterial.STATUS_PUBLISHED:
            return Response(
                {"detail": "Material is already published."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        material.publish()
        serializer = self.get_serializer(material)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        material = self.get_object()
        user = request.user
        if not (user.is_superuser or in_group(user, "ADMIN")) and material.created_by_id != user.id:
            return Response(
                {"detail": "You can only archive your own materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if material.status == LearningMaterial.STATUS_ARCHIVED:
            return Response(
                {"detail": "Material is already archived."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        material.archive()
        serializer = self.get_serializer(material)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get", "post"], url_path="audiences")
    def audiences(self, request, pk=None):
        material = self.get_object()
        if request.method == "GET":
            serializer = LearningMaterialAudienceSerializer(material.audiences.all(), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        payload = request.data
        items = payload if isinstance(payload, list) else [payload]
        created = []
        with transaction.atomic():
            for item in items:
                item_data = dict(item)
                item_data["material"] = material.id
                serializer = LearningMaterialAudienceSerializer(data=item_data)
                serializer.is_valid(raise_exception=True)
                self._validate_audience_permissions(serializer.validated_data)
                created.append(serializer.save())
        output = LearningMaterialAudienceSerializer(created, many=True)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def _validate_audience_permissions(self, data: dict) -> None:
        user = self.request.user
        if user.is_superuser or in_group(user, "ADMIN"):
            return
        if in_group(user, "FACULTY"):
            section = data.get("section")
            if not section:
                raise PermissionError("Faculty audiences must target a section.")
            if section.faculty_id != user.id:
                raise PermissionError("Faculty can only target sections they teach.")
            return
        raise PermissionError("You do not have permission to manage audiences.")

    def handle_exception(self, exc):
        if isinstance(exc, PermissionError):
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return super().handle_exception(exc)


class LearningMaterialAudienceViewSet(viewsets.ModelViewSet):
    queryset = LearningMaterialAudience.objects.select_related(
        "material",
        "program",
        "batch",
        "term",
        "course",
        "section",
    )
    serializer_class = LearningMaterialAudienceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFaculty]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self._validate_audience_permissions(serializer.validated_data)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def _validate_audience_permissions(self, data: dict) -> None:
        user = self.request.user
        if user.is_superuser or in_group(user, "ADMIN"):
            return
        if in_group(user, "FACULTY"):
            section = data.get("section")
            if not section:
                raise PermissionError("Faculty audiences must target a section.")
            if section.faculty_id != user.id:
                raise PermissionError("Faculty can only target sections they teach.")
            return
        raise PermissionError("You do not have permission to manage audiences.")

    def handle_exception(self, exc):
        if isinstance(exc, PermissionError):
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return super().handle_exception(exc)


class LearningStudentFeedAPIView(APIView):
    permission_classes = [IsAuthenticated, IsStudentOnly]

    def get(self, request):
        student = Student.objects.select_related("program", "batch", "group").filter(user=request.user).first()
        if not student:
            return Response({"detail": "Student record not found."}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        sections = Section.objects.filter(
            group=student.group,
            academic_period__status=AcademicPeriod.STATUS_OPEN,
        ).select_related("course", "academic_period")
        enrolled_sections = list(sections)
        section_ids = [section.id for section in enrolled_sections]
        course_term_pairs = {
            (section.course_id, section.academic_period_id) for section in enrolled_sections if section.course_id
        }
        term_ids = {section.academic_period_id for section in enrolled_sections if section.academic_period_id}

        audience_filter = Q()
        if section_ids:
            audience_filter |= Q(audiences__section_id__in=section_ids)
        for course_id, term_id in course_term_pairs:
            audience_filter |= Q(audiences__course_id=course_id, audiences__term_id=term_id)
        if term_ids:
            audience_filter |= Q(audiences__term_id__in=term_ids)
        if student.batch_id:
            audience_filter |= Q(audiences__batch_id=student.batch_id)
        if student.program_id:
            audience_filter |= Q(audiences__program_id=student.program_id)

        queryset = (
            LearningMaterial.objects.filter(status=LearningMaterial.STATUS_PUBLISHED)
            .filter(Q(available_from__isnull=True) | Q(available_from__lte=now))
            .filter(Q(available_until__isnull=True) | Q(available_until__gte=now))
        )

        if audience_filter:
            queryset = queryset.filter(audience_filter)
        else:
            queryset = queryset.none()

        queryset = queryset.select_related("created_by").prefetch_related("audiences").distinct()
        queryset = queryset.order_by("-published_at", "-created_at")
        serializer = LearningMaterialSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
