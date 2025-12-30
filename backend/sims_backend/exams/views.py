from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdminOrCoordinator
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.exams.serializers import ExamComponentSerializer, ExamSerializer


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related('academic_period', 'department').prefetch_related('components').all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_period', 'department', 'published']
    search_fields = ['title', 'exam_type']
    ordering_fields = ['scheduled_at', 'title']
    ordering = ['-scheduled_at', 'title']

    def get_permissions(self):
        if self.action == 'publish':
            return [IsAuthenticated(), IsAdminOrCoordinator()]  # Only Admin/Coordinator can publish
        # OfficeAssistant, Admin, Coordinator can CRUD
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish exam - Admin/Coordinator only"""
        exam = self.get_object()
        exam.published = True
        exam.version += 1
        exam.save()
        return Response(ExamSerializer(exam).data, status=status.HTTP_200_OK)


class ExamComponentViewSet(viewsets.ModelViewSet):
    queryset = ExamComponent.objects.select_related('exam', 'department').all()
    serializer_class = ExamComponentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam']
    search_fields = ['name']
    ordering_fields = ['sequence', 'name']
    ordering = ['exam', 'sequence']

    def get_permissions(self):
        # OfficeAssistant, Admin, Coordinator can CRUD
        return [IsAuthenticated()]

