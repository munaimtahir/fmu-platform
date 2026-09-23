from pathlib import Path

from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired
from sims_backend.students.models import Student

from .models import (
    ComplianceActionLog,
    RequirementDefinition,
    RequirementInstance,
    RequirementScope,
    RequirementSubmission,
)
from .serializers import RequirementDefinitionSerializer, RequirementInstanceSerializer, RequirementScopeSerializer

ALLOWED_DOCUMENT_TYPES = {
    ".pdf": {"application/pdf"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
}


def validate_document_upload(upload):
    if upload.size > 10 * 1024 * 1024:
        return "Document must be 10 MB or smaller"
    suffix = Path(upload.name).suffix.lower()
    if suffix not in ALLOWED_DOCUMENT_TYPES or upload.content_type not in ALLOWED_DOCUMENT_TYPES[suffix]:
        return "Only PDF, JPEG, and PNG documents are allowed"
    header = upload.read(8)
    upload.seek(0)
    signatures = {
        ".pdf": (b"%PDF-",),
        ".jpg": (b"\xff\xd8\xff",),
        ".jpeg": (b"\xff\xd8\xff",),
        ".png": (b"\x89PNG\r\n\x1a\n",),
    }
    if not any(header.startswith(signature) for signature in signatures[suffix]):
        return "Document content does not match its file type"
    return None


def submission_download(submission):
    if not submission.file:
        return Response({"error": "Submission has no file"}, status=status.HTTP_404_NOT_FOUND)
    response = FileResponse(
        submission.file.open("rb"),
        as_attachment=True,
        filename=submission.original_filename or submission.file.name.rsplit("/", 1)[-1],
    )
    response["Cache-Control"] = "private, no-store"
    return response


class StudentComplianceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for STUDENTS to view their requirements and submit them.
    Restricted to the logged-in student's records.
    """

    serializer_class = RequirementInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # If user is admin/staff, maybe return none or all?
        # But this view is specifically "Student Compliance", so let's target the student profile.
        if hasattr(user, "student") and user.student:
            return RequirementInstance.objects.filter(student=user.student, is_active=True)
        return RequirementInstance.objects.none()

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def submit(self, request, pk=None):
        instance = self.get_object()
        instance = RequirementInstance.objects.select_for_update().get(pk=instance.pk)
        if not instance.definition.is_active:
            return Response({"error": "Requirement is archived"}, status=status.HTTP_400_BAD_REQUEST)

        # Check lock
        if instance.is_locked:
            return Response(
                {"error": "Requirement is locked due to deadline proximity. Contact Registrar."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if instance.status in [RequirementInstance.STATUS_VERIFIED]:
            return Response({"error": "Requirement already verified."}, status=status.HTTP_400_BAD_REQUEST)

        # Handle submission
        file = request.FILES.get("file")
        value = request.data.get("value") or ""

        if not file and not value:
            return Response({"error": "No file or value provided."}, status=status.HTTP_400_BAD_REQUEST)
        if instance.definition.requirement_type == "document" and not file:
            return Response({"error": "A document file is required"}, status=status.HTTP_400_BAD_REQUEST)
        if file and (upload_error := validate_document_upload(file)):
            return Response({"error": upload_error}, status=status.HTTP_400_BAD_REQUEST)

        submission = RequirementSubmission.objects.create(
            instance=instance,
            file=file,
            original_filename=Path(file.name).name[:255] if file else "",
            value=value,
            submitted_by=request.user,
        )

        # Update status to SUBMITTED if it was PENDING or REJECTED
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save()

        # Log
        ComplianceActionLog.objects.create(
            instance=instance, user=request.user, action="SUBMITTED", details=f"Submission created ID {submission.id}"
        )

        return Response(RequirementInstanceSerializer(instance).data)

    @extend_schema(
        parameters=[OpenApiParameter("submission_id", OpenApiTypes.INT, OpenApiParameter.PATH)],
        responses=OpenApiTypes.BINARY,
    )
    @action(detail=True, methods=["get"], url_path=r"submissions/(?P<submission_id>[^/.]+)/download")
    def download_submission(self, request, pk=None, submission_id=None):
        instance = self.get_object()
        submission = instance.submissions.filter(pk=submission_id).first()
        if submission is None:
            return Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)
        return submission_download(submission)


class AdminComplianceViewSet(viewsets.ModelViewSet):
    """Viewset for REGISTRAR/ADMIN to review, verify, reject and assign requirements."""

    queryset = RequirementInstance.objects.select_related("definition").prefetch_related("submissions").order_by("id")
    serializer_class = RequirementInstanceSerializer
    permission_classes = [permissions.IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["compliance.requirements.view"]

    def create(self, request, *args, **kwargs):
        return Response({"error": "Use assign_to_student to assign requirements"}, status=405)

    def update(self, request, *args, **kwargs):
        return Response({"error": "Use the dedicated review actions"}, status=405)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Requirement history cannot be deleted; archive its onboarding rule instead"}, status=405
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve", "review_queue", "download_submission"]:
            self.required_tasks = ["compliance.requirements.view"]
        elif self.action == "assign_to_student":
            self.required_tasks = ["compliance.requirements.assign"]
        elif self.action in ["verify", "reject"]:
            self.required_tasks = ["compliance.requirements.review"]
        elif self.action == "create":
            self.required_tasks = ["compliance.requirements.assign"]
        elif self.action in ["update", "partial_update", "destroy"]:
            self.required_tasks = ["compliance.requirements.manage"]
        return super().get_permissions()

    def get_queryset(self):
        # Basic filtering
        queryset = super().get_queryset()
        status_param = self.request.query_params.get("status")
        student_id = self.request.query_params.get("student_id")

        if status_param:
            queryset = queryset.filter(status=status_param)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset

    @extend_schema(
        parameters=[OpenApiParameter("submission_id", OpenApiTypes.INT, OpenApiParameter.PATH)],
        responses=OpenApiTypes.BINARY,
    )
    @action(detail=True, methods=["get"], url_path=r"submissions/(?P<submission_id>[^/.]+)/download")
    def download_submission(self, request, pk=None, submission_id=None):
        instance = self.get_object()
        submission = instance.submissions.filter(pk=submission_id).first()
        if submission is None:
            return Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)
        return submission_download(submission)

    @action(detail=False, methods=["get"])
    def review_queue(self, request):
        queryset = self.queryset.filter(status=RequirementInstance.STATUS_SUBMITTED)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def verify(self, request, pk=None):
        instance = self.get_object()
        instance = RequirementInstance.objects.select_for_update().get(pk=instance.pk)
        if instance.status != RequirementInstance.STATUS_SUBMITTED:
            return Response(
                {"error": "Only submitted requirements can be reviewed"}, status=status.HTTP_400_BAD_REQUEST
            )
        instance.status = RequirementInstance.STATUS_VERIFIED
        instance.completed_at = timezone.now()
        instance.notes = request.data.get("notes", "")
        instance.save()

        ComplianceActionLog.objects.create(
            instance=instance, user=request.user, action="VERIFIED", details=instance.notes
        )
        return Response(RequirementInstanceSerializer(instance).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def reject(self, request, pk=None):
        instance = self.get_object()
        instance = RequirementInstance.objects.select_for_update().get(pk=instance.pk)
        if instance.status != RequirementInstance.STATUS_SUBMITTED:
            return Response(
                {"error": "Only submitted requirements can be reviewed"}, status=status.HTTP_400_BAD_REQUEST
            )
        instance.status = RequirementInstance.STATUS_REJECTED
        instance.completed_at = None
        instance.notes = request.data.get("notes", "")
        instance.save()

        ComplianceActionLog.objects.create(
            instance=instance, user=request.user, action="REJECTED", details=instance.notes
        )
        return Response(RequirementInstanceSerializer(instance).data)

    @action(detail=False, methods=["post"])
    def assign_to_student(self, request):
        # Assign a definition to a student
        student_id = request.data.get("student_id")
        definition_id = request.data.get("definition_id")
        due_at = request.data.get("due_at")  # optional

        try:
            student = Student.objects.get(id=student_id)
            definition = RequirementDefinition.objects.get(id=definition_id)
            instance, created = RequirementInstance.objects.get_or_create(
                student=student,
                definition=definition,
                defaults={"assignment_source": RequirementInstance.SOURCE_MANUAL},
            )
            if due_at:
                parsed_due_at = parse_datetime(str(due_at))
                if parsed_due_at is None:
                    return Response({"error": "Invalid due_at"}, status=status.HTTP_400_BAD_REQUEST)
                if timezone.is_naive(parsed_due_at):
                    parsed_due_at = timezone.make_aware(parsed_due_at)
                instance.due_at = parsed_due_at
                instance.save()

            ComplianceActionLog.objects.create(
                instance=instance, user=request.user, action="ASSIGNED", details=f"Assigned {definition.title}"
            )
            return Response(RequirementInstanceSerializer(instance).data, status=status.HTTP_201_CREATED)

        except (Student.DoesNotExist, RequirementDefinition.DoesNotExist):
            return Response({"error": "Student or Definition not found"}, status=status.HTTP_404_NOT_FOUND)


class RequirementDefinitionViewSet(viewsets.ModelViewSet):
    queryset = RequirementDefinition.objects.all()
    serializer_class = RequirementDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["compliance.definitions.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["compliance.definitions.view"]
        elif self.action == "create":
            self.required_tasks = ["compliance.definitions.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["compliance.definitions.update"]
        elif self.action == "destroy":
            self.required_tasks = ["compliance.definitions.delete"]
        return super().get_permissions()

    def perform_update(self, serializer):
        with transaction.atomic():
            definition = serializer.save()
            self._resynchronize_students(definition)

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance.is_active = False
            instance.save(update_fields=["is_active", "updated_at"])
            self._resynchronize_students(instance)

    @staticmethod
    def _resynchronize_students(definition):
        from sims_backend.students.onboarding import synchronize_requirements

        scopes = list(definition.scopes.all())
        affected = Q(compliance_requirements__definition=definition)
        for scope in scopes:
            if scope.scope_type == "global":
                affected = Q()
                break
            affected |= Q(program_id=scope.program_id) if scope.scope_type == "program" else Q(batch_id=scope.batch_id)
        for student in Student.objects.filter(affected).select_related("program", "batch").distinct().iterator():
            synchronize_requirements(student)


class RequirementScopeViewSet(viewsets.ModelViewSet):
    queryset = RequirementScope.objects.select_related("definition", "program", "batch").order_by("id")
    serializer_class = RequirementScopeSerializer
    permission_classes = [permissions.IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["compliance.definitions.view"]
    filterset_fields = ["definition", "scope_type", "program", "batch", "is_active"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["compliance.definitions.view"]
        elif self.action == "create":
            self.required_tasks = ["compliance.definitions.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["compliance.definitions.update"]
        elif self.action == "destroy":
            self.required_tasks = ["compliance.definitions.delete"]
        return super().get_permissions()

    def perform_create(self, serializer):
        with transaction.atomic():
            instance = serializer.save()
            RequirementDefinitionViewSet._resynchronize_students(instance.definition)

    def perform_update(self, serializer):
        with transaction.atomic():
            previous = serializer.instance.definition
            instance = serializer.save()
            RequirementDefinitionViewSet._resynchronize_students(previous)
            if previous.pk != instance.definition_id:
                RequirementDefinitionViewSet._resynchronize_students(instance.definition)

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance.is_active = False
            instance.save(update_fields=["is_active", "updated_at"])
            RequirementDefinitionViewSet._resynchronize_students(instance.definition)
