"""ViewSet for Student CSV import API"""

from django.core.exceptions import ValidationError
from drf_spectacular.utils import OpenApiTypes, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.throttling import SensitiveActionThrottle
from core.permissions import PermissionTaskRequired
from sims_backend.students.imports.models import ImportJob
from sims_backend.students.imports.serializers import (
    CommitRequestSerializer,
    CommitResponseSerializer,
    ImportJobSerializer,
    PreviewRequestSerializer,
    PreviewResponseSerializer,
)
from sims_backend.students.imports.services import StudentImportService
from sims_backend.students.imports.templates import generate_csv_template


@extend_schema_view(
    preview=extend_schema(request=PreviewRequestSerializer, responses=PreviewResponseSerializer),
    commit=extend_schema(request=CommitRequestSerializer, responses=CommitResponseSerializer),
    template=extend_schema(responses=OpenApiTypes.BINARY),
    jobs=extend_schema(responses=ImportJobSerializer(many=True)),
    job_detail=extend_schema(responses=ImportJobSerializer),
    errors_csv=extend_schema(responses=OpenApiTypes.BINARY),
)
class StudentImportViewSet(viewsets.ViewSet):
    """
    ViewSet for Student CSV import operations.
    Requires Admin or Coordinator permissions.
    """

    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["students.imports.view"]
    queryset = ImportJob.objects.none()

    def get_permissions(self):
        self.required_tasks = [
            "students.imports.execute" if self.action in {"preview", "commit"} else "students.imports.view"
        ]
        return super().get_permissions()

    def get_throttles(self):
        if self.action in {"preview", "commit"}:
            return [SensitiveActionThrottle()]
        return super().get_throttles()

    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request):
        """
        Phase 1: Upload CSV file and get validation preview.
        No database writes (except ImportJob creation).
        """
        serializer = PreviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        try:
            result = StudentImportService.preview(file, request.user)
            response_serializer = PreviewResponseSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except (ValueError, ValidationError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Import preview failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"], url_path="commit")
    def commit(self, request):
        """
        Phase 2: Commit validated rows to database.
        Requires import_job_id and confirm=true.
        """
        serializer = CommitRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        import_job_id = serializer.validated_data["import_job_id"]
        confirm = serializer.validated_data.get("confirm", False)
        file = serializer.validated_data["file"]

        if not confirm:
            return Response({"error": "confirm must be True to commit import"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = StudentImportService.commit(str(import_job_id), file, request.user)
            response_serializer = CommitResponseSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except (ValueError, ValidationError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Import commit failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["get"], url_path="template")
    def template(self, request):
        """
        Download CSV template with headers and example row.
        """
        csv_content = generate_csv_template()

        from django.http import HttpResponse

        response = HttpResponse(csv_content, content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="students_import_template.csv"'
        return response

    @action(detail=False, methods=["get"], url_path="jobs")
    def jobs(self, request):
        """
        List all import jobs (history).
        """
        jobs = ImportJob.objects.filter(created_by=request.user).order_by("-created_at")
        serializer = ImportJobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="detail")
    def job_detail(self, request, pk=None):
        """
        Get details of a specific import job.
        """
        try:
            job = ImportJob.objects.get(id=pk, created_by=request.user)
        except ImportJob.DoesNotExist:
            return Response({"error": "ImportJob not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ImportJobSerializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="errors.csv")
    def errors_csv(self, request, pk=None):
        """
        Download error CSV for invalid rows.
        """
        try:
            job = ImportJob.objects.get(id=pk, created_by=request.user)
        except ImportJob.DoesNotExist:
            return Response({"error": "ImportJob not found"}, status=status.HTTP_404_NOT_FOUND)

        if not job.error_report_file:
            return Response({"error": "No error report available for this job"}, status=status.HTTP_404_NOT_FOUND)

        from django.http import HttpResponse

        response = HttpResponse(job.error_report_file.read(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="errors_{job.id}.csv"'
        return response
