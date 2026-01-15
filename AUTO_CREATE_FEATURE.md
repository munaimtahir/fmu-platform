# Auto-Create Feature for CSV Import

## Overview

The CSV import workflow now supports automatically creating missing Programs, Batches, and Groups during import. This feature makes imports more flexible and reduces the need for manual setup before importing student data.

## How It Works

When `auto_create` is enabled:

1. **Programs**: If a program name doesn't exist, it's automatically created with:
   - Name: As specified in CSV
   - Structure type: YEARLY (default)
   - Status: Active

2. **Batches**: If a batch name doesn't exist under a program, it's automatically created with:
   - Name: As specified in CSV
   - Program: The resolved/created program
   - Graduation year: Extracted from batch name (e.g., "2029 Batch" → 2029)
   - Status: Active
   - If year can't be extracted, defaults to current year + 5 for Year 1 students

3. **Groups**: If a group name doesn't exist under a batch, it's automatically created with:
   - Name: As specified in CSV
   - Batch: The resolved/created batch

## Usage

### Via Admin Interface

1. Navigate to: **Admin Dashboard → Bulk CSV Import → Student CSV Import**
2. Check the checkbox: **"Auto-create missing Programs, Batches, and Groups"**
3. Upload your CSV file
4. Click "Preview Import"
5. Review the preview - you'll see messages like:
   - "Program 'MBBS' was automatically created."
   - "Batch '2029 Batch' was automatically created with graduation year 2029."
   - "Group 'Group A' was automatically created."
6. Commit the import if validation passes

### Via API

**Preview Request:**
```json
{
  "file": <file>,
  "mode": "CREATE_ONLY",
  "auto_create": true
}
```

**Commit Request:**
```json
{
  "import_job_id": "uuid",
  "confirm": true,
  "auto_create": true  // Optional, uses value from preview if not specified
}
```

## Batch Name Format

For best results, use batch names that include the graduation year:
- ✅ `"2029 Batch"` → Extracts year 2029
- ✅ `"Fall 2024"` → Extracts year 2024
- ✅ `"Batch 2031"` → Extracts year 2031
- ⚠️ `"Year 1"` → Uses default (current year + 5)

## Important Notes

1. **Graduation Year**: The system extracts the graduation year from batch names. If extraction fails, it defaults to current year + 5 for Year 1 students.

2. **Case Sensitivity**: Program, Batch, and Group names are matched case-insensitively, but created exactly as specified in the CSV.

3. **Validation**: Auto-created entities still go through validation. If creation fails (e.g., duplicate name), the row will be marked as invalid.

4. **Preview vs Commit**: The `auto_create` setting is stored in the ImportJob and used during both preview and commit phases.

5. **Safety**: Auto-creation only happens during the commit phase (not preview), but preview will show what will be created.

## Example

**CSV:**
```csv
reg_no,name,program_name,batch_name,group_name,status
150,John Doe,MBBS,2029 Batch,Group A,active
```

**If MBBS, "2029 Batch", and "Group A" don't exist:**
- Program "MBBS" is created
- Batch "2029 Batch" is created under MBBS with graduation year 2029
- Group "Group A" is created under "2029 Batch"
- Student is imported successfully

## Migration Required

A database migration is required to add the `auto_create` field to the `ImportJob` model:

```bash
python manage.py makemigrations
python manage.py migrate
```

## Benefits

1. **Reduced Setup**: No need to manually create Programs, Batches, and Groups before import
2. **Flexibility**: Import data even if academic structure isn't fully set up
3. **Efficiency**: Faster imports with less manual intervention
4. **User-Friendly**: Makes the import process more accessible

## Limitations

1. **Year Extraction**: Batch names should include the graduation year for accurate year extraction
2. **Default Values**: Auto-created entities use default values (may need manual adjustment later)
3. **No Validation**: Auto-created entities aren't validated against business rules (e.g., program structure)

## Future Enhancements

Potential improvements:
- Configurable default values for auto-created entities
- Better year extraction logic
- Validation rules for auto-created entities
- Bulk creation preview before import
