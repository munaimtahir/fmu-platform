import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from sims_backend.finance.models import Payment, Voucher


def voucher_pdf(voucher: Voucher) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()

    story.append(Paragraph("<b>STUDENT FINANCE VOUCHER</b>", styles["Title"]))
    story.append(Spacer(1, 0.25 * inch))

    meta_rows = [
        ["Voucher No:", voucher.voucher_no],
        ["Student:", f"{voucher.student.name} ({voucher.student.reg_no})"],
        ["Term:", voucher.term.name],
        ["Issue Date:", voucher.issue_date.strftime("%Y-%m-%d")],
        ["Due Date:", voucher.due_date.strftime("%Y-%m-%d")],
        ["Status:", voucher.get_status_display()],
    ]
    table = Table(meta_rows, colWidths=[1.8 * inch, 4.5 * inch])
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 0.3 * inch))

    line_items = [["Fee Type", "Description", "Amount"]]
    for item in voucher.items.all():
        line_items.append([item.fee_type.code, item.description or item.fee_type.name, f"{item.amount:.2f}"])
    line_items.append(["", "Total", f"{voucher.total_amount:.2f}"])

    line_table = Table(line_items, colWidths=[1.5 * inch, 3.5 * inch, 1.3 * inch])
    line_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]
        )
    )
    story.append(line_table)
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph(f"Notes: {voucher.notes or 'N/A'}", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Italic"]))

    doc.build(story)
    buffer.seek(0)
    return buffer


def payment_receipt_pdf(payment: Payment) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()

    story.append(Paragraph("<b>PAYMENT RECEIPT</b>", styles["Title"]))
    story.append(Spacer(1, 0.25 * inch))

    rows = [
        ["Receipt No:", payment.receipt_no],
        ["Student:", f"{payment.student.name} ({payment.student.reg_no})"],
        ["Term:", payment.term.name],
        ["Amount:", f"{payment.amount:.2f}"],
        ["Method:", payment.get_method_display() if hasattr(payment, "get_method_display") else payment.method],
        ["Voucher Ref:", payment.voucher.voucher_no if payment.voucher else "N/A"],
        ["Reference No:", payment.reference_no or "N/A"],
        ["Status:", payment.get_status_display() if hasattr(payment, "get_status_display") else payment.status],
        ["Received At:", payment.received_at.strftime("%Y-%m-%d %H:%M")],
    ]
    table = Table(rows, colWidths=[1.8 * inch, 4.5 * inch])
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(f"Notes: {payment.notes or 'N/A'}", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Italic"]))

    doc.build(story)
    buffer.seek(0)
    return buffer


def student_statement_pdf(statement: dict) -> io.BytesIO:
    """Generate a PDF student ledger statement."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()

    story.append(Paragraph("<b>STUDENT LEDGER STATEMENT</b>", styles["Title"]))
    story.append(Spacer(1, 0.25 * inch))

    # Student information
    student_info = [
        ["Student Name:", statement["student_name"]],
        ["Registration No:", statement["student_reg_no"]],
        ["Term:", statement["term_name"]],
    ]
    info_table = Table(student_info, colWidths=[1.8 * inch, 4.5 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(info_table)
    story.append(Spacer(1, 0.3 * inch))

    # Opening balance
    story.append(Paragraph(f"<b>Opening Balance:</b> {statement['opening_balance']:.2f} PKR", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))

    # Ledger entries table
    if statement["entries"]:
        entry_data = [["Date", "Description", "Debit", "Credit", "Balance"]]
        for entry in statement["entries"]:
            entry_data.append([
                entry["date"].strftime("%Y-%m-%d"),
                entry["description"][:50],  # Truncate long descriptions
                f"{entry['debit']:.2f}" if entry["debit"] else "",
                f"{entry['credit']:.2f}" if entry["credit"] else "",
                f"{entry['running_balance']:.2f}",
            ])
        
        entry_table = Table(entry_data, colWidths=[1 * inch, 2.5 * inch, 0.8 * inch, 0.8 * inch, 1 * inch])
        entry_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ]
            )
        )
        story.append(entry_table)
    else:
        story.append(Paragraph("No ledger entries found.", styles["Normal"]))
    
    story.append(Spacer(1, 0.3 * inch))
    
    # Closing balance
    story.append(Paragraph(f"<b>Closing Balance:</b> {statement['closing_balance']:.2f} PKR", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Italic"]))

    doc.build(story)
    buffer.seek(0)
    return buffer
