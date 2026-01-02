# Finance Module Screenshots Checklist

This document lists every screen and data state that should be captured for the Finance module showcase.

## Finance Dashboard

### [ ] Finance Dashboard - KPIs View
**Screen:** Finance Dashboard (logged in as Finance)
**Expected Elements:**
- Total Outstanding amount card
- Total Collected Today card
- Overdue Count card
- Pending Payments count
- Charts/graphs (if implemented)
- Date range selector (if applicable)

**Data State:**
- Outstanding: ~285,000 PKR
- Collected: ~570,000 PKR
- Overdue: 5 students
- Pending: 0 payments

---

## Vouchers

### [ ] Vouchers List View
**Screen:** Finance → Vouchers
**Expected Elements:**
- Table with columns: Voucher No, Student, Term, Amount, Status, Due Date, Actions
- Filter options: Status, Term, Program, Student
- Search bar
- "Generate Vouchers" button
- Export button (if implemented)

**Data State:**
- Mix of statuses: `generated`, `partially_paid`, `paid`, `overdue`
- At least 20 vouchers visible
- Pagination (if >20)

### [ ] Voucher Detail View
**Screen:** Finance → Vouchers → [Select Voucher]
**Expected Elements:**
- Voucher number (readable format)
- Student name and reg_no
- Term name
- Issue date and due date
- Status badge
- Line items table (Fee Type, Description, Amount)
- Total amount
- Notes field
- "Download PDF" button
- Payment history (if applicable)

**Data State:**
- Voucher with status `generated` or `partially_paid`
- Line items showing: Tuition (50,000), Exam (5,000), Library (2,000)
- Total: 57,000 PKR

### [ ] Voucher PDF Download
**Screen:** Downloaded PDF file
**Expected Elements:**
- Header: "STUDENT FINANCE VOUCHER"
- Voucher metadata table
- Line items table with totals
- Notes section
- Generation timestamp

**Data State:**
- Same as voucher detail view
- Clean, printable format

### [ ] Voucher Generation Form
**Screen:** Finance → Vouchers → Generate
**Expected Elements:**
- Program selector
- Term selector
- Due date picker
- Fee type selector (optional, multi-select)
- Student selector (optional, multi-select or "All Students")
- "Generate" button

**Data State:**
- Form with default values
- At least 2 programs available
- At least 2 terms available

---

## Payments

### [ ] Payments List View
**Screen:** Finance → Payments
**Expected Elements:**
- Table with columns: Receipt No, Student, Amount, Method, Status, Date, Actions
- Filter options: Status, Method, Term, Student
- Search bar
- "Create Payment" button
- Export button (if implemented)

**Data State:**
- Mix of statuses: `received`, `verified`, `rejected`
- At least 10 verified payments
- Various payment methods visible

### [ ] Payment Create Form
**Screen:** Finance → Payments → Create
**Expected Elements:**
- Student selector (with search)
- Term selector
- Voucher selector (optional, filtered by student+term)
- Amount input
- Method selector (Cash, Bank Transfer, Online, etc.)
- Reference No input (optional)
- Notes textarea
- "Record Payment" button

**Data State:**
- Form with student selected
- Voucher pre-selected (if applicable)
- Amount matching voucher total

### [ ] Payment Detail View
**Screen:** Finance → Payments → [Select Payment]
**Expected Elements:**
- Receipt number
- Student name and reg_no
- Term name
- Amount
- Payment method
- Reference number (if provided)
- Status badge
- Received date/time
- Received by (user)
- Voucher link (if linked)
- Notes
- "Verify Payment" button (if status is `received`)
- "Reverse Payment" button (if status is `verified`)
- "Download PDF" button

**Data State:**
- Payment with status `received` (for verification demo)
- Payment with status `verified` (for reversal demo)

### [ ] Payment Receipt PDF Download
**Screen:** Downloaded PDF file
**Expected Elements:**
- Header: "PAYMENT RECEIPT"
- Receipt metadata table
- Payment details
- Notes section
- Generation timestamp

**Data State:**
- Verified payment
- Clean, printable format

### [ ] Payment Verification Action
**Screen:** Finance → Payments → [Select Payment] → Verify
**Expected Elements:**
- Confirmation dialog or form
- Approve/Reject toggle
- Notes field (optional)
- "Confirm" button

**Data State:**
- Payment status changes from `received` → `verified`
- Ledger entry created
- Voucher status updated

### [ ] Payment Reversal Action
**Screen:** Finance → Payments → [Select Payment] → Reverse
**Expected Elements:**
- Reversal form
- Reason field (required)
- Reversed by (auto-filled)
- "Confirm Reversal" button
- Warning message about compensating entries

**Data State:**
- Payment status changes to `reversed`
- Compensating ledger entry created
- Voucher status reconciled

---

## Reports

### [ ] Defaulters Report
**Screen:** Finance → Reports → Defaulters
**Expected Elements:**
- Filter form:
  - Program selector (optional)
  - Term selector (required)
  - Min Outstanding input (default: 0)
  - Status filter (optional)
- "Generate Report" button
- Results table:
  - Student Name
  - Reg No
  - Outstanding Total
  - Overdue Days
  - Latest Voucher No
  - Phone/Email (if available)
- "Export CSV" button
- Pagination (if many results)

**Data State:**
- 5 defaulters listed
- Outstanding amounts: 57,000 PKR each
- Overdue days: 2+ days

### [ ] Daily Collection Report
**Screen:** Finance → Reports → Collection
**Expected Elements:**
- Date range selector (start date, end date)
- "Generate Report" button
- Summary cards:
  - Total Collected
  - Payment Count
- Grouped by method:
  - Cash: Total + Count
  - Bank Transfer: Total + Count
  - Online: Total + Count
  - etc.
- Drilldown list (optional): List of payments in date range
- "Export CSV" button

**Data State:**
- Date range: Last 30 days
- Total collected: ~570,000 PKR
- Count: 10 payments
- Grouped by method with totals

### [ ] Aging Report
**Screen:** Finance → Reports → Aging
**Expected Elements:**
- Term selector (optional)
- "Generate Report" button
- Buckets display:
  - 0-7 days: Count + Amount
  - 8-30 days: Count + Amount
  - 31-60 days: Count + Amount
  - 60+ days: Count + Amount
- List view option (shows students in each bucket)
- "Export CSV" button

**Data State:**
- Term: Block 1
- Buckets populated with counts and amounts
- At least one bucket with data

### [ ] Student Statement
**Screen:** Finance → Reports → Student Statement (or Finance → Students → [Select] → Statement)
**Expected Elements:**
- Student search/selector
- Term selector (optional, "All Time" option)
- "Generate Statement" button
- Statement view:
  - Student info header
  - Opening balance
  - Chronological ledger entries table:
    - Date
    - Description
    - Debit
    - Credit
    - Running Balance
  - Closing balance
- "Download PDF" button

**Data State:**
- Student: STUDENT_PARTIAL or STUDENT_DEFAULTER
- Term: Block 1
- Multiple ledger entries visible
- Running balance calculated correctly

### [ ] Student Statement PDF
**Screen:** Downloaded PDF file
**Expected Elements:**
- Header: "STUDENT LEDGER STATEMENT"
- Student information
- Term/period information
- Opening balance
- Ledger entries table
- Closing balance
- Generation timestamp

**Data State:**
- Same as statement view
- Clean, printable format

---

## Student Views

### [ ] Student "My Fees" View - Paid Student
**Screen:** Student Dashboard → My Fees (logged in as `student`)
**Expected Elements:**
- Outstanding balance: 0.00 PKR
- Summary card: "All fees paid" or similar
- Vouchers list:
  - Voucher No
  - Term
  - Amount
  - Status: `paid`
  - Due Date
  - "Download PDF" button
- Payments list:
  - Receipt No
  - Amount
  - Method
  - Date
  - "Download PDF" button
- Gating status indicators:
  - ✅ Can view transcript
  - ✅ Can view results

**Data State:**
- Outstanding: 0.00 PKR
- At least 1 voucher with status `paid`
- At least 1 payment receipt

### [ ] Student "My Fees" View - Partial Student
**Screen:** Student Dashboard → My Fees (logged in as `student_partial`)
**Expected Elements:**
- Outstanding balance: 28,500.00 PKR (50% remaining)
- Summary card showing partial payment
- Vouchers list:
  - Status: `partially_paid`
  - Shows paid amount vs total
- Gating status indicators:
  - ⚠️ May be blocked (depending on policy threshold)

**Data State:**
- Outstanding: 28,500.00 PKR
- Voucher status: `partially_paid`

### [ ] Student "My Fees" View - Defaulter
**Screen:** Student Dashboard → My Fees (logged in as `student_defaulter`)
**Expected Elements:**
- Outstanding balance: 57,000.00 PKR
- Warning banner: "⚠️ Outstanding dues block access to transcripts and results"
- Vouchers list:
  - Status: `overdue`
  - Due date in past (highlighted in red)
- Gating status indicators:
  - ❌ Cannot view transcript
  - ❌ Cannot view results
  - Reason: "Outstanding dues exceed threshold"

**Data State:**
- Outstanding: 57,000.00 PKR
- Voucher status: `overdue`
- Due date: 2+ days ago

### [ ] Student Gated Action - Transcript Blocked
**Screen:** Student Dashboard → Transcript (logged in as `student_defaulter`)
**Expected Elements:**
- Error message/banner
- Message: "Transcript blocked: outstanding dues exceed threshold"
- Outstanding amount displayed
- Link to "My Fees" page
- "Pay Now" button (if implemented)

**Data State:**
- Outstanding > 0
- Finance policy active

### [ ] Student Gated Action - Results Blocked
**Screen:** Student Dashboard → Results (logged in as `student_defaulter`)
**Expected Elements:**
- Error message/banner
- Message: "Results blocked: outstanding dues exceed threshold"
- Outstanding amount displayed
- Link to "My Fees" page

**Data State:**
- Outstanding > 0
- Finance policy active

### [ ] Student After Payment - Unblocked
**Screen:** Student Dashboard → My Fees (logged in as `student_defaulter` after payment posted)
**Expected Elements:**
- Outstanding balance: 0.00 PKR
- Success message: "All fees paid" or similar
- Voucher status: `paid`
- Gating status indicators:
  - ✅ Can view transcript
  - ✅ Can view results
- Warning banner removed

**Data State:**
- Outstanding: 0.00 PKR
- Payment verified
- Voucher status: `paid`

---

## Adjustments

### [ ] Adjustments List View
**Screen:** Finance → Adjustments
**Expected Elements:**
- Table with columns: Student, Kind, Amount, Status, Requested Date, Actions
- Filter options: Status, Kind, Term, Student
- "Create Adjustment" button

**Data State:**
- Mix of statuses: `pending`, `approved`, `rejected`
- At least 1 approved waiver (for STUDENT_WAIVER)

### [ ] Adjustment Approval Action
**Screen:** Finance → Adjustments → [Select] → Approve
**Expected Elements:**
- Approval form
- Approve/Reject toggle
- Reason field
- "Confirm" button

**Data State:**
- Adjustment status: `pending` → `approved`
- Ledger credit entry created

---

## Voucher Cancellation

### [ ] Voucher Cancel Action
**Screen:** Finance → Vouchers → [Select] → Cancel
**Expected Elements:**
- Cancellation form
- Reason field (required)
- Warning message about reversal entries
- "Confirm Cancellation" button

**Data State:**
- Voucher status: `generated` → `cancelled`
- Reversal ledger entries created
- Voucher excluded from defaulters report

---

## Summary Checklist

- [ ] All Finance Dashboard screens
- [ ] All Voucher screens (list, detail, generate, PDF)
- [ ] All Payment screens (list, create, detail, verify, reverse, PDF)
- [ ] All Report screens (defaulters, collection, aging, statement, PDFs)
- [ ] All Student views (paid, partial, defaulter, gated actions, unblocked)
- [ ] Adjustment screens (list, approve)
- [ ] Voucher cancellation screen

**Total Screenshots Needed:** ~25-30 screenshots
