# Notifications Module Specification

## Purpose + Boundaries

**Purpose:** Central unified messaging service for all modules.

**Owns:**
- Message templates
- Message sending (email, SMS, WhatsApp - future)
- Delivery logs
- Message history

**Explicit Exclusions:**
- No other module sends messages directly - all go through notifications module

**Locked Decision:** Notifications is the single source of truth for all messaging; templates are reusable; delivery logs are immutable.

## Models

### MessageTemplate
- `code`: CharField (unique, e.g., 'enrollment_confirmation', 'fee_reminder')
- `name`: CharField
- `subject`: CharField (for email)
- `body_text`: TextField (plain text)
- `body_html`: TextField (HTML, optional)
- `channel`: CharField (email, sms, whatsapp)
- `variables`: JSONField (list of variable names used in template)
- `is_active`: BooleanField

### Message
- `template`: ForeignKey(MessageTemplate), optional
- `recipient_type`: CharField (user, student, email, phone)
- `recipient_id`: CharField (user ID, student ID, or direct email/phone)
- `subject`: CharField
- `body`: TextField
- `channel`: CharField (email, sms, whatsapp)
- `status`: CharField (pending, sent, failed, bounced)
- `sent_at`: DateTimeField
- `delivered_at`: DateTimeField
- `error_message`: TextField
- `metadata`: JSONField (additional context)
- `created_by`: ForeignKey(User), optional

### MessageDeliveryLog
- `message`: ForeignKey(Message)
- `event_type`: CharField (sent, delivered, opened, clicked, bounced, failed)
- `event_at`: DateTimeField
- `details`: JSONField (provider response, error details)
- `ip_address`: GenericIPAddressField (for opens/clicks)

## APIs

### `/api/notifications/templates/`
- CRUD with `notifications.templates.*` permissions

### `/api/notifications/messages/`
- CRUD with `notifications.messages.*` permissions
- Special: `send/` - Send message immediately
- Filters: `recipient_type`, `recipient_id`, `status`, `channel`

### `/api/notifications/messages/{id}/send/`
- POST: Send message immediately
- Permission: `notifications.messages.send`

### `/api/notifications/delivery-logs/`
- Read-only list with `notifications.logs.view` permission
- Filters: `message`, `event_type`

## Workflows / State Machines

**Message Status:**
- `pending` → `sent` → `delivered` or `failed`/`bounced`

**Delivery Events:**
- `sent`: Message sent to provider
- `delivered`: Confirmed delivery
- `opened`: Email opened (if tracking enabled)
- `clicked`: Link clicked (if tracking enabled)
- `bounced`: Delivery failed (invalid address)
- `failed`: Provider error

## Validations + Conflict Handling

- Template variables must match provided data
- Recipient must be valid (user exists, email valid, etc.)
- Rate limiting for bulk sends

## Frontend Screens

### Admin Screens
- Template management
- Message history
- Delivery logs
- Send test messages

## Tests Required

1. CRUD tests
2. Template rendering tests
3. Message sending tests (mock provider)
4. Delivery log tests
5. Permission tests
