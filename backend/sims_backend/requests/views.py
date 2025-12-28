from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdminOrRegistrarReadOnlyFacultyStudent

from .models import Request
from .serializers import RequestSerializer


class RequestViewSet(viewsets.ModelViewSet):
    queryset = Request.objects.all()
    serializer_class = RequestSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarReadOnlyFacultyStudent]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["student__reg_no", "type", "status"]
    ordering_fields = ["id", "created_at", "updated_at"]

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        """Transition request status"""
        instance = self.get_object()
        new_status = request.data.get("status")
        processed_by = request.data.get("processed_by", "")

        if not new_status:
            return Response(
                {"error": {"code": 400, "message": "Status is required"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status not in ["approved", "rejected", "completed"]:
            return Response(
                {
                    "error": {
                        "code": 400,
                        "message": "Invalid status. Must be approved, rejected, or completed",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.status = new_status
        instance.processed_by = processed_by
        instance.updated_at = timezone.now()
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)
