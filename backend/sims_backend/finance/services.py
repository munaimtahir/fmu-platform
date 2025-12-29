"""Services for finance operations."""

import uuid
from decimal import Decimal
from typing import List

from django.db import transaction

from sims_backend.finance.models import Charge, StudentLedgerItem, Challan
from sims_backend.students.models import Student


def generate_ledger_items_from_charge(charge: Charge, students: List[Student]) -> List[StudentLedgerItem]:
    """
    Generate StudentLedgerItem records for a list of students from a charge.
    
    Args:
        charge: Charge instance
        students: List of Student instances
    
    Returns:
        List of created StudentLedgerItem instances
    """
    ledger_items = []
    
    with transaction.atomic():
        for student in students:
            # Check if ledger item already exists (respect unique constraint)
            ledger_item, created = StudentLedgerItem.objects.get_or_create(
                student=student,
                charge=charge,
                defaults={'status': StudentLedgerItem.STATUS_PENDING},
            )
            if created:
                ledger_items.append(ledger_item)
    
    return ledger_items


def generate_challan_number() -> str:
    """
    Generate a unique challan number.
    
    Returns:
        Unique challan number string
    """
    # Simple implementation using UUID
    # In production, you might want a sequential number with prefix
    challan_no = f"CHL-{uuid.uuid4().hex[:12].upper()}"
    
    # Ensure uniqueness
    while Challan.objects.filter(challan_no=challan_no).exists():
        challan_no = f"CHL-{uuid.uuid4().hex[:12].upper()}"
    
    return challan_no


def evaluate_charge_template_title(template: str, context: dict) -> str:
    """
    Evaluate charge template title with placeholders.
    
    Args:
        template: Template string with placeholders (e.g., "{academic_period} Fee")
        context: Dictionary with values for placeholders
    
    Returns:
        Evaluated title string
    """
    try:
        return template.format(**context)
    except KeyError:
        # If placeholder not found, return template as-is
        return template

