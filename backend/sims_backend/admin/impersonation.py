"""Impersonation token and utilities."""
import secrets
import string
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class ImpersonationAccessToken(AccessToken):
    """Custom access token for impersonation with short TTL."""

    token_type = "access"
    lifetime = timedelta(
        minutes=int(getattr(settings, 'IMPERSONATION_TOKEN_LIFETIME_MINUTES', 10))
    )

    @classmethod
    def for_user(cls, user, impersonated_by_user):
        """Create an impersonation token for target user."""
        # Use parent method to set user_id and standard claims
        token = cls.for_user(user)
        token['impersonated'] = True
        token['impersonated_by'] = impersonated_by_user.pk
        # Generate unique JTI for this impersonation session
        alphabet = string.ascii_letters + string.digits
        token['impersonation_jti'] = ''.join(
            secrets.choice(alphabet) for _ in range(32)
        )
        return token
