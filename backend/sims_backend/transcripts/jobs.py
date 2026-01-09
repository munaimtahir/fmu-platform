"""Background jobs for transcript generation and processing"""

import logging
from typing import Any

from django.core.mail import send_mail

from sims_backend.students.models import Student

from .views import generate_transcript_pdf

logger = logging.getLogger(__name__)


def generate_and_email_transcript(
    student_id: int, recipient_email: str | None = None
) -> dict[str, Any]:
    """
    Background job to generate a transcript PDF and optionally email it.

    Args:
        student_id: ID of the student
        recipient_email: Email address to send transcript to (optional)

    Returns:
        Dict with status and message
    """
    try:
        # Get student
        student = Student.objects.get(id=student_id)
        logger.info(f"Starting transcript generation for student {student.reg_no}")

        # Generate PDF
        generate_transcript_pdf(student)
        logger.info(f"PDF generated successfully for student {student.reg_no}")

        # Save to media (if needed for future reference)
        # For now, just generate - in production you might want to save this

        # Send email if recipient provided
        if recipient_email:
            try:
                send_mail(
                    subject=f"Transcript for {student.name}",
                    message=f"Please find attached your academic transcript.\n\nStudent: {student.name}\nRegistration No: {student.reg_no}",
                    from_email="noreply@fmu.edu",
                    recipient_list=[recipient_email],
                    fail_silently=False,
                )
                logger.info(f"Transcript email sent to {recipient_email}")
                return {
                    "status": "success",
                    "message": f"Transcript generated and emailed to {recipient_email}",
                    "student_reg_no": student.reg_no,
                }
            except Exception as e:
                logger.error(f"Email sending failed: {e}")
                return {
                    "status": "partial_success",
                    "message": f"Transcript generated but email failed: {str(e)}",
                    "student_reg_no": student.reg_no,
                }
        else:
            return {
                "status": "success",
                "message": "Transcript generated successfully",
                "student_reg_no": student.reg_no,
            }

    except Student.DoesNotExist:
        logger.error(f"Student with ID {student_id} not found")
        return {"status": "error", "message": f"Student with ID {student_id} not found"}
    except Exception as e:
        logger.error(f"Transcript generation failed: {e}")
        return {"status": "error", "message": f"Transcript generation failed: {str(e)}"}


def batch_generate_transcripts(student_ids: list[int]) -> dict[str, Any]:
    """
    Background job to generate transcripts for multiple students.

    Args:
        student_ids: List of student IDs

    Returns:
        Dict with summary of results
    """
    results: dict[str, Any] = {"success": [], "failed": [], "total": len(student_ids)}

    for student_id in student_ids:
        result = generate_and_email_transcript(student_id)
        if result["status"] == "success":
            results["success"].append(student_id)
        else:
            results["failed"].append(
                {"student_id": student_id, "error": result["message"]}
            )

    logger.info(
        f"Batch transcript generation complete: {len(results['success'])} succeeded, {len(results['failed'])} failed"
    )
    return results
