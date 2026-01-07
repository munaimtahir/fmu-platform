"""Services for sending notifications."""
import logging
from typing import Any, Dict, Optional

from django.conf import settings
from django.core.mail import send_mail
from django.template import Context, Template
from django.utils import timezone

from .models import Notification, NotificationTemplate

logger = logging.getLogger(__name__)


def send_notification(
    template_code: Optional[str] = None,
    recipient_id: Optional[int] = None,
    recipient_email: Optional[str] = None,
    recipient_phone: Optional[str] = None,
    channel: str = NotificationTemplate.CHANNEL_EMAIL,
    subject: Optional[str] = None,
    body: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    created_by=None,
) -> Notification:
    """
    Send a notification.

    Args:
        template_code: Template code to use (optional)
        recipient_id: User ID (optional)
        recipient_email: Email address (optional)
        recipient_phone: Phone number (optional)
        channel: Notification channel (email, sms, whatsapp)
        subject: Subject line (required if no template)
        body: Body text (required if no template)
        metadata: Context data for template rendering
        created_by: User who triggered the notification

    Returns:
        Notification instance
    """
    # Get template if provided
    template = None
    if template_code:
        try:
            template = NotificationTemplate.objects.get(code=template_code, is_active=True)
        except NotificationTemplate.DoesNotExist:
            logger.warning(f"Template {template_code} not found or inactive")
            # Continue without template if subject/body provided

    # Render template if available
    if template:
        context = Context(metadata or {})
        subject = Template(template.subject).render(context) if template.subject else subject
        body = Template(template.body).render(context)

    # Create notification record
    notification = Notification.objects.create(
        recipient_id=recipient_id,
        recipient_email=recipient_email,
        recipient_phone=recipient_phone,
        template=template,
        channel=channel,
        subject=subject or "",
        body=body or "",
        status=Notification.STATUS_PENDING,
        metadata=metadata or {},
    )

    # Send based on channel
    try:
        if channel == NotificationTemplate.CHANNEL_EMAIL:
            _send_email(notification)
        elif channel == NotificationTemplate.CHANNEL_SMS:
            _send_sms(notification)
        elif channel == NotificationTemplate.CHANNEL_WHATSAPP:
            _send_whatsapp(notification)
        else:
            logger.warning(f"Unsupported channel: {channel}")
            notification.status = Notification.STATUS_FAILED
            notification.error_message = f"Unsupported channel: {channel}"
            notification.save()
            return notification

        notification.status = Notification.STATUS_SENT
        notification.sent_at = timezone.now()
        notification.save()

    except Exception as e:
        logger.error(f"Failed to send notification {notification.id}: {str(e)}", exc_info=True)
        notification.status = Notification.STATUS_FAILED
        notification.error_message = str(e)
        notification.save()

    return notification


def _send_email(notification: Notification) -> None:
    """Send email notification."""
    recipient = notification.recipient_email
    if not recipient and notification.recipient:
        recipient = notification.recipient.email

    if not recipient:
        raise ValueError("No email address available")

    try:
        send_mail(
            subject=notification.subject,
            message=notification.body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        # Mark as delivered (email is typically delivered immediately)
        notification.status = Notification.STATUS_DELIVERED
        notification.delivered_at = timezone.now()
    except Exception as e:
        # Check if it's a bounce (invalid email)
        if "bounce" in str(e).lower() or "invalid" in str(e).lower():
            notification.status = Notification.STATUS_BOUNCED
        raise


def _send_sms(notification: Notification) -> None:
    """Send SMS notification (placeholder - implement with SMS provider)."""
    recipient = notification.recipient_phone
    if not recipient and notification.recipient:
        # Get phone from user profile
        recipient = getattr(notification.recipient, "phone", None)

    if not recipient:
        raise ValueError("No phone number available")

    # Placeholder - implement with actual SMS provider (Twilio, etc.)
    logger.info(f"SMS placeholder: Sending to {recipient}: {notification.body}")
    # In production, integrate with SMS provider here
    notification.status = Notification.STATUS_DELIVERED
    notification.delivered_at = timezone.now()


def _send_whatsapp(notification: Notification) -> None:
    """Send WhatsApp notification (placeholder - implement with WhatsApp provider)."""
    recipient = notification.recipient_phone
    if not recipient and notification.recipient:
        recipient = getattr(notification.recipient, "phone", None)

    if not recipient:
        raise ValueError("No phone number available")

    # Placeholder - implement with actual WhatsApp provider
    logger.info(f"WhatsApp placeholder: Sending to {recipient}: {notification.body}")
    # In production, integrate with WhatsApp provider here
    notification.status = Notification.STATUS_DELIVERED
    notification.delivered_at = timezone.now()
