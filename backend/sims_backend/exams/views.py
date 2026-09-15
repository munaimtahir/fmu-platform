from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.exams.serializers import ExamComponentSerializer, ExamSerializer


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related("academic_period", "department").prefetch_related("components").all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["exams.exams.view"]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["academic_period", "department", "published"]
    search_fields = ["title", "exam_type"]
    ordering_fields = ["scheduled_at", "title"]
    ordering = ["-scheduled_at", "title"]

    def get_permissions(self):
        action_tasks = {
            "list": "exams.exams.view", "retrieve": "exams.exams.view",
            "create": "exams.exams.create", "update": "exams.exams.update",
            "partial_update": "exams.exams.update", "destroy": "exams.exams.delete",
            "publish": "exams.exams.publish",
        }
        self.required_tasks = [action_tasks.get(self.action, "exams.exams.view")]
        return super().get_permissions()

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        """Publish exam - Admin/Coordinator only"""
        exam = self.get_object()
        exam.published = True
        exam.version += 1
        exam.save()
        return Response(ExamSerializer(exam).data, status=status.HTTP_200_OK)


class ExamComponentViewSet(viewsets.ModelViewSet):
    queryset = ExamComponent.objects.select_related("exam", "department").all()
    serializer_class = ExamComponentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["exams.components.view"]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["exam"]
    search_fields = ["name"]
    ordering_fields = ["sequence", "name"]
    ordering = ["exam", "sequence"]

    def get_permissions(self):
        action_tasks = {
            "list": "exams.components.view", "retrieve": "exams.components.view",
            "create": "exams.components.create", "update": "exams.components.update",
            "partial_update": "exams.components.update", "destroy": "exams.components.delete",
        }
        self.required_tasks = [action_tasks.get(self.action, "exams.components.view")]
        return super().get_permissions()
