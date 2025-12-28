from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Student, StudentApplication
from .permissions import IsAdminOrRegistrarOrReadOwnStudent, _in_group
from .serializers import (
    StudentApplicationPublicSerializer,
    StudentApplicationSerializer,
    StudentSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarOrReadOwnStudent]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["program", "status", "batch_year", "current_year"]
    search_fields = ["reg_no", "name", "email", "phone", "program__name"]
    ordering_fields = ["id", "reg_no", "name", "batch_year", "current_year", "status"]
    ordering = ["reg_no"]
    queryset = Student.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _in_group(user, "Student") and not (
            user.is_superuser
            or _in_group(user, "Admin")
            or _in_group(user, "Registrar")
        ):
            return qs.filter(reg_no=getattr(user, "username", ""))
        return qs


class StudentApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student applications"""

    queryset = StudentApplication.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "program", "batch_year"]
    search_fields = ["full_name", "email", "phone"]
    ordering_fields = ["id", "full_name", "created_at", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Use public serializer for create, full serializer for other actions"""
        if self.action == "create" and not self.request.user.is_authenticated:
            return StudentApplicationPublicSerializer
        return StudentApplicationSerializer

    def get_permissions(self):
        """Allow public submission, require auth for admin actions"""
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        qs = super().get_queryset()
        user = self.request.user

        # Public users can only create, not list
        if not user.is_authenticated:
            return StudentApplication.objects.none()

        # Admins and Registrars can see all
        if user.is_superuser or _in_group(user, "Admin") or _in_group(user, "Registrar"):
            return qs

        # Others see nothing
        return StudentApplication.objects.none()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a student application and create a Student record"""
        application = self.get_object()

        if application.status != StudentApplication.STATUS_PENDING:
            return Response(
                {"error": "Only pending applications can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            student = application.approve(request.user)
            serializer = StudentApplicationSerializer(application)
            return Response(
                {
                    "message": "Application approved successfully",
                    "application": serializer.data,
                    "student": StudentSerializer(student).data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a student application"""
        application = self.get_object()

        if application.status != StudentApplication.STATUS_PENDING:
            return Response(
                {"error": "Only pending applications can be rejected"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        try:
            application.reject(request.user, reason)
            serializer = StudentApplicationSerializer(application)
            return Response(
                {
                    "message": "Application rejected",
                    "application": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
