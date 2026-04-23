import pytest
import io
from decimal import Decimal
from datetime import datetime
from sims_backend.finance.models import Voucher, Payment, VoucherItem, FeeType
from sims_backend.finance.pdf import voucher_pdf, payment_receipt_pdf, student_statement_pdf
from sims_backend.students.models import Student
from sims_backend.academics.models import Program, AcademicPeriod, Batch, Group as AcadGroup

@pytest.fixture
def finance_pdf_setup(db):
    program = Program.objects.create(name="PDF Program")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="A")
    term = AcademicPeriod.objects.create(name="PDF Term", period_type="YEAR")
    student = Student.objects.create(reg_no="PDF-001", name="PDF Student", program=program, batch=batch, group=group)
    fee_type = FeeType.objects.create(code="TUI", name="Tuition")
    
    voucher = Voucher.objects.create(
        student=student, term=term, voucher_no="V-001", 
        total_amount=Decimal("1000.00"), due_date=datetime.now().date()
    )
    VoucherItem.objects.create(voucher=voucher, fee_type=fee_type, amount=Decimal("1000.00"))
    
    payment = Payment.objects.create(
        student=student, term=term, receipt_no="R-001",
        amount=Decimal("1000.00"), method="CASH",
        voucher=voucher, status="verified", received_at=datetime.now()
    )
    
    return {"voucher": voucher, "payment": payment, "student": student, "term": term}

def test_voucher_pdf(finance_pdf_setup):
    pdf = voucher_pdf(finance_pdf_setup["voucher"])
    assert isinstance(pdf, io.BytesIO)
    assert len(pdf.getvalue()) > 0

def test_payment_receipt_pdf(finance_pdf_setup):
    pdf = payment_receipt_pdf(finance_pdf_setup["payment"])
    assert isinstance(pdf, io.BytesIO)
    assert len(pdf.getvalue()) > 0

def test_student_statement_pdf(finance_pdf_setup):
    statement = {
        "student_name": "Test Student",
        "student_reg_no": "TEST-001",
        "term_name": "Test Term",
        "opening_balance": 0.0,
        "closing_balance": 500.0,
        "entries": [
            {
                "date": datetime.now(),
                "description": "Tuition Fee",
                "debit": 500.0,
                "credit": 0.0,
                "running_balance": 500.0
            }
        ]
    }
    pdf = student_statement_pdf(statement)
    assert isinstance(pdf, io.BytesIO)
    assert len(pdf.getvalue()) > 0
