# Excel to Student Import Plan - Year 1 Data

## Overview

This document outlines the plan to import student data from the Excel file "Year 1 formatted data.xlsx" into the FMU Platform system, preparing students for CV upload functionality.

## Current System Capabilities

### Existing Student Import System
- **Format**: CSV-based import
- **Workflow**: Two-phase (Preview → Commit)
- **Required Fields**: `reg_no`, `name`, `program_name`, `batch_name`, `group_name`, `status`
- **Optional Fields**: `email`, `phone`, `date_of_birth`
- **Auto-features**: User account creation, email generation, password assignment

### CV Upload Status
- **Current State**: No dedicated CV upload feature found in codebase
- **Related Features**: Document upload exists for intake/application forms
- **Action Required**: May need to add CV upload functionality after import

## Step-by-Step Import Plan

### Phase 1: Excel File Analysis

#### 1.1 Review Excel File Structure
**Action**: Open and examine the Excel file to identify:
- Column names and their meanings
- Data types (text, dates, numbers)
- Number of rows
- Data quality issues (missing values, duplicates, formatting)
- Special characters or encoding issues

**Tools Needed**:
- Excel/LibreOffice Calc
- Python script with `pandas` and `openpyxl` libraries

#### 1.2 Create Column Mapping Document
**Action**: Map Excel columns to required CSV format:

| Excel Column | CSV Column | Required? | Notes |
|-------------|------------|-----------|-------|
| [To be filled] | `reg_no` | ✅ Yes | Student registration number (max 32 chars, unique) |
| [To be filled] | `name` | ✅ Yes | Full name (max 255 chars) |
| [To be filled] | `program_name` | ✅ Yes | Program name (e.g., "MBBS", "BDS") |
| [To be filled] | `batch_name` | ✅ Yes | Batch name (e.g., "2024 Batch") |
| [To be filled] | `group_name` | ✅ Yes | Group name (e.g., "Group A") |
| [To be filled] | `status` | ✅ Yes | Must be: `active`, `inactive`, `graduated`, `suspended` |
| [To be filled] | `email` | ⚪ Optional | Email address |
| [To be filled] | `phone` | ⚪ Optional | Phone number (max 20 chars) |
| [To be filled] | `date_of_birth` | ⚪ Optional | Format: YYYY-MM-DD |

**Common Excel Column Names to Look For**:
- Registration Number / Reg No / Student ID / Roll No → `reg_no`
- Name / Full Name / Student Name → `name`
- Program / Course / Degree → `program_name`
- Batch / Year / Graduation Year → `batch_name`
- Group / Section / Class → `group_name`
- Status / Student Status → `status`
- Email / Email Address → `email`
- Phone / Mobile / Contact → `phone`
- DOB / Date of Birth / Birth Date → `date_of_birth`

### Phase 2: Data Preparation

#### 2.1 Create Excel to CSV Conversion Script
**Action**: Develop a Python script to:
1. Read the Excel file
2. Map columns according to the mapping document
3. Clean and normalize data:
   - Trim whitespace
   - Standardize date formats (convert to YYYY-MM-DD)
   - Normalize status values
   - Handle missing values
   - Validate data types
4. Generate CSV file matching the import template

**Script Location**: `/home/munaim/srv/apps/fmu-platform/scripts/excel_to_csv_converter.py`

**Dependencies**:
```python
import pandas as pd
import sys
from datetime import datetime
```

#### 2.2 Data Validation Checklist
Before conversion, validate:
- [ ] All required columns exist in Excel
- [ ] `reg_no` values are unique
- [ ] `reg_no` values are ≤ 32 characters
- [ ] `name` values are ≤ 255 characters
- [ ] `status` values match allowed choices
- [ ] Date formats can be converted to YYYY-MM-DD
- [ ] Program, Batch, and Group names exist in the system (or will be created)
- [ ] Phone numbers are ≤ 20 characters
- [ ] Email addresses are valid format (if provided)

#### 2.3 Handle Missing Data
**Strategies**:
- **Required fields**: Must be filled or row will be rejected
- **Optional fields**: Can be left empty
- **Program/Batch/Group**: Verify they exist in system first
- **Status**: Default to "active" if missing (with user confirmation)

### Phase 3: System Preparation

#### 3.1 Verify Academic Structure
**Action**: Ensure the following exist in the system before import:
- **Programs**: Verify program names match Excel data
- **Batches**: Verify batch names exist for each program
- **Groups**: Verify group names exist for each batch

**Commands to Check**:
```bash
# Access Django shell
cd /home/munaim/srv/apps/fmu-platform/backend
python manage.py shell

# Check programs
from sims_backend.academics.models import Program
Program.objects.all().values_list('name', flat=True)

# Check batches
from sims_backend.academics.models import Batch
Batch.objects.all().values_list('name', 'program__name')

# Check groups
from sims_backend.academics.models import Group
Group.objects.all().values_list('name', 'batch__name', 'batch__program__name')
```

#### 3.2 Create Missing Academic Entities (if needed)
If programs, batches, or groups don't exist:
- Create them via Django admin or management commands
- Or add them to the Excel conversion script to create them automatically

### Phase 4: CSV Generation and Validation

#### 4.1 Generate CSV File
**Action**: Run the conversion script:
```bash
cd /home/munaim/srv/apps/fmu-platform
python scripts/excel_to_csv_converter.py \
  --input "/path/to/Year 1 formatted data.xlsx" \
  --output "Year1_students_import.csv" \
  --mapping-config "scripts/column_mapping.json"
```

#### 4.2 Manual Review of Generated CSV
**Action**: Open the CSV file and verify:
- Headers match expected format
- Data looks correct
- No obvious errors
- Sample rows are valid

#### 4.3 Test Import with Small Sample
**Action**: 
1. Create a test CSV with first 5-10 rows
2. Use the import preview feature
3. Review validation results
4. Fix any issues before full import

### Phase 5: Import Execution

#### 5.1 Preview Import
**Action**: Use the admin interface:
1. Navigate to: Admin Dashboard → Bulk CSV Import → Student CSV Import
2. Upload the generated CSV file
3. Select import mode:
   - **CREATE_ONLY**: For new students (default)
   - **UPSERT**: To update existing students
4. Review preview results:
   - Total rows
   - Valid rows
   - Invalid rows
   - Error messages

#### 5.2 Fix Validation Errors
**Action**: If errors are found:
1. Download error report CSV
2. Fix issues in source Excel or mapping
3. Regenerate CSV
4. Re-preview until all rows are valid

#### 5.3 Commit Import
**Action**: Once preview shows all valid rows:
1. Click "Commit Import"
2. Wait for completion
3. Review success message:
   - Created count
   - Updated count
   - Failed count

### Phase 6: Post-Import Verification

#### 6.1 Verify Imported Students
**Action**: Check imported students:
```bash
python manage.py shell

from sims_backend.students.models import Student
# Count imported students
Student.objects.filter(batch__name__icontains="2024").count()

# Sample check
Student.objects.filter(batch__name__icontains="2024").values('reg_no', 'name', 'status')[:10]
```

#### 6.2 Verify User Accounts
**Action**: Check that user accounts were created:
```bash
from django.contrib.auth import get_user_model
User = get_user_model()
# Check students with user accounts
Student.objects.filter(user__isnull=False).count()
```

#### 6.3 Test Student Login
**Action**: Test a few student accounts:
- Username format: `firstname.b{year}` (e.g., `john.b31`)
- Password format: `student{year}` (e.g., `student2024`)
- Or check password generation logic in import service

### Phase 7: CV Upload Preparation

#### 7.1 Assess CV Upload Requirements
**Questions to Answer**:
- Do students need to upload CVs after import?
- Is there an existing CV upload feature?
- What file format? (PDF, DOCX, etc.)
- Where should CVs be stored?
- Who can access uploaded CVs?

#### 7.2 Implement CV Upload Feature (if needed)
**If CV upload doesn't exist, consider**:
1. Add CV field to Student model (optional FileField)
2. Create API endpoint for CV upload
3. Create frontend component for CV upload
4. Add CV view/download functionality
5. Set appropriate permissions

**Potential Implementation**:
```python
# In Student model
cv = models.FileField(
    upload_to='students/cvs/%Y/%m/',
    blank=True,
    null=True,
    validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])],
    help_text='Student CV/resume'
)
```

## Implementation Scripts

### Script 1: Excel to CSV Converter
**File**: `scripts/excel_to_csv_converter.py`

**Features**:
- Read Excel file
- Column mapping configuration
- Data cleaning and normalization
- Date format conversion
- Status normalization
- Validation and error reporting
- Generate CSV output

### Script 2: Column Mapping Configuration
**File**: `scripts/column_mapping.json`

**Structure**:
```json
{
  "excel_columns": {
    "reg_no": "Registration Number",
    "name": "Full Name",
    "program_name": "Program",
    "batch_name": "Batch",
    "group_name": "Group",
    "status": "Status",
    "email": "Email",
    "phone": "Phone",
    "date_of_birth": "Date of Birth"
  },
  "defaults": {
    "status": "active"
  },
  "date_formats": [
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DD"
  ]
}
```

## Risk Mitigation

### Data Quality Risks
- **Risk**: Missing or invalid data in Excel
- **Mitigation**: Comprehensive validation in conversion script

### System Mismatch Risks
- **Risk**: Program/Batch/Group names don't match
- **Mitigation**: Pre-import verification and mapping document

### Duplicate Risks
- **Risk**: Duplicate reg_no values
- **Mitigation**: Validation in conversion script and import system

### Import Failure Risks
- **Risk**: Large import fails partway through
- **Mitigation**: Use preview first, import in batches if needed

## Timeline Estimate

1. **Excel Analysis**: 1-2 hours
2. **Script Development**: 2-3 hours
3. **Data Preparation**: 1-2 hours
4. **System Verification**: 1 hour
5. **Test Import**: 1 hour
6. **Full Import**: 30 minutes
7. **Verification**: 1 hour
8. **CV Upload Feature** (if needed): 4-6 hours

**Total**: 11-16 hours (excluding CV upload feature)

## Next Steps

1. ✅ **Review this plan** - Confirm approach
2. ⏳ **Access Excel file** - Get file path or upload to workspace
3. ⏳ **Analyze Excel structure** - Identify columns and data
4. ⏳ **Create column mapping** - Map Excel to CSV format
5. ⏳ **Develop conversion script** - Build Excel to CSV converter
6. ⏳ **Test with sample data** - Validate conversion
7. ⏳ **Verify system setup** - Check programs/batches/groups
8. ⏳ **Run preview import** - Validate CSV
9. ⏳ **Execute full import** - Import all students
10. ⏳ **Verify results** - Confirm successful import
11. ⏳ **Assess CV upload needs** - Determine if feature needed

## Notes

- The import system automatically creates user accounts for imported students
- Passwords are auto-generated based on batch year or reg_no
- Email addresses are auto-generated if not provided (format: `firstname.lastname.b{year}@pmc.edu.pk`)
- The system uses a two-phase workflow (preview then commit) to prevent errors
- All imports are tracked in the ImportJob model for audit purposes

## Support

If issues arise:
1. Check import error report CSV
2. Review validation messages
3. Verify academic structure (Programs/Batches/Groups)
4. Check Django logs for detailed errors
5. Use Django shell to inspect data
