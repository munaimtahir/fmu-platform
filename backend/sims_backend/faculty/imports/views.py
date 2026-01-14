"""ViewSet for Faculty CSV import API"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdminOrCoordinator
from sims_backend.faculty.imports.models import FacultyImportJob
from sims_backend.faculty.imports.serializers import (
    CommitRequestSerializer,
    CommitResponseSerializer,
    FacultyImportJobSerializer,
    PreviewRequestSerializer,
    PreviewResponseSerializer,
)
from sims_backend.faculty.imports.services import FacultyImportService
from sims_backend.faculty.imports.templates import generate_csv_template


class FacultyImportViewSet(viewsets.ViewSet):
    """
    ViewSet for Faculty CSV import operations.
    Requires Admin or Coordinator permissions.
    """
    permission_classes = [IsAuthenticated, IsAdminOrCoordinator]

    @action(detail=False, methods=['post'], url_path='preview')
    def preview(self, request):
        """
        Phase 1: Upload CSV file and get validation preview.
        No database writes (except FacultyImportJob creation).
        """
        serializer = PreviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        mode = serializer.validated_data.get('mode', FacultyImportJob.MODE_CREATE_ONLY)
        
        try:
            result = FacultyImportService.preview(file, request.user, mode)
            response_serializer = PreviewResponseSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='commit')
    def commit(self, request):
        """
        Phase 2: Commit validated rows to database.
        Requires import_job_id and confirm=true.
        """
        serializer = CommitRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        import_job_id = serializer.validated_data['import_job_id']
        confirm = serializer.validated_data.get('confirm', False)
        
        if not confirm:
            return Response(
                {"error": "confirm must be True to commit import"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = FacultyImportService.commit(str(import_job_id), request.user)
            response_serializer = CommitResponseSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='template')
    def template(self, request):
        """
        Download CSV template with headers and example row.
        """
        csv_content = generate_csv_template()
        
        from django.http import HttpResponse
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="faculty_import_template.csv"'
        return response

    @action(detail=False, methods=['get'], url_path='jobs')
    def jobs(self, request):
        """
        List all import jobs (history).
        """
        jobs = FacultyImportJob.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = FacultyImportJobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='detail')
    def job_detail(self, request, pk=None):
        """
        Get details of a specific import job.
        """
        try:
            job = FacultyImportJob.objects.get(id=pk, created_by=request.user)
        except FacultyImportJob.DoesNotExist:
            return Response(
                {"error": "FacultyImportJob not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = FacultyImportJobSerializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='errors.csv')
    def errors_csv(self, request, pk=None):
        """
        Download error CSV for invalid rows.
        """
        try:
            job = FacultyImportJob.objects.get(id=pk, created_by=request.user)
        except FacultyImportJob.DoesNotExist:
            return Response(
                {"error": "FacultyImportJob not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not job.error_report_file:
            return Response(
                {"error": "No error report available for this job"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from django.http import HttpResponse
        response = HttpResponse(
            job.error_report_file.read(),
            content_type='text/csv'
        )
        response['Content-Disposition'] = f'attachment; filename="errors_{job.id}.csv"'
        return response
