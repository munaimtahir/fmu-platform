# Excel Import Quick Start Guide

## Immediate Next Steps

### 1. Access the Excel File
The file "Year 1 formatted data.xlsx" needs to be accessible. Please:
- Confirm the file path, or
- Copy the file to the workspace, or
- Provide the file location

### 2. Review Excel File Structure
Open the Excel file and note:
- Column names (first row)
- Number of data rows
- Data types in each column
- Any special formatting or issues

### 3. Run the Conversion Script

Once you have the Excel file, run:

```bash
cd /home/munaim/srv/apps/fmu-platform

# Basic usage (script will try to auto-detect columns)
python scripts/excel_to_csv_converter.py \
  --input "/path/to/Year 1 formatted data.xlsx" \
  --output "Year1_students_import.csv"

# With custom mapping (if column names don't match)
python scripts/excel_to_csv_converter.py \
  --input "/path/to/Year 1 formatted data.xlsx" \
  --output "Year1_students_import.csv" \
  --mapping-config scripts/column_mapping_example.json
```

### 4. Review Generated CSV
- Open the generated CSV file
- Verify data looks correct
- Check for any obvious issues

### 5. Import via Admin Interface
1. Log in as admin
2. Navigate to: **Admin Dashboard → Bulk CSV Import → Student CSV Import**
3. Upload the generated CSV file
4. Click "Preview Import"
5. Review validation results
6. If all valid, click "Commit Import"

## Required CSV Format

The CSV must have these columns:

| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| `reg_no` | ✅ Yes | Text (max 32 chars) | Unique registration number |
| `name` | ✅ Yes | Text (max 255 chars) | Full name |
| `program_name` | ✅ Yes | Text | Must exist in system (e.g., "MBBS") |
| `batch_name` | ✅ Yes | Text | Must exist in system (e.g., "2024 Batch") |
| `group_name` | ✅ Yes | Text | Must exist in system (e.g., "Group A") |
| `status` | ✅ Yes | Text | One of: `active`, `inactive`, `graduated`, `suspended` |
| `email` | ⚪ Optional | Email | Auto-generated if not provided |
| `phone` | ⚪ Optional | Text (max 20 chars) | Phone number |
| `date_of_birth` | ⚪ Optional | YYYY-MM-DD | Date format |

## Common Issues & Solutions

### Issue: "Could not find column for 'reg_no'"
**Solution**: Update the column mapping in the script or use a mapping config file.

### Issue: "Unknown program_name"
**Solution**: Verify the program exists in the system. Check via Django shell:
```python
from sims_backend.academics.models import Program
Program.objects.all().values_list('name', flat=True)
```

### Issue: "Invalid date format"
**Solution**: The script tries multiple date formats. If it fails, manually fix dates in Excel to YYYY-MM-DD format.

### Issue: "Duplicate reg_no"
**Solution**: Remove duplicate registration numbers from the Excel file before conversion.

## Pre-Import Checklist

Before importing, verify:
- [ ] Programs exist in system (match Excel program names)
- [ ] Batches exist in system (match Excel batch names)
- [ ] Groups exist in system (match Excel group names)
- [ ] All reg_no values are unique
- [ ] Status values are valid (active, inactive, graduated, suspended)
- [ ] Date formats are correct (YYYY-MM-DD)

## Post-Import Verification

After import, verify:
```bash
cd backend
python manage.py shell

from sims_backend.students.models import Student
# Count imported students
Student.objects.count()

# Check a sample
Student.objects.all()[:5]
```

## Need Help?

See the full plan: `EXCEL_TO_STUDENT_IMPORT_PLAN.md`
