import io

import django_rq
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import FileResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.admissions.models import Student
from sims_backend.results.models import Result

# Token expires after 48 hours
TOKEN_MAX_AGE = 48 * 60 * 60
signer = TimestampSigner()


def generate_qr_token(student_id: int) -> str:
    """Generate a signed token for QR code"""
    return signer.sign(f"transcript_{student_id}")


def verify_qr_token(token: str) -> dict:
    """Verify a QR token and return student_id if valid"""
    try:
        value = signer.unsign(token, max_age=TOKEN_MAX_AGE)
        # Extract student_id from the value
        if value.startswith("transcript_"):
            student_id = int(value.split("_")[1])
            return {"valid": True, "student_id": student_id, "reason": "Token is valid"}
        else:
            return {"valid": False, "reason": "Invalid token format"}
    except SignatureExpired:
        return {"valid": False, "reason": "Token has expired (> 48 hours)"}
    except BadSignature:
        return {"valid": False, "reason": "Token signature is invalid (tampered)"}
    except (ValueError, IndexError):
        return {"valid": False, "reason": "Invalid token format"}


def generate_transcript_pdf(student: Student) -> io.BytesIO:
    """Generate a PDF transcript for a student"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()

    # Title
    title = Paragraph("<b>ACADEMIC TRANSCRIPT</b>", styles["Title"])
    story.append(title)
    story.append(Spacer(1, 0.25 * inch))

    # Student information
    student_info = [
        ["Student Name:", student.name],
        ["Registration No:", student.reg_no],
        ["Program:", student.program],
        ["Status:", student.status],
    ]

    info_table = Table(student_info, colWidths=[2 * inch, 4 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(info_table)
    story.append(Spacer(1, 0.25 * inch))

    # Results
    results = Result.objects.filter(student=student, is_published=True).select_related(
        "section__course"
    )

    if results.exists():
        story.append(Paragraph("<b>Course Results</b>", styles["Heading2"]))
        story.append(Spacer(1, 0.1 * inch))

        result_data = [["Course Code", "Course Title", "Term", "Grade"]]

        for result in results:
            result_data.append(
                [
                    result.section.course.code,
                    result.section.course.title,
                    result.section.term,
                    result.final_grade,
                ]
            )

        result_table = Table(
            result_data, colWidths=[1.5 * inch, 3 * inch, 1 * inch, 1 * inch]
        )
        result_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(result_table)
    else:
        story.append(Paragraph("No published results available.", styles["Normal"]))

    story.append(Spacer(1, 0.5 * inch))

    # QR token
    token = generate_qr_token(student.id)
    qr_info = Paragraph(
        f"<b>Verification Token:</b> {token}<br/>"
        f"<i>This transcript can be verified at /api/transcripts/verify/{token}</i><br/>"
        f"<i>Token valid for 48 hours from generation.</i>",
        styles["Normal"],
    )
    story.append(qr_info)

    # Footer
    story.append(Spacer(1, 0.25 * inch))
    footer = Paragraph(
        f"<i>Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}</i>",
        styles["Normal"],
    )
    story.append(footer)

    doc.build(story)
    buffer.seek(0)
    return buffer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_transcript(request, student_id: int):
    """Generate and download transcript for a student"""
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response(
            {"error": {"code": 404, "message": "Student not found"}}, status=404
        )

    # Generate PDF
    pdf_buffer = generate_transcript_pdf(student)

    # Return PDF as download
    return FileResponse(
        pdf_buffer,
        as_attachment=True,
        filename=f"transcript_{student.reg_no}.pdf",
        content_type="application/pdf",
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_transcript(request, token: str):
    """Verify a transcript QR token"""
    result = verify_qr_token(token)
    return Response(result)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def enqueue_transcript_generation(request):
    """
    Enqueue transcript generation as a background job.

    Request body:
        {
            "student_id": int,
            "email": str (optional)
        }
    """
    student_id = request.data.get("student_id")
    email = request.data.get("email")

    if not student_id:
        return Response(
            {"error": {"code": 400, "message": "student_id is required"}}, status=400
        )

    # Check if student exists
    try:
        Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response(
            {"error": {"code": 404, "message": "Student not found"}}, status=404
        )

    # Enqueue the job
    queue = django_rq.get_queue("default")
    from .jobs import generate_and_email_transcript

    job = queue.enqueue(generate_and_email_transcript, student_id, email)

    return Response(
        {
            "message": "Transcript generation job enqueued",
            "job_id": job.id,
            "student_id": student_id,
        },
        status=202,
    )
