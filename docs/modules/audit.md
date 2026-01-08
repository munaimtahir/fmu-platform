# Audit Module Specification

## Purpose + Boundaries

**Purpose:** Immutable accountability layer. Every write action across the system must generate an audit event.

**Owns:**
- AuditEvent model (immutable)
- Middleware capturing writes
- Filters, exports
- Admin viewer

**Must NOT own:**
- Business logic (belongs to domain modules)
- Permission checking (belongs to core)

## Models

### AuditEvent
- `id`: UUIDField, primary key
- `timestamp`: DateTimeField, auto_now_add, indexed
- `actor`: ForeignKey(User), nullable (for system actions)
- `entity`: CharField (model name)
- `entity_id`: CharField (object ID)
- `action`: CharField (create, update, delete, state_transition, special_action)
- `summary`: TextField (human-readable summary)
- `metadata`: JSONField (request data, old/new values, etc.)
- `ip_address`: GenericIPAddressField, optional
- `user_agent`: CharField, optional

## APIs

### `/api/audit/events/`
- **GET /api/audit/events/**: List audit events
  - Permission: `audit.events.view`
  - Filters: `actor`, `entity`, `action`, `timestamp__gte`, `timestamp__lte`
  - Response: `[{id, timestamp, actor: {...}, entity, entity_id, action, summary, metadata}]`

- **GET /api/audit/events/{id}/**: Get audit event details
  - Permission: `audit.events.view`
  - Response: Full audit event details

- **GET /api/audit/events/export/**: Export audit events (CSV)
  - Permission: `audit.events.export`
  - Query params: filters as above
  - Response: CSV file download

## Workflows / State Machines

N/A (Audit events are immutable)

## Validations + Conflict Handling

- Audit events cannot be modified or deleted
- Timestamp is server-side only
- Actor must be authenticated (except system actions)

## Frontend Screens

### Admin Screens
- **Audit Log Viewer**: `/admin/audit`
  - Filterable table of audit events
  - Export to CSV
  - View event details (metadata)

## Tests Required

1. **Middleware Tests**
   - Verify audit events created on POST/PUT/PATCH/DELETE
   - Verify actor captured correctly
   - Verify metadata captured

2. **API Tests**
   - List/filter audit events
   - Export functionality
   - Permission enforcement

3. **Validation Tests**
   - Cannot modify/delete audit events
   - Immutability enforced
