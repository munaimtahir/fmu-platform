from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from sims_backend.common_permissions import IsAdminOrRegistrarReadOnlyFacultyStudent

from .models import Assessment, AssessmentScore
from .serializers import AssessmentScoreSerializer, AssessmentSerializer


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarReadOnlyFacultyStudent]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["section__course__code", "type"]
    ordering_fields = ["id", "weight"]
    ordering = ["id"]


class AssessmentScoreViewSet(viewsets.ModelViewSet):
    queryset = AssessmentScore.objects.all()
    serializer_class = AssessmentScoreSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarReadOnlyFacultyStudent]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["assessment__section__course__code", "student__reg_no"]
    ordering_fields = ["id", "score", "max_score"]
    ordering = ["id"]
