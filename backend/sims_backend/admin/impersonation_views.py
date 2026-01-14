"""Impersonation views for admin users."""
import logging

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from sims_backend.admin.impersonation import ImpersonationAccessToken
from sims_backend.audit.models import AuditLog
from sims_backend.common_permissions import IsAdmin, in_group
from core.serializers import UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class ImpersonationThrottle(UserRateThrottle):
    """Rate limit impersonation start requests."""
    rate = '10/hour'  # Allow 10 impersonation starts per hour per user


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def start_impersonation(request):
    """
    Start impersonating a target user.
    
    POST /api/admin/impersonation/start
    Body: { "target_user_id": "<uuid|int>" }
    Returns: {
      "access": "<jwt>",
      "expires_in": <seconds>,
      "target": {"id": "...", "name": "...", "role": "..."}
    }
    """
    # Apply rate limiting
    throttle = ImpersonationThrottle()
    if not throttle.allow_request(request, None):
        return Response(
            {"error": "Rate limit exceeded. Please try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    target_user_id = request.data.get('target_user_id')
    if not target_user_id:
        return Response(
            {"error": "target_user_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        target_user = User.objects.get(pk=target_user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "Target user not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security checks
    admin_user = request.user
    
    # Disallow impersonating inactive users
    if not target_user.is_active:
        return Response(
            {"error": "Cannot impersonate inactive users"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Disallow impersonating other admins (recommended default)
    if target_user.is_superuser or in_group(target_user, "ADMIN"):
        return Response(
            {"error": "Cannot impersonate admin users"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generate impersonation token
    token = ImpersonationAccessToken.for_user(target_user, admin_user)
    access_token = str(token)
    
    # Calculate expires_in (seconds)
    expires_in = int(token.lifetime.total_seconds())
    
    # Get target user info
    target_info = UserSerializer(target_user).data
    
    # Get IP address and user agent for audit
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.META.get("REMOTE_ADDR")
    user_agent = request.META.get("HTTP_USER_AGENT", "")[:512]
    
    # Log impersonation start event
    try:
        AuditLog.objects.create(
            actor=admin_user,
            method="POST",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_SPECIAL,
            entity="User",
            entity_id=str(target_user.id),
            summary=f"Started impersonating user: {target_user.username}",
            metadata={
                "impersonation_event": "IMPERSONATION_START",
                "target_user_id": str(target_user.id),
                "target_username": target_user.username,
                "impersonation_jti": token.get('impersonation_jti', ''),
            },
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=timezone.now(),
        )
    except Exception as e:
        logger.exception(f"Failed to log impersonation start event: {e}")
    
    return Response({
        "access": access_token,
        "expires_in": expires_in,
        "target": target_info,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def stop_impersonation(request):
    """
    Stop impersonation (logs stop event).
    
    POST /api/admin/impersonation/stop
    Body: { "target_user_id": "<uuid|int>" } (optional, for logging)
    Returns: { "success": true }
    """
    target_user_id = request.data.get('target_user_id')
    target_user = None
    
    if target_user_id:
        try:
            target_user = User.objects.get(pk=target_user_id)
        except User.DoesNotExist:
            pass  # Continue without target user info
    
    # Get IP address and user agent for audit
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.META.get("REMOTE_ADDR")
    user_agent = request.META.get("HTTP_USER_AGENT", "")[:512]
    
    # Log impersonation stop event
    try:
        AuditLog.objects.create(
            actor=request.user,
            method="POST",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_SPECIAL,
            entity="User",
            entity_id=str(target_user.id) if target_user else "",
            summary=f"Stopped impersonating user: {target_user.username if target_user else 'unknown'}",
            metadata={
                "impersonation_event": "IMPERSONATION_STOP",
                "target_user_id": str(target_user.id) if target_user else None,
            },
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=timezone.now(),
        )
    except Exception as e:
        logger.exception(f"Failed to log impersonation stop event: {e}")
    
    return Response({"success": True}, status=status.HTTP_200_OK)
