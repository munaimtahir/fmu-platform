# Documents Module Specification

## Purpose + Boundaries

**Purpose:** Official academic document generation (transcripts, certificates) with async processing and verification.

**Owns:**
- Document types (transcript, certificate, etc.)
- Document generation jobs (async)
- QR/token verification
- Public verification endpoint

**Locked Decision:** Documents are generated asynchronously; verification tokens have expiration; public endpoint for verification without authentication.

## Models

### DocumentType
- `code`: CharField (unique, e.g., 'transcript', 'certificate')
- `name`: CharField
- `description`: TextField
- `template`: TextField (template content or path)
- `is_active`: BooleanField

### Document
- `student`: ForeignKey(Student)
- `type`: ForeignKey(DocumentType)
- `document_number`: CharField (unique, auto-generated)
- `status`: CharField (pending, generating, ready, failed)
- `file`: FileField (generated PDF)
- `verification_token`: CharField (unique, for public verification)
- `qr_code`: ImageField (QR code image)
- `generated_at`: DateTimeField
- `requested_by`: ForeignKey(User)
- `requested_at`: DateTimeField
- `expires_at`: DateTimeField (optional)
- `metadata`: JSONField

### DocumentGenerationJob
- `document`: ForeignKey(Document)
- `status`: CharField (queued, processing, completed, failed)
- `started_at`: DateTimeField
- `completed_at`: DateTimeField
- `error_message`: TextField

## APIs

### `/api/documents/document-types/`
- List/Retrieve with `documents.types.view` permission
- Read-only

### `/api/documents/documents/`
- CRUD with `documents.documents.*` permissions
- Object-level: Students can view own documents
- Filters: `student`, `type`, `status`

### `/api/documents/documents/{id}/generate/`
- POST: Queue async generation job
- Permission: `documents.documents.generate`

### `/api/documents/documents/{id}/download/`
- GET: Download generated document
- Permission: `documents.documents.view` (object-level)

### `/api/documents/documents/{id}/status/`
- GET: Check generation status
- Permission: `documents.documents.view` (object-level)

### `/api/documents/verify/{token}/`
- GET: Public verification endpoint (no auth required)
- Returns: Document info if valid, error if invalid/expired

## Workflows / State Machines

**Document Status:**
- `pending` → `generating` → `ready` or `failed`

**Generation Job Status:**
- `queued` → `processing` → `completed` or `failed`

**Token Verification:**
- Tokens expire after configured time (default 48 hours)
- Public endpoint validates token and returns document info

## Validations + Conflict Handling

- Document number auto-generated (unique)
- Verification token auto-generated (unique)
- Async job handles failures gracefully
- Token expiration enforced

## Frontend Screens

### Admin Screens
- Document type management
- Document generation queue
- Document list/search

### Student Screens
- Request document generation
- View own documents
- Download generated documents
- Check generation status

## Tests Required

1. CRUD tests
2. Async generation tests
3. QR token generation/verification tests
4. Public verification endpoint tests
5. Permission tests (object-level)
6. Token expiration tests
