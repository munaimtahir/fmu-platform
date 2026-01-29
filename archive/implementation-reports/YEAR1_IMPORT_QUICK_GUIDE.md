# Year 1 Import - Quick Start Guide

## ✅ CSV File Ready!

**File**: `Year1_students_import.csv`  
**Location**: `/home/munaim/srv/apps/fmu-platform/Year1_students_import.csv`  
**Students**: 251 ready to import

## Quick Import Steps

### Step 1: Verify Batch & Group Exist
Before importing, ensure these exist in your system:
- **Program**: `MBBS`
- **Batch**: `2029 Batch` (under MBBS)
- **Group**: `Group A` (under 2029 Batch)

If they don't exist, create them first via Django admin.

### Step 2: Import via Admin Interface
1. Log in as admin
2. Go to: **Admin Dashboard → Bulk CSV Import → Student CSV Import**
3. Upload: `Year1_students_import.csv`
4. Click **"Preview Import"**
5. Review results (should show 251 valid rows)
6. Click **"Commit Import"**

### Step 3: Verify
Check that 251 students were imported successfully.

## File Details

- **Format**: CSV (UTF-8)
- **Columns**: reg_no, name, program_name, batch_name, group_name, status, email, phone, date_of_birth
- **All reg_nos are unique** ✅
- **All required fields present** ✅

## Need Help?

See `YEAR1_IMPORT_SUMMARY.md` for detailed information.
