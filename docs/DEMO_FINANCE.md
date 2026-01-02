# Finance Module Demo Guide - 7 Minute Story

**Purpose:** Demonstrate the complete finance workflow in 7 minutes, showcasing voucher generation, payment processing, reports, and gating.

## Demo User Credentials

### Administrative Users
- **Admin**: `admin` / `admin123`
- **Finance**: `finance` / `finance123`
- **Registrar**: `registrar` / `registrar123`

### Demo Students (5 Specific Scenarios)
1. **STUDENT_PAID** (Fully Paid)
   - Username: `student`
   - Password: `student123`
   - Status: All fees paid, can access all features

2. **STUDENT_PARTIAL** (Partially Paid)
   - Username: `student_partial`
   - Password: `student123`
   - Status: 50% paid, voucher shows `partially_paid`

3. **STUDENT_DEFAULTER** (Unpaid, Overdue)
   - Username: `student_defaulter`
   - Password: `student123`
   - Status: Unpaid, overdue voucher, blocked from gated actions

4. **STUDENT_WAIVER** (Approved Waiver)
   - Username: `student_waiver`
   - Password: `student123`
   - Status: Approved waiver/scholarship, credit in ledger

5. **STUDENT_REVERSAL** (Payment Reversed)
   - Username: `student_reversal`
   - Password: `student123`
   - Status: Has a reversed payment, demonstrates refund workflow

---

## Demo Script (7 Minutes)

### Step 1: Finance Dashboard (1 minute)
**Login as Finance** (`finance` / `finance123`)

1. Navigate to Finance Dashboard
2. **Expected Output:**
   - KPIs showing:
     - Total Outstanding: ~285,000 PKR (from 5 defaulters + partials)
     - Total Collected Today: ~570,000 PKR (from 10 paid students)
     - Overdue Count: 5 students
     - Pending Payments: 0 (all verified)

### Step 2: Generate Vouchers (1 minute)
**Still logged in as Finance**

1. Navigate to Vouchers → Generate
2. Select:
   - Program: MBBS (first program)
   - Term: Block 1 (Term 1)
   - Due Date: 10 days from today
   - Fee Types: All (or select specific)
3. Click "Generate for All Students" or select specific students
4. **Expected Output:**
   - Success message: "X vouchers created"
   - Vouchers appear in list with status `generated`
   - Each voucher shows total amount (57,000 PKR = 50k tuition + 5k exam + 2k library)

### Step 3: Record and Verify Payment (1.5 minutes)
**Still logged in as Finance**

1. Navigate to Payments → Create Payment
2. Select a student (e.g., one with `generated` voucher)
3. Enter:
   - Amount: 57,000 PKR (full voucher amount)
   - Method: Cash (or Bank Transfer)
   - Voucher: Select the voucher
   - Reference No: (optional)
4. Click "Record Payment" → Status: `received`
5. Click "Verify Payment" → Status: `verified`
6. **Expected Output:**
   - Payment receipt generated
   - Voucher status changes to `paid`
   - Ledger shows credit entry
   - Download receipt PDF to verify

### Step 4: View Defaulters Report (1 minute)
**Still logged in as Finance**

1. Navigate to Reports → Defaulters
2. Select:
   - Term: Block 1
   - Min Outstanding: 0 (or leave default)
   - Program: (optional, leave blank for all)
3. Click "Generate Report"
4. **Expected Output:**
   - List of 5 defaulters (including `student_defaulter`)
   - Shows: Name, Reg No, Outstanding Amount, Overdue Days, Latest Voucher No
   - Export to CSV available
5. Click "Export CSV" to download

### Step 5: Student View - Paid Student (1 minute)
**Logout, Login as STUDENT_PAID** (`student` / `student123`)

1. Navigate to "My Fees" or Finance section
2. **Expected Output:**
   - Shows: "All fees paid" or "Outstanding: 0.00 PKR"
   - List of vouchers with status `paid`
   - Can download voucher PDFs
   - Can download payment receipts
   - **Gating Status:** ✅ Can view transcript, ✅ Can view results

3. Try to access Transcript → Should work (no blocking)
4. Try to access Results → Should work (no blocking)

### Step 6: Student View - Defaulter (1 minute)
**Logout, Login as STUDENT_DEFAULTER** (`student_defaulter` / `student123`)

1. Navigate to "My Fees"
2. **Expected Output:**
   - Shows: "Outstanding: 57,000.00 PKR"
   - Voucher status: `overdue`
   - Due date passed
   - **Gating Banner:** "⚠️ Outstanding dues block access to transcripts and results"

3. Try to access Transcript → **BLOCKED**
   - Error message: "Transcript blocked: outstanding dues exceed threshold"
   - Shows outstanding amount

4. Try to access Results → **BLOCKED**
   - Error message: "Results blocked: outstanding dues exceed threshold"

### Step 7: Finance Posts Payment → Student Unblocked (1.5 minutes)
**Logout, Login as Finance** (`finance` / `finance123`)

1. Navigate to Payments → Create Payment
2. Select `student_defaulter`
3. Enter:
   - Amount: 57,000 PKR
   - Method: Cash
   - Voucher: Select the overdue voucher
4. Record and Verify payment
5. **Expected Output:**
   - Payment verified
   - Voucher status changes to `paid`
   - Ledger updated

**Logout, Login as STUDENT_DEFAULTER** (`student_defaulter` / `student123`)

6. Navigate to "My Fees"
7. **Expected Output:**
   - Outstanding: 0.00 PKR
   - Voucher status: `paid`
   - Gating banner removed

8. Try to access Transcript → **NOW WORKS** ✅
9. Try to access Results → **NOW WORKS** ✅

---

## Expected Outputs Summary

### Finance Dashboard KPIs
- Total Outstanding: ~285,000 PKR
- Total Collected: ~570,000 PKR
- Overdue Count: 5
- Pending Payments: 0

### Voucher States
- **Paid**: 10 students (status: `paid`)
- **Partial**: 5 students (status: `partially_paid`)
- **Overdue**: 5 students (status: `overdue`)

### Defaulters Report
- 5 students listed
- Outstanding amounts: 57,000 PKR each
- Overdue days: 2+ days (depending on seed date)

### Student Views
- **Paid Student**: Outstanding 0, can access all features
- **Defaulter**: Outstanding 57,000, blocked from transcript/results
- **After Payment**: Outstanding 0, unblocked

### PDF Downloads
- Voucher PDF: Shows line items, totals, due date
- Receipt PDF: Shows payment details, receipt number, method

---

## Troubleshooting

### If vouchers don't appear:
- Check fee plans exist for program+term
- Verify students are assigned to the program
- Check finance user has permissions

### If payments don't verify:
- Ensure payment status is `received` first
- Check finance user has verify permission
- Verify ledger entries are created

### If gating doesn't work:
- Check FinancePolicy exists with `BLOCK_TRANSCRIPT_IF_DUES` and `BLOCK_RESULTS_IF_DUES`
- Verify policy threshold is 0 (or appropriate value)
- Check student's outstanding balance is > threshold

### If reports are empty:
- Ensure vouchers and payments exist for the term
- Check date filters are correct
- Verify finance user has report access

---

## Quick Reset (if needed)

To reset demo data:
```bash
docker compose exec backend python manage.py seed_demo --clear --students 30
```

This will:
- Clear existing data
- Recreate all demo users
- Create 5 specific demo students
- Generate vouchers and payments
- Set up finance policies
