"""Syllabus views."""
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdmin
from sims_backend.syllabus.models import SyllabusItem
from sims_backend.syllabus.serializers import SyllabusItemSerializer


class SyllabusItemFilter(filters.FilterSet):
    """Filter for syllabus items."""
    
    program_id = filters.NumberFilter(field_name="program")
    period_id = filters.NumberFilter(field_name="period")
    learning_block_id = filters.NumberFilter(field_name="learning_block")
    module_id = filters.NumberFilter(field_name="module")
    is_active = filters.BooleanFilter(field_name="is_active")
    title = filters.CharFilter(field_name="title", lookup_expr="icontains")
    
    class Meta:
        model = SyllabusItem
        fields = ["program_id", "period_id", "learning_block_id", "module_id", "is_active", "title"]


class SyllabusItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing syllabus items.
    Admin-only access.
    """
    
    queryset = SyllabusItem.objects.all().select_related(
        "program", "period", "learning_block", "module"
    )
    serializer_class = SyllabusItemSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_class = SyllabusItemFilter
    ordering_fields = ["order_no", "title", "created_at", "updated_at"]
    ordering = ["order_no", "title"]
    
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        """
        Bulk reorder syllabus items.
        
        Request body: { "items": [{"id": 1, "order_no": 1}, ...] }
        """
        items = request.data.get("items", [])
        if not isinstance(items, list):
            return Response(
                {"error": "items must be a list"}, status=status.HTTP_400_BAD_REQUEST
            )
        
        updates = []
        for item_data in items:
            item_id = item_data.get("id")
            order_no = item_data.get("order_no")
            
            if not item_id or not order_no:
                return Response(
                    {"error": "Each item must have 'id' and 'order_no'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            if order_no < 1:
                return Response(
                    {"error": "order_no must be >= 1"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            try:
                item = SyllabusItem.objects.get(id=item_id)
                item.order_no = order_no
                updates.append(item)
            except SyllabusItem.DoesNotExist:
                return Response(
                    {"error": f"Syllabus item {item_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        
        # Bulk update
        SyllabusItem.objects.bulk_update(updates, ["order_no"])
        
        return Response({"success": True, "updated": len(updates)})
