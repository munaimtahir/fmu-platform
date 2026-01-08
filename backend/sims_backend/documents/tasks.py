"""Async tasks for document generation."""
import io
import logging
from datetime import timedelta

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.signing import TimestampSigner
from django.utils import timezone

from .models import Document, DocumentGenerationJob

logger = logging.getLogger(__name__)
signer = TimestampSigner()


def generate_document_async(document_id: int, job_id: int):
    """
    Async task to generate a document.
    
    This function should be called via a task queue (e.g., Celery, RQ).
    For now, it's a placeholder that can be adapted to your task queue system.
    """
    try:
        document = Document.objects.get(id=document_id)
        job = DocumentGenerationJob.objects.get(id=job_id)

        # Update job status
        job.status = DocumentGenerationJob.STATUS_PROCESSING
        job.started_at = timezone.now()
        job.save()

        logger.info(f"Starting document generation for {document.document_number}")

        # Generate document based on type
        if document.type.code == "transcript":
            pdf_buffer = _generate_transcript_pdf(document.student)
        elif document.type.code == "certificate":
            pdf_buffer = _generate_certificate_pdf(document.student)
        else:
            raise ValueError(f"Unknown document type: {document.type.code}")

        # Save PDF file
        filename = f"{document.type.code}_{document.document_number}.pdf"
        document.file.save(filename, ContentFile(pdf_buffer.getvalue()), save=False)

        # Generate QR code
        qr_token = signer.sign(f"doc_{document.id}")
        qr_image = _generate_qr_code(qr_token)
        document.qr_code.save(
            f"qr_{document.document_number}.png",
            ContentFile(qr_image.getvalue()),
            save=False
        )

        # Update document
        document.status = Document.STATUS_READY
        document.generated_at = timezone.now()
        if not document.expires_at:
            # Default expiration: 1 year from generation
            document.expires_at = timezone.now() + timedelta(days=365)
        document.save()

        # Update job
        job.status = DocumentGenerationJob.STATUS_COMPLETED
        job.completed_at = timezone.now()
        job.save()

        logger.info(f"Document generation completed for {document.document_number}")

    except Exception as e:
        logger.error(f"Document generation failed: {str(e)}", exc_info=True)
        
        # Update document status
        try:
            document = Document.objects.get(id=document_id)
            document.status = Document.STATUS_FAILED
            document.save()
        except Document.DoesNotExist:
            pass

        # Update job status
        try:
            job = DocumentGenerationJob.objects.get(id=job_id)
            job.status = DocumentGenerationJob.STATUS_FAILED
            job.error_message = str(e)
            job.completed_at = timezone.now()
            job.save()
        except DocumentGenerationJob.DoesNotExist:
            pass

        raise


def _generate_transcript_pdf(student):
    """Generate transcript PDF (placeholder - implement with ReportLab or similar)."""
    # This is a placeholder - implement actual PDF generation
    # You can reuse logic from transcripts/views.py
    buffer = io.BytesIO()
    buffer.write(b"PDF placeholder for transcript")
    buffer.seek(0)
    return buffer


def _generate_certificate_pdf(student):
    """Generate certificate PDF (placeholder - implement with ReportLab or similar)."""
    # This is a placeholder - implement actual PDF generation
    buffer = io.BytesIO()
    buffer.write(b"PDF placeholder for certificate")
    buffer.seek(0)
    return buffer


def _generate_qr_code(token: str):
    """Generate QR code image for verification token."""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(token)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer
