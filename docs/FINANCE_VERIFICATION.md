# Finance Module Verification Guide

This document provides copy-paste commands and verification steps for the Finance module release FIN-1.

## Docker Workflow

### 1. Build and Start Services
```bash
cd /home/munaim/srv/apps/fmu-platform
docker compose up -d --build
```

### 2. Run Migrations
```bash
docker compose exec backend python manage.py migrate
```

### 3. Seed Demo Data
```bash
docker compose exec backend python manage.py seed_demo --students 30
```

**Expected Output:**
- Creates 5 specific demo students: STUDENT_PAID, STUDENT_PARTIAL, STUDENT_DEFAULTER, STUDENT_WAIVER, STUDENT_REVERSAL
- Creates fee plans for 2 terms across 2 programs
- Generates vouchers and payments
- Sets up finance policies

### 4. Run Backend Tests
```bash
docker compose exec backend pytest backend/tests/test_finance_module.py -v
docker compose exec backend pytest backend/sims_backend/finance/tests/ -v
```

### 5. Frontend Build (if configured)
```bash
docker compose exec frontend npm run build
```

---

## Smoke Test Endpoints

### Health Check
```bash
curl http://localhost:8000/health/
```

**Expected:** `{"status": "ok", ...}`

### Finance Student Summary
```bash
# Get student ID first (from seed output or database)
STUDENT_ID=1
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/finance/students/${STUDENT_ID}/
```

**Expected:** JSON with outstanding, gating flags, voucher statuses

### Defaulters Report
```bash
# Get term ID first
TERM_ID=1
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"term_id": '${TERM_ID}', "min_outstanding": 0}' \
  http://localhost:8000/api/finance/reports/defaulters/
```

**Expected:** JSON with rows array containing defaulters

### Collection Report
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/finance/reports/collection/?start=2026-01-01&end=2026-12-31"
```

**Expected:** JSON with total_collected, total_count, by_method breakdown

### Aging Report
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/finance/reports/aging/?term=${TERM_ID}"
```

**Expected:** JSON with buckets (0_7, 8_30, 31_60, 60_plus) with counts and amounts

### Student Statement
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/finance/students/${STUDENT_ID}/statement/?term=${TERM_ID}"
```

**Expected:** JSON with chronological ledger entries and running balances

### Student Statement PDF
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/finance/students/${STUDENT_ID}/statement/pdf/?term=${TERM_ID}" \
  -o statement.pdf
```

**Expected:** PDF file download

### Voucher PDF
```bash
VOUCHER_ID=1
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/finance/vouchers/${VOUCHER_ID}/pdf/" \
  -o voucher.pdf
```

**Expected:** PDF file download

### Payment Receipt PDF
```bash
PAYMENT_ID=1
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/finance/payments/${PAYMENT_ID}/pdf/" \
  -o receipt.pdf
```

**Expected:** PDF file download

---

## Gating Verification

### Test Defaulter Student Blocked

1. **Login as STUDENT_DEFAULTER:**
   - Username: `student_defaulter`
   - Password: `student123`

2. **Check Finance Summary:**
   ```bash
   # Get student ID for defaulter
   curl -H "Authorization: Bearer DEFULTER_TOKEN" \
     "http://localhost:8000/api/finance/students/${DEFULTER_STUDENT_ID}/"
   ```
   **Expected:** `gating.can_view_transcript: false`, `gating.can_view_results: false`

3. **Try to Access Transcript:**
   ```bash
   curl -H "Authorization: Bearer DEFULTER_TOKEN" \
     "http://localhost:8000/api/transcripts/${DEFULTER_STUDENT_ID}/"
   ```
   **Expected:** Error response with finance blocking message

4. **Try to Access Results:**
   ```bash
   curl -H "Authorization: Bearer DEFULTER_TOKEN" \
     "http://localhost:8000/api/results/me/"
   ```
   **Expected:** Error response or filtered results (depending on implementation)

### Test Payment Unblocks Student

1. **Login as Finance:**
   - Username: `finance`
   - Password: `finance123`

2. **Record Payment for Defaulter:**
   ```bash
   curl -X POST -H "Authorization: Bearer FINANCE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "student": '${DEFULTER_STUDENT_ID}',
       "term": '${TERM_ID}',
       "amount": 57000,
       "method": "cash",
       "voucher": '${VOUCHER_ID}'
     }' \
     http://localhost:8000/api/finance/payments/
   ```

3. **Verify Payment:**
   ```bash
   PAYMENT_ID=<from previous response>
   curl -X POST -H "Authorization: Bearer FINANCE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"approve": true}' \
     "http://localhost:8000/api/finance/payments/${PAYMENT_ID}/verify/"
   ```

4. **Check Defaulter Finance Summary Again:**
   ```bash
   curl -H "Authorization: Bearer DEFULTER_TOKEN" \
     "http://localhost:8000/api/finance/students/${DEFULTER_STUDENT_ID}/"
   ```
   **Expected:** `gating.can_view_transcript: true`, `gating.can_view_results: true`, `outstanding: 0`

---

## Payment Reversal Test

1. **Create and Verify a Payment:**
   ```bash
   # (Use steps from above)
   ```

2. **Reverse the Payment:**
   ```bash
   curl -X POST -H "Authorization: Bearer FINANCE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Test reversal"}' \
     "http://localhost:8000/api/finance/payments/${PAYMENT_ID}/reverse/"
   ```

3. **Verify Ledger Entry Created:**
   ```bash
   curl -H "Authorization: Bearer FINANCE_TOKEN" \
     "http://localhost:8000/api/finance/ledger/?student=${STUDENT_ID}&reference_type=reversal"
   ```
   **Expected:** Reversal ledger entry with debit matching the original payment credit

---

## Voucher Cancellation Test

1. **Cancel a Voucher:**
   ```bash
   curl -X POST -H "Authorization: Bearer FINANCE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Test cancellation"}' \
     "http://localhost:8000/api/finance/vouchers/${VOUCHER_ID}/cancel/"
   ```

2. **Verify Voucher Status:**
   ```bash
   curl -H "Authorization: Bearer FINANCE_TOKEN" \
     "http://localhost:8000/api/finance/vouchers/${VOUCHER_ID}/"
   ```
   **Expected:** `status: "cancelled"`

3. **Verify Reversal Entries:**
   ```bash
   curl -H "Authorization: Bearer FINANCE_TOKEN" \
     "http://localhost:8000/api/finance/ledger/?voucher=${VOUCHER_ID}"
   ```
   **Expected:** Credit entries matching the voucher debits

---

## CSV Export Tests

### Defaulters CSV
```bash
curl -H "Authorization: Bearer FINANCE_TOKEN" \
  "http://localhost:8000/api/finance/reports/defaulters/?format=csv" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"term_id": '${TERM_ID}'}' \
  -o defaulters.csv
```

### Collection CSV
```bash
curl -H "Authorization: Bearer FINANCE_TOKEN" \
  "http://localhost:8000/api/finance/reports/collection/?start=2026-01-01&end=2026-12-31&format=csv" \
  -o collection.csv
```

### Aging CSV
```bash
curl -H "Authorization: Bearer FINANCE_TOKEN" \
  "http://localhost:8000/api/finance/reports/aging/?term=${TERM_ID}&format=csv" \
  -o aging.csv
```

---

## Term Lock Test

1. **Create a Term with Past End Date:**
   ```bash
   # Via admin or directly in database
   # Set term.end_date to a date in the past
   ```

2. **Try to Create Voucher for Locked Term:**
   ```bash
   curl -X POST -H "Authorization: Bearer FINANCE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "term_id": '${LOCKED_TERM_ID}',
       "due_date": "2026-12-31",
       "student_ids": ['${STUDENT_ID}']
     }' \
     "http://localhost:8000/api/finance/vouchers/generate/"
   ```
   **Expected:** Error: "Term is locked"

3. **Admin Should Be Able to Override:**
   ```bash
   # Login as admin and try again
   # Should succeed
   ```

---

## Duplicate Prevention Test

1. **Create Payment with Reference No:**
   ```bash
   curl -X POST -H "Authorization: Bearer FINANCE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "student": '${STUDENT_ID}',
       "term": '${TERM_ID}',
       "amount": 1000,
       "method": "bank_transfer",
       "reference_no": "TEST123"
     }' \
     http://localhost:8000/api/finance/payments/
   ```

2. **Verify Payment:**
   ```bash
   # (Use verify endpoint)
   ```

3. **Try to Create Duplicate:**
   ```bash
   # Same reference_no and method
   ```
   **Expected:** Error: "Duplicate reference number"

---

## Expected Test Results

### Backend Tests
- ✅ Defaulters report correctness
- ✅ Collection report totals by method
- ✅ Aging bucket correctness
- ✅ Student statement ordering and totals
- ✅ Partial payment status transitions
- ✅ Overpayment behavior (credit balance)
- ✅ Payment reversal creates compensating ledger entry
- ✅ Voucher cancellation creates reversal entries
- ✅ Term lock enforcement
- ✅ Object-level permissions for student

### Frontend Tests (if implemented)
- ✅ Finance reports pages service calls
- ✅ Payment reverse action calls correct endpoint
- ✅ Voucher cancel action calls correct endpoint

---

## Quick Verification Checklist

- [ ] Docker services start successfully
- [ ] Migrations apply cleanly
- [ ] Seed creates 5 demo students correctly
- [ ] All smoke test endpoints return 200
- [ ] PDF downloads work (voucher, receipt, statement)
- [ ] CSV exports work (defaulters, collection, aging)
- [ ] Defaulter student is blocked from transcript/results
- [ ] Payment unblocks defaulter student
- [ ] Payment reversal creates compensating entry
- [ ] Voucher cancellation creates reversal entries
- [ ] Term lock prevents operations on closed terms
- [ ] Duplicate prevention works for reference_no
- [ ] All backend tests pass
- [ ] Frontend builds successfully (if applicable)

---

## Troubleshooting

### If seed fails:
- Check database connection
- Verify all migrations applied
- Check for existing data conflicts

### If endpoints return 401:
- Verify authentication token is valid
- Check user has appropriate permissions (Finance/Admin)

### If PDF generation fails:
- Check ReportLab is installed
- Verify file permissions for temp directory

### If reports are empty:
- Ensure seed data was created
- Check date ranges and filters
- Verify term IDs are correct
