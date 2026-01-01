# Application Draft System

## Overview

The Application Draft System allows students to save their progress on the public student application form and return later to complete it. The system uses email as the sole identifier - no authentication, OTP, or passwords required.

## Architecture

### Database Model

**`ApplicationDraft`** model stores draft application data:

- `id`: UUID primary key
- `email`: EmailField (indexed, normalized to lowercase) - used as identifier
- `status`: CharField with choices: `DRAFT` (editable) or `SUBMITTED` (locked)
- `form_data`: JSONField - stores all text/number form fields
- `uploaded_files`: JSONField - stores file metadata and storage paths
- `created_at`: DateTimeField - when draft was first created
- `last_saved_at`: DateTimeField - auto-updated on each save
- `submitted_at`: DateTimeField - set when draft is submitted (nullable)

### Key Constraints

- **One active DRAFT per email**: When saving a new draft, any existing DRAFT for that email is automatically deleted
- **Email normalization**: All emails are trimmed and converted to lowercase
- **Status-based editing**: Only `DRAFT` status allows edits; `SUBMITTED` drafts are locked

## API Endpoints

All endpoints are public (no authentication required) and have rate limiting (10 requests per minute).

### Save Draft

**POST** `/api/application-drafts/save/`

Saves or updates a draft application.

**Request:**
- `email` (required): Email address
- Form fields: All application form fields (text/number)
- Files: Optional file uploads (father_id_card, guardian_id_card, domicile, ssc_certificate, hssc_certificate, mdcat_result)

**Response:**
```json
{
  "message": "Draft saved successfully",
  "draft": {
    "id": "uuid",
    "email": "student@example.com",
    "status": "DRAFT",
    "form_data": {...},
    "uploaded_files": {...},
    "created_at": "2024-01-01T00:00:00Z",
    "last_saved_at": "2024-01-01T00:00:00Z"
  }
}
```

**Behavior:**
- Overwrites existing DRAFT for the email
- Validates file size (3MB max) and file type (PDF, JPG, PNG)
- Stores files in `application_drafts/{draft_id}/{field_name}/{filename}`

### Load Draft

**POST** `/api/application-drafts/load/`

Loads a draft by email address.

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "message": "Draft loaded",
  "draft": {
    "id": "uuid",
    "email": "student@example.com",
    "status": "DRAFT",
    "form_data": {...},
    "uploaded_files": {...}
  },
  "file_urls": {
    "father_id_card": "/media/application_drafts/.../father_id_card/file.pdf",
    ...
  }
}
```

**Error Responses:**
- `404`: "No saved application found for this email"
- `400`: Invalid email format

### Submit Draft

**POST** `/api/application-drafts/submit/`

Submits a draft as final application. Validates all required fields and documents, creates a `StudentApplication` record, and marks the draft as `SUBMITTED`.

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "message": "Application submitted successfully",
  "application_id": 123,
  "draft_id": "uuid"
}
```

**Validation:**
- Checks all required fields are present
- Validates all required documents are uploaded
- Validates guardian_id_card if guardian is not father
- Creates `StudentApplication` record with all data and files
- Marks draft as `SUBMITTED` (locked)

**Error Responses:**
- `404`: "No draft found for this email"
- `400`: Missing fields or documents (includes list of missing items)
- `400`: "This draft has already been submitted"

## Frontend Integration

### Save Draft

Users can click "Save Draft" at any time. The form data and uploaded files are saved to the backend.

**Requirements:**
- Email field must be filled
- All other fields are optional (partial saves allowed)

### Load Draft

Users click "Load Draft" and enter their email address. The form is populated with saved data.

**Behavior:**
- Shows modal to enter email
- Loads draft data and populates form fields
- Displays file URLs for previously uploaded documents
- Shows error if no draft found

### Submit Final

Users click "Submit Final" when ready to submit. The system:

1. First attempts to submit the draft (if one exists for the email)
2. If no draft exists, creates a new application directly
3. Validates all required fields and documents
4. Creates `StudentApplication` record
5. Shows success message

## File Handling

### Storage

- Draft files: `application_drafts/{draft_id}/{field_name}/{filename}`
- Application files: `student_applications/documents/{year}/{month}/{day}/{filename}`

### File Operations

- **Save**: Files are uploaded and stored in draft storage
- **Load**: File URLs are returned for display (files remain in draft storage)
- **Submit**: Files are copied from draft storage to application storage

### File Validation

- Max size: 3MB per file
- Allowed types: PDF, JPG, JPEG, PNG
- Validated on upload

## Rate Limiting

All draft endpoints have rate limiting:
- **Limit**: 10 requests per minute per IP address
- **Implementation**: `ApplicationDraftThrottle` using Django REST Framework's `AnonRateThrottle`

## Status Lifecycle

```
DRAFT → (save/load allowed) → SUBMITTED (locked)
```

- **DRAFT**: Can be saved, loaded, and edited
- **SUBMITTED**: Locked, cannot be modified. Application record created.

## Security Considerations

### Current Implementation

- No authentication required (public endpoints)
- Email is the sole identifier
- Rate limiting prevents abuse
- One draft per email (prevents duplicate drafts)

### Future Enhancements

The system is designed to allow future upgrades:
- OTP verification can be added without breaking existing drafts
- Magic link authentication can be integrated
- Email verification can be added as an optional step

## Data Flow

### Save Flow

1. User fills form (partially or completely)
2. User clicks "Save Draft"
3. Frontend sends form data + files to `/api/application-drafts/save/`
4. Backend:
   - Normalizes email (trim + lowercase)
   - Deletes existing DRAFT for that email (if any)
   - Validates and stores files
   - Saves form_data and uploaded_files to new/updated draft
5. Returns success message

### Load Flow

1. User clicks "Load Draft"
2. User enters email in modal
3. Frontend sends email to `/api/application-drafts/load/`
4. Backend:
   - Normalizes email
   - Finds DRAFT for that email
   - Returns form_data and file_urls
5. Frontend populates form with data

### Submit Flow

1. User completes form and clicks "Submit Final"
2. Frontend attempts to submit draft via `/api/application-drafts/submit/`
3. Backend:
   - Validates all required fields
   - Validates all required documents
   - Creates `StudentApplication` record
   - Copies files from draft storage to application storage
   - Marks draft as `SUBMITTED`
4. Returns success with application_id

## Migration

To apply the database changes:

```bash
python manage.py migrate admissions
```

This creates the `ApplicationDraft` table with all necessary indexes.

## Notes

- Drafts are separate from `StudentApplication` records
- Drafts are not automatically converted to applications until explicitly submitted
- Submitted drafts remain in the database for audit purposes
- Old drafts can be cleaned up periodically (not implemented in this version)
