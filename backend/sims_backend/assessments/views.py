from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from core.permissions import PermissionTaskRequired, has_permission_task

from .models import Assessment, AssessmentScore
from .serializers import AssessmentScoreSerializer, AssessmentSerializer


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.select_related("section").all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["section", "type"]
    search_fields = ["section__course__code", "type"]
    ordering_fields = ["id", "weight"]
    ordering = ["id"]
    required_tasks = ["assessments.assessments.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["assessments.assessments.view"]
        elif self.action == "create":
            self.required_tasks = ["assessments.assessments.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["assessments.assessments.update"]
        elif self.action == "destroy":
            self.required_tasks = ["assessments.assessments.delete"]
        return super().get_permissions()


class AssessmentScoreViewSet(viewsets.ModelViewSet):
    queryset = AssessmentScore.objects.select_related("assessment", "student").all()
    serializer_class = AssessmentScoreSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["assessment", "student"]
    search_fields = ["assessment__section__course__code", "student__reg_no"]
    ordering_fields = ["id", "score", "max_score"]
    ordering = ["id"]
    required_tasks = ["assessments.scores.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["assessments.scores.view"]
        elif self.action == "create":
            self.required_tasks = ["assessments.scores.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["assessments.scores.update"]
        elif self.action == "destroy":
            self.required_tasks = ["assessments.scores.delete"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view own scores."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "assessments.scores.view"):
            return qs

        # Otherwise, return only own scores
        if hasattr(user, "student"):
            return qs.filter(student=user.student)
        return qs.none()