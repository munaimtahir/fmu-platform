"""App settings views."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdmin
from sims_backend.settings_app.models import AppSetting
from sims_backend.settings_app.serializers import AppSettingSerializer


class AppSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing app settings.
    Admin-only access.
    """
    
    queryset = AppSetting.objects.all().select_related("updated_by")
    serializer_class = AppSettingSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = "key"
    ordering = ["key"]
    
    def get_queryset(self):
        """Return all settings, grouped by category."""
        return super().get_queryset()
    
    def create(self, request, *args, **kwargs):
        """Create a new setting."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set updated_by
        setting = serializer.save(updated_by=request.user)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Update a setting."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Set updated_by
        setting = serializer.save(updated_by=request.user)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"])
    def allowed_keys(self, request):
        """Get list of allowed setting keys with their metadata."""
        keys_info = []
        for key, config in AppSetting.ALLOWED_KEYS.items():
            # Check if setting exists
            try:
                setting = AppSetting.objects.get(key=key)
                current_value = setting.value_json
            except AppSetting.DoesNotExist:
                current_value = None
            
            keys_info.append({
                "key": key,
                "type": config["type"],
                "description": config["description"],
                "current_value": current_value,
            })
        
        return Response(keys_info)
