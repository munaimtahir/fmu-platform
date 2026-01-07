import io
import secrets
from datetime import timedelta

import qrcode
from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import FileResponse, Http404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import PermissionTaskRequired, has_permission_task

from .models import Document, DocumentGenerationJob, DocumentType
from .serializers import (
    DocumentGenerationJobSerializer,
    DocumentListSerializer,
    DocumentSerializer,
    DocumentTypeSerializer,
    DocumentVerificationSerializer,
)
from .tasks import generate_document_async

# Token expires after 48 hours
TOKEN_MAX_AGE = 48 * 60 * 60
signer = TimestampSigner()


class DocumentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for document types."""
    queryset = DocumentType.objects.filter(is_active=True)
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["documents.types.view"]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["code", "name"]
    ordering_fields = ["name", "code"]
    ordering = ["name"]


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.select_related("student", "type", "requested_by").all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "type", "status"]
    search_fields = ["document_number", "student__reg_no", "student__name"]
    ordering_fields = ["requested_at", "generated_at", "document_number"]
    ordering = ["-requested_at"]
    required_tasks = ["documents.documents.view"]

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        return DocumentSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "status", "download"]:
            self.required_tasks = ["documents.documents.view"]
        elif self.action == "create":
            self.required_tasks = ["documents.documents.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["documents.documents.update"]
        elif self.action == "destroy":
            self.required_tasks = ["documents.documents.delete"]
        elif self.action == "generate":
            self.required_tasks = ["documents.documents.generate"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view own documents."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "documents.documents.view"):
            return qs

        # Otherwise, return only own documents
        if hasattr(user, "student"):
            return qs.filter(student=user.student)
        return qs.none()

    def perform_create(self, serializer):
        """Set requested_by to current user."""
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="generate")
    def generate(self, request, pk=None):
        """Queue async document generation."""
        document = self.get_object()

        if document.status == Document.STATUS_READY:
            return Response(
                {"error": {"code": "ALREADY_GENERATED", "message": "Document is already generated"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if document.status == Document.STATUS_GENERATING:
            return Response(
                {"error": {"code": "ALREADY_GENERATING", "message": "Document generation is already in progress"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status to generating
        document.status = Document.STATUS_GENERATING
        document.save()

        # Create generation job
        job = DocumentGenerationJob.objects.create(
            document=document,
            status=DocumentGenerationJob.STATUS_QUEUED
        )

        # Queue async task
        try:
            generate_document_async.delay(document.id, job.id)
            return Response(
                {
                    "message": "Document generation queued",
                    "job_id": job.id,
                    "document_id": document.id,
                },
                status=status.HTTP_202_ACCEPTED
            )
        except Exception as e:
            document.status = Document.STATUS_FAILED
            document.save()
            job.status = DocumentGenerationJob.STATUS_FAILED
            job.error_message = str(e)
            job.save()
            return Response(
                {"error": {"code": "QUEUE_FAILED", "message": f"Failed to queue generation: {str(e)}"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        """Download generated document."""
        document = self.get_object()

        if document.status != Document.STATUS_READY:
            return Response(
                {"error": {"code": "NOT_READY", "message": f"Document is not ready (status: {document.status})"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not document.file:
            return Response(
                {"error": {"code": "NO_FILE", "message": "Document file not found"}},
                status=status.HTTP_404_NOT_FOUND
            )

        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=f"{document.type.code}_{document.document_number}.pdf",
            content_type="application/pdf"
        )

    @action(detail=True, methods=["get"], url_path="status")
    def status(self, request, pk=None):
        """Check document generation status."""
        document = self.get_object()
        latest_job = document.generation_jobs.first()

        response_data = {
            "document_id": document.id,
            "document_number": document.document_number,
            "status": document.status,
            "generated_at": document.generated_at,
        }

        if latest_job:
            response_data["job"] = {
                "id": latest_job.id,
                "status": latest_job.status,
                "started_at": latest_job.started_at,
                "completed_at": latest_job.completed_at,
                "error_message": latest_job.error_message,
            }

        return Response(response_data)


class DocumentVerificationView(APIView):
    """Public endpoint for document verification (no authentication required)."""
    permission_classes = [AllowAny]

    def get(self, request, token):
        """Verify a document token and return document info."""
        try:
            # Verify token signature and expiration
            value = signer.unsign(token, max_age=TOKEN_MAX_AGE)

            # Extract document ID from token
            if not value.startswith("doc_"):
                return Response(
                    {"valid": False, "reason": "Invalid token format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            document_id = int(value.split("_")[1])
            document = Document.objects.select_related("student", "type").get(
                id=document_id,
                verification_token=token,
                status=Document.STATUS_READY
            )

            # Check if document has expired
            if document.expires_at and document.expires_at < timezone.now():
                return Response(
                    {"valid": False, "reason": "Document has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = DocumentVerificationSerializer({
                "valid": True,
                "document_number": document.document_number,
                "type_name": document.type.name,
                "student_reg_no": document.student.reg_no,
                "student_name": document.student.name,
                "generated_at": document.generated_at,
            })
            return Response(serializer.data)

        except SignatureExpired:
            return Response(
                {"valid": False, "reason": "Token has expired (> 48 hours)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except BadSignature:
            return Response(
                {"valid": False, "reason": "Token signature is invalid (tampered)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except (ValueError, IndexError):
            return Response(
                {"valid": False, "reason": "Invalid token format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Document.DoesNotExist:
            return Response(
                {"valid": False, "reason": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class DocumentGenerationJobViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for generation jobs."""
    queryset = DocumentGenerationJob.objects.select_related("document").all()
    serializer_class = DocumentGenerationJobSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["documents.jobs.view"]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["document", "status"]
    ordering_fields = ["created_at", "started_at", "completed_at"]
    ordering = ["-created_at"]
