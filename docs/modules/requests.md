# Requests Module Specification

## Purpose + Boundaries

**Purpose:** Universal change-request and approval workflow. Any post-lock or sensitive change must flow through Requests.

**Owns:**
- Request types
- Request state machine (pending → under_review → approved/rejected → completed)
- Approvals, attachments, remarks
- Request history/audit trail

**Locked Decision:** Any post-lock or sensitive change must flow through Requests; no exceptions.

## Models

### RequestType
- `code`: CharField, unique
- `name`: CharField
- `description`: TextField
- `target_module`: CharField
- `requires_attachment`: BooleanField
- `is_active`: BooleanField

### Request
- `type`: ForeignKey(RequestType)
- `requester`: ForeignKey(User)
- `student`: ForeignKey(Student), optional
- `status`: CharField (pending, under_review, approved, rejected, completed)
- `title`: CharField
- `description`: TextField
- `data`: JSONField (request-specific data)
- `assigned_to`: ForeignKey(User), optional
- `priority`: CharField (low, medium, high, urgent)
- `submitted_at`: DateTimeField
- `resolved_at`: DateTimeField, optional
- `resolution_notes`: TextField

### RequestAttachment
- `request`: ForeignKey(Request)
- `file`: FileField
- `name`: CharField
- `uploaded_by`: ForeignKey(User)

### RequestRemark
- `request`: ForeignKey(Request)
- `author`: ForeignKey(User)
- `content`: TextField
- `is_internal`: BooleanField (not visible to requester)

### RequestHistory
- `request`: ForeignKey(Request)
- `action`: CharField (created, assigned, status_changed, remarked, attachment_added)
- `actor`: ForeignKey(User)
- `old_value`: JSONField
- `new_value`: JSONField
- `summary`: TextField

## APIs

### `/api/requests/requests/`
- CRUD with task-based permissions
- Special actions: assign, approve, reject, complete, history
- Object-level: Users can view own requests

### `/api/requests/request-types/`
- Read-only list of active request types

### `/api/requests/attachments/`
- CRUD for request attachments

### `/api/requests/remarks/`
- CRUD for request remarks
- Internal remarks filtered for non-admin users

## Workflows / State Machines

**State Transitions:**
- `pending` → `under_review` (on assignment)
- `pending` or `under_review` → `approved` (via approve action)
- `pending` or `under_review` → `rejected` (via reject action)
- `approved` → `completed` (via complete action)

## Validations + Conflict Handling

- Only pending/under_review requests can be approved/rejected
- Only approved requests can be completed
- All state changes logged in RequestHistory

## Tests Required

1. CRUD tests
2. State machine transition tests
3. Permission tests
4. History tracking tests
