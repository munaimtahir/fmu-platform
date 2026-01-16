# Student CSV Bulk Import Guide

## Overview

The Student CSV Bulk Import system allows administrators to import multiple students at once using a CSV file. The system uses a two-phase workflow:

1. **Preview Phase**: Upload CSV and validate without writing to database
2. **Commit Phase**: Commit validated rows to database

## Features

- **Two-phase workflow**: Preview before committing
- **Comprehensive validation**: Row-level error reporting
- **Import modes**: Create-only (default) or Upsert (update existing)
- **Auto-create missing entities**: Automatically create Programs, Batches, and Groups if they don't exist
- **Duplicate detection**: File hash-based duplicate prevention
- **FK resolution**: Automatic resolution of Program, Batch, and Group by name
- **Error reporting**: Downloadable CSV with error messages
- **Audit trail**: ImportJob model tracks all imports
- **Automatic user account creation**: Creates login accounts for all imported students

## CSV Format

### Required Columns

- `reg_no` (string, max 32 chars, unique): Student registration number
- `name` (string, max 255 chars): Full name of the student
- `program_name` (string): Program name (e.g., "MBBS", "BDS")
- `batch_name` (string): Batch name (e.g., "2024 Batch")
- `group_name` (string): Group name (e.g., "Group A")
- `status` (string): Student status - one of: `active`, `inactive`, `graduated`, `suspended`

### Optional Columns

- `email` (string): Student email address
- `phone` (string, max 20 chars): Student phone number
- `date_of_birth` (string, format: YYYY-MM-DD): Date of birth
- `password` (string): Custom password for user account. If not provided or empty, password will be auto-generated as `student{graduation_year}` (e.g., `student2029`)

### Example CSV

```csv
reg_no,name,program_name,batch_name,group_name,status,email,phone,date_of_birth,password
STU001,John Doe,MBBS,2024 Batch,Group A,active,john.doe@example.com,+1234567890,2000-01-15,
STU002,Jane Smith,MBBS,2024 Batch,Group A,active,jane.smith@example.com,+1234567891,2000-02-20,custompass123
```

**Note**: Leave `password` empty to auto-generate (format: `student{graduation_year}`), or provide a custom password.

## API Endpoints

All endpoints require authentication and Admin or Coordinator permissions.

### 1. Download Template

**GET** `/api/admin/students/import/template/`

Downloads a CSV template with headers and example row.

**Response**: CSV file download

### 2. Preview Import

**POST** `/api/admin/students/import/preview/`

Upload CSV file and get validation preview.

**Request** (multipart/form-data):
- `file`: CSV file
- `mode`: `CREATE_ONLY` (default) or `UPSERT`
- `auto_create`: `true` or `false` (default: `false`) - Automatically create missing Programs, Batches, and Groups

**Response**:
```json
{
  "import_job_id": "uuid",
  "total_rows": 10,
  "valid_rows": 8,
  "invalid_rows": 2,
  "duplicate_file_warning": false,
  "preview_rows": [
    {
      "row_number": 2,
      "action": "CREATE",
      "errors": [],
      "data": {...}
    }
  ],
  "summary": {
    "create_count": 8,
    "update_count": 0,
    "skip_count": 2
  }
}
```

### 3. Commit Import

**POST** `/api/admin/students/import/commit/`

Commit validated rows to database.

**Request**:
```json
{
  "import_job_id": "uuid",
  "confirm": true
}
```

**Response**:
```json
{
  "import_job_id": "uuid",
  "status": "COMMITTED",
  "created_count": 8,
  "updated_count": 0,
  "failed_count": 2,
  "has_error_report": true
}
```

### 4. List Import Jobs

**GET** `/api/admin/students/import/jobs/`

List all import jobs for the current user.

**Response**: Array of ImportJob objects

### 5. Get Import Job Details

**GET** `/api/admin/students/import/{id}/detail/`

Get details of a specific import job.

**Response**: ImportJob object

### 6. Download Error Report

**GET** `/api/admin/students/import/{id}/errors.csv/`

Download CSV file with invalid rows and error messages.

**Response**: CSV file download

## Import Modes

### CREATE_ONLY (Default)

- Creates new students only
- Rejects rows where `reg_no` already exists in database
- Use this mode for initial imports

### UPSERT

- Creates new students if `reg_no` doesn't exist
- Updates existing students if `reg_no` already exists
- Use this mode to update existing records

## Auto-Create Missing Entities

When `auto_create=true` is enabled, the import system will automatically create missing Programs, Batches, and Groups if they don't exist in the database.

### How It Works

1. **Program Auto-Creation**: If a program name (e.g., "MBBS") doesn't exist, it will be created with:
   - Name: As specified in CSV
   - Structure Type: YEARLY (default)
   - Status: Active

2. **Batch Auto-Creation**: If a batch name (e.g., "2029 Batch") doesn't exist under the program, it will be created with:
   - Name: As specified in CSV
   - Graduation Year: Extracted from batch name (e.g., "2029 Batch" → 2029)
   - If year cannot be extracted, it uses program duration to calculate:
     - MBBS: 5 years
     - BDS: 5 years
     - BSc: 4 years
     - MSc: 2 years
     - Default: 5 years
   - Status: Active

3. **Group Auto-Creation**: If a group name (e.g., "Group A") doesn't exist under the batch, it will be created with:
   - Name: As specified in CSV
   - Linked to the batch

### Batch Name Formats Supported

The system can extract graduation year from various batch name formats:
- `"2029 Batch"` → 2029
- `"2024 Batch"` → 2024
- `"Batch 2031"` → 2031
- `"Fall 2024"` → 2024
- `"2029"` → 2029
- `"Class of 2029"` → 2029

### When to Use Auto-Create

- **Recommended**: When importing data for new programs, batches, or groups that haven't been set up yet
- **Not Recommended**: When you want strict validation and prefer to manually create entities first

### Notes

- Auto-created entities are marked as active by default
- Auto-creation messages appear in the preview as informational messages (not errors)
- The same `auto_create` setting must be used in both preview and commit phases

## Validation Rules

### Required Fields

All required fields must be present and non-empty:
- `reg_no`, `name`, `program_name`, `batch_name`, `group_name`, `status`

### Field Validation

- **reg_no**: Max 32 characters, must be unique (within file and database)
- **name**: Max 255 characters
- **phone**: Max 20 characters
- **email**: Must be valid email format
- **date_of_birth**: Must be in YYYY-MM-DD format
- **status**: Must be one of: `active`, `inactive`, `graduated`, `suspended`

### Foreign Key Resolution

- **Program**: Resolved by `program_name` (case-insensitive)
- **Batch**: Resolved by `batch_name` within the specified Program (case-insensitive)
- **Group**: Resolved by `group_name` within the specified Batch (case-insensitive)

If any FK cannot be resolved, the row is marked as invalid with a clear error message.

### Duplicate Detection

- Duplicates within the file are detected and marked as errors
- In CREATE_ONLY mode, existing students in database are rejected
- File hash is computed to warn about duplicate file uploads

## Error Handling

### Row-Level Errors

Each invalid row includes:
- `row_number`: Row number in CSV (1-indexed, excluding header)
- `errors`: Array of `{column, message}` objects
- `action`: `SKIP` (for invalid rows)

### Error CSV

After commit, if there are invalid rows, an error CSV is generated with:
- All original columns
- Additional `error_message` column with concatenated error messages

## Best Practices

1. **Always preview first**: Review validation results before committing
2. **Use template**: Download the template to ensure correct format
3. **Check FK values**: Ensure Program, Batch, and Group names exist in the system
4. **Handle duplicates**: Use UPSERT mode if you need to update existing records
5. **Review errors**: Download error CSV to fix and re-import failed rows
6. **Test with small files**: Start with a small CSV to verify the process

## Troubleshooting

### "Unknown program_name"

- Verify the program exists in the system
- Check for typos or case sensitivity (resolution is case-insensitive)
- Ensure the program name matches exactly

### "Batch not found under Program"

- Verify the batch exists and belongs to the specified program
- Check batch name spelling

### "Group not found under Batch"

- Verify the group exists and belongs to the specified batch
- Check group name spelling

### "Student with reg_no already exists"

- Use UPSERT mode if you want to update existing students
- Or change the reg_no if creating a new student

### "Invalid date format"

- Date must be in YYYY-MM-DD format (e.g., 2000-01-15)
- Leading zeros are required for month and day

## Security

- All endpoints require Admin or Coordinator permissions
- File uploads are validated and sanitized
- CSV injection protection is applied to error reports
- File hash prevents accidental duplicate imports

## User Account Creation

When students are imported via CSV, the system automatically creates user accounts for them:

- **Username**: Generated from registration number (sanitized, lowercase)
- **Email**: Uses provided email from CSV, or generates `{username}@sims.edu` if not provided
- **Password**: Generated based on batch start year (format: `student{year}`) or extracted from reg_no
- **Role**: Automatically assigned to "STUDENT" group
- **Linking**: User account is automatically linked to the Student record

**Password Format Examples:**
- Batch year 2024: `student2024`
- Reg_no "2024-MBBS-001": `student2024`
- Reg_no "STU001": `studentstu001`

**Note**: If a user account already exists with the generated username, it will be reused and linked to the student record. The password will not be changed for existing accounts.

## Limitations

- Maximum file size: Configurable (default: reasonable limits)
- Maximum rows: No hard limit, but large files may take time to process
- Transaction: Entire commit runs in a single transaction (all-or-nothing for valid rows)
- User account creation: If user creation fails, the student record is still created but without a linked account (can be created manually later)