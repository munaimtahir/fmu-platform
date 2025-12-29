from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from sims_backend.common_permissions import IsAdminOrCoordinator, IsFaculty, IsOfficeAssistant, in_group
from sims_backend.timetable.models import Session
from sims_backend.timetable.serializers import SessionSerializer


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related(
        'academic_period', 'group', 'faculty', 'department'
    ).all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_period', 'group', 'faculty', 'department']
    search_fields = ['department__name', 'group__name']
    ordering_fields = ['starts_at', 'ends_at']
    ordering = ['starts_at']

    def get_permissions(self):
        # OfficeAssistant, Faculty, Admin, Coordinator can CRUD sessions
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Allow OfficeAssistant, Faculty, Admin, Coordinator
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Faculty can see their own sessions
        if in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            queryset = queryset.filter(faculty=user)
        
        return queryset

