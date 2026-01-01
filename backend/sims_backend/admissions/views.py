import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .models import Student, StudentApplication, ApplicationDraft
from .permissions import IsAdminOrRegistrarOrReadOwnStudent, _in_group
from .serializers import (
    ApplicationDraftLoadSerializer,
    ApplicationDraftSaveSerializer,
    ApplicationDraftSerializer,
    StudentApplicationPublicSerializer,
    StudentApplicationSerializer,
    StudentSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarOrReadOwnStudent]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["program", "status", "batch_year", "current_year"]
    search_fields = ["reg_no", "name", "email", "phone", "program__name"]
    ordering_fields = ["id", "reg_no", "name", "batch_year", "current_year", "status"]
    ordering = ["reg_no"]
    queryset = Student.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _in_group(user, "Student") and not (
            user.is_superuser
            or _in_group(user, "Admin")
            or _in_group(user, "Registrar")
        ):
            return qs.filter(reg_no=getattr(user, "username", ""))
        return qs


class StudentApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student applications"""

    queryset = StudentApplication.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "program", "batch_year"]
    search_fields = ["full_name", "email", "phone"]
    ordering_fields = ["id", "full_name", "created_at", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Use public serializer for create, full serializer for other actions"""
        if self.action == "create" and not self.request.user.is_authenticated:
            return StudentApplicationPublicSerializer
        return StudentApplicationSerializer

    def get_permissions(self):
        """Allow public submission, require auth for admin actions"""
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        qs = super().get_queryset()
        user = self.request.user

        # Public users can only create, not list
        if not user.is_authenticated:
            return StudentApplication.objects.none()

        # Admins and Registrars can see all
        if user.is_superuser or _in_group(user, "Admin") or _in_group(user, "Registrar"):
            return qs

        # Others see nothing
        return StudentApplication.objects.none()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a student application and create a Student record"""
        application = self.get_object()

        if application.status != StudentApplication.STATUS_PENDING:
            return Response(
                {"error": "Only pending applications can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            student = application.approve(request.user)
            serializer = StudentApplicationSerializer(application)
            return Response(
                {
                    "message": "Application approved successfully",
                    "application": serializer.data,
                    "student": StudentSerializer(student).data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a student application"""
        application = self.get_object()

        if application.status != StudentApplication.STATUS_PENDING:
            return Response(
                {"error": "Only pending applications can be rejected"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        try:
            application.reject(request.user, reason)
            serializer = StudentApplicationSerializer(application)
            return Response(
                {
                    "message": "Application rejected",
                    "application": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ApplicationDraftThrottle(AnonRateThrottle):
    """Rate limiting for draft operations - 10 requests per minute"""
    rate = '10/min'


class ApplicationDraftViewSet(viewsets.ViewSet):
    """ViewSet for managing application drafts (public, no auth required)"""
    
    permission_classes = [AllowAny]
    throttle_classes = [ApplicationDraftThrottle]
    
    @action(detail=False, methods=["post"], url_path="save")
    def save_draft(self, request):
        """
        Save a draft application.
        Requires email and form_data in request.
        Handles file uploads if present.
        Overwrites existing DRAFT for that email.
        """
        # Validate email is present
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required to save a draft"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        email = email.strip().lower()
        
        # Get or create draft
        draft, created = ApplicationDraft.objects.get_or_create(
            email=email,
            status=ApplicationDraft.STATUS_DRAFT,
            defaults={"form_data": {}, "uploaded_files": {}}
        )
        
        # Check if draft can be edited
        if not draft.can_edit():
            return Response(
                {"error": "This draft has been submitted and cannot be edited"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Extract form data (all fields except files)
        form_data = {}
        file_fields = [
            'father_id_card', 'guardian_id_card', 'domicile',
            'ssc_certificate', 'hssc_certificate', 'mdcat_result'
        ]
        
        # Collect all non-file fields
        for key, value in request.data.items():
            if key not in file_fields and key != 'email':
                form_data[key] = value
        
        # Handle file uploads
        uploaded_files = draft.uploaded_files.copy() if draft.uploaded_files else {}
        
        for field_name in file_fields:
            if field_name in request.FILES:
                file = request.FILES[field_name]
                
                # Validate file size (3MB max)
                if file.size > 3 * 1024 * 1024:
                    return Response(
                        {"error": f"{field_name} must be less than 3MB"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                
                # Validate file extension
                ext = os.path.splitext(file.name)[1].lower().lstrip('.')
                if ext not in ['pdf', 'jpg', 'jpeg', 'png']:
                    return Response(
                        {"error": f"{field_name} must be PDF, JPG, or PNG format"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                
                # Delete old file if exists
                if field_name in uploaded_files and uploaded_files[field_name].get('path'):
                    old_path = uploaded_files[field_name]['path']
                    if default_storage.exists(old_path):
                        default_storage.delete(old_path)
                
                # Save new file
                upload_path = f"application_drafts/{draft.id}/{field_name}/{file.name}"
                saved_path = default_storage.save(upload_path, ContentFile(file.read()))
                
                uploaded_files[field_name] = {
                    'name': file.name,
                    'path': saved_path,
                    'size': file.size,
                    'content_type': file.content_type,
                }
        
        # Update draft
        draft.form_data = form_data
        draft.uploaded_files = uploaded_files
        draft.save()
        
        serializer = ApplicationDraftSerializer(draft)
        return Response(
            {
                "message": "Draft saved successfully",
                "draft": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    
    @action(detail=False, methods=["post"], url_path="load")
    def load_draft(self, request):
        """
        Load a draft by email.
        Returns draft data if found, error if not found or already submitted.
        """
        serializer = ApplicationDraftLoadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        draft = ApplicationDraft.get_draft_for_email(email)
        
        if not draft:
            return Response(
                {"error": "No saved application found for this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Build response with form data and file URLs
        response_data = {
            "message": "Draft loaded",
            "draft": ApplicationDraftSerializer(draft).data,
        }
        
        # Add file URLs for frontend
        file_urls = {}
        for field_name, file_info in draft.uploaded_files.items():
            if file_info.get('path'):
                file_urls[field_name] = default_storage.url(file_info['path'])
        response_data['file_urls'] = file_urls
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["post"], url_path="submit")
    def submit_draft(self, request):
        """
        Submit a draft as final application.
        Validates all required fields and documents are present.
        Changes status to SUBMITTED and creates StudentApplication record.
        """
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        email = email.strip().lower()
        draft = ApplicationDraft.get_draft_for_email(email)
        
        if not draft:
            return Response(
                {"error": "No draft found for this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if not draft.can_edit():
            return Response(
                {"error": "This draft has already been submitted"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Validate required fields
        form_data = draft.form_data
        required_fields = [
            'first_name', 'last_name', 'father_name', 'gender', 'date_of_birth',
            'cnic', 'email', 'phone', 'address_city', 'address_district',
            'address_state', 'address_country', 'guardian_name', 'guardian_relation',
            'guardian_phone', 'guardian_email', 'guardian_mailing_address',
            'mdcat_roll_number', 'merit_number', 'merit_percentage',
            'hssc_year', 'hssc_board', 'hssc_marks', 'hssc_percentage',
            'ssc_year', 'ssc_board', 'ssc_marks', 'ssc_percentage', 'batch_year'
        ]
        
        missing_fields = [field for field in required_fields if not form_data.get(field)]
        if missing_fields:
            return Response(
                {
                    "error": "Please complete all required fields",
                    "missing_fields": missing_fields,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Validate required documents
        required_docs = ['father_id_card', 'domicile', 'ssc_certificate', 'hssc_certificate', 'mdcat_result']
        uploaded_files = draft.uploaded_files or {}
        
        missing_docs = [doc for doc in required_docs if doc not in uploaded_files or not uploaded_files[doc].get('path')]
        
        # Check guardian_id_card if guardian is not father
        if form_data.get('guardian_relation') != 'FATHER':
            if 'guardian_id_card' not in uploaded_files or not uploaded_files['guardian_id_card'].get('path'):
                missing_docs.append('guardian_id_card')
        
        if missing_docs:
            return Response(
                {
                    "error": "Please upload all required documents",
                    "missing_documents": missing_docs,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Create StudentApplication from draft
        try:
            # Prepare data for StudentApplication
            application_data = form_data.copy()
            
            # Handle file fields - copy files from draft storage to application storage
            file_fields_map = {
                'father_id_card': 'father_id_card',
                'guardian_id_card': 'guardian_id_card',
                'domicile': 'domicile',
                'ssc_certificate': 'ssc_certificate',
                'hssc_certificate': 'hssc_certificate',
                'mdcat_result': 'mdcat_result',
            }
            
            from django.core.files import File as DjangoFile
            
            for draft_field, app_field in file_fields_map.items():
                if draft_field in uploaded_files and uploaded_files[draft_field].get('path'):
                    file_path = uploaded_files[draft_field]['path']
                    if default_storage.exists(file_path):
                        # Read the file and create a Django File object
                        file_name = uploaded_files[draft_field].get('name', f'{draft_field}.pdf')
                        with default_storage.open(file_path, 'rb') as f:
                            file_content = f.read()
                            django_file = DjangoFile(ContentFile(file_content), name=file_name)
                            application_data[app_field] = django_file
            
            # Create StudentApplication using the public serializer
            app_serializer = StudentApplicationPublicSerializer(data=application_data)
            if not app_serializer.is_valid():
                return Response(
                    {
                        "error": "Validation failed",
                        "details": app_serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            application = app_serializer.save()
            
            # Mark draft as submitted
            draft.status = ApplicationDraft.STATUS_SUBMITTED
            draft.submitted_at = timezone.now()
            draft.save()
            
            return Response(
                {
                    "message": "Application submitted successfully",
                    "application_id": application.id,
                    "draft_id": str(draft.id),
                },
                status=status.HTTP_201_CREATED,
            )
            
        except Exception as e:
            return Response(
                {"error": f"Failed to submit application: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
