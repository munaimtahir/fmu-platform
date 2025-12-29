from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdmin, IsAdminOrCoordinator, IsStudent, in_group
from sims_backend.students.models import Student
from sims_backend.students.serializers import StudentSerializer, StudentPlacementSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('program', 'batch', 'group').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program', 'batch', 'group', 'status']
    search_fields = ['reg_no', 'name', 'email', 'phone']
    ordering_fields = ['reg_no', 'name', 'created_at']
    ordering = ['reg_no']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        if self.action == 'placement':
            return [IsAuthenticated(), IsAdmin()]  # Only Admin can edit placement
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see their own record
        if in_group(user, 'STUDENT'):
            # Assuming student reg_no matches username or there's a user-student link
            # For MVP, we'll need a way to link User to Student
            # For now, return all for students (to be refined)
            pass
        return queryset

    @action(detail=True, methods=['patch'], url_path='placement')
    def placement(self, request, pk=None):
        """Update student placement (Program/Batch/Group) - Admin only"""
        student = self.get_object()
        serializer = StudentPlacementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student.program = serializer.validated_data['program']
        student.batch = serializer.validated_data['batch']
        student.group = serializer.validated_data['group']
        student.save()
        
        return Response(StudentSerializer(student).data, status=status.HTTP_200_OK)

