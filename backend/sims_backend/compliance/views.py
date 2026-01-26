from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import RequirementDefinition, RequirementInstance, RequirementSubmission, ComplianceActionLog
from .serializers import RequirementDefinitionSerializer, RequirementInstanceSerializer
from sims_backend.students.models import Student

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
        if hasattr(user, 'student') and user.student:
            return RequirementInstance.objects.filter(student=user.student)
        return RequirementInstance.objects.none()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        instance = self.get_object()
        
        # Check lock
        if instance.is_locked:
            return Response({"error": "Requirement is locked due to deadline proximity. Contact Registrar."}, status=status.HTTP_403_FORBIDDEN)

        if instance.status in [RequirementInstance.STATUS_VERIFIED]:
             return Response({"error": "Requirement already verified."}, status=status.HTTP_400_BAD_REQUEST)

        # Handle submission
        file = request.FILES.get('file')
        value = request.data.get('value')
        
        if not file and not value:
            return Response({"error": "No file or value provided."}, status=status.HTTP_400_BAD_REQUEST)

        submission = RequirementSubmission.objects.create(
            instance=instance,
            file=file,
            value=value,
            submitted_by=request.user
        )
        
        # Update status to SUBMITTED if it was PENDING or REJECTED
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save()
        
        # Log
        ComplianceActionLog.objects.create(
            instance=instance,
            user=request.user,
            action="SUBMITTED",
            details=f"Submission created ID {submission.id}"
        )

        return Response(RequirementInstanceSerializer(instance).data)

class AdminComplianceViewSet(viewsets.ModelViewSet):
    """
    Viewset for REGISTRAR/ADMIN to manage requirements.
    Should be protected by appropriate permissions (e.g. 'compliance.manage').
    """
    queryset = RequirementInstance.objects.all()
    serializer_class = RequirementInstanceSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        # Basic filtering
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        student_id = self.request.query_params.get('student_id')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def review_queue(self, request):
        queryset = self.queryset.filter(status=RequirementInstance.STATUS_SUBMITTED)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        instance = self.get_object()
        instance.status = RequirementInstance.STATUS_VERIFIED
        instance.completed_at = timezone.now()
        instance.notes = request.data.get('notes', '')
        instance.save()
        
        ComplianceActionLog.objects.create(
            instance=instance,
            user=request.user,
            action="VERIFIED",
            details=instance.notes
        )
        return Response(RequirementInstanceSerializer(instance).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        instance.status = RequirementInstance.STATUS_REJECTED
        instance.notes = request.data.get('notes', '')
        instance.save()
        
        ComplianceActionLog.objects.create(
            instance=instance,
            user=request.user,
            action="REJECTED",
            details=instance.notes
        )
        return Response(RequirementInstanceSerializer(instance).data)

    @action(detail=False, methods=['post'])
    def assign_to_student(self, request):
        # Assign a definition to a student
        student_id = request.data.get('student_id')
        definition_id = request.data.get('definition_id')
        due_at = request.data.get('due_at') # optional
        
        try:
            student = Student.objects.get(id=student_id)
            definition = RequirementDefinition.objects.get(id=definition_id)
            instance, created = RequirementInstance.objects.get_or_create(
                student=student, 
                definition=definition,
            )
            if due_at:
                instance.due_at = due_at
                instance.save()
                
            msg = 'Requirement assigned' if created else 'Requirement already assigned'
                
            ComplianceActionLog.objects.create(
                instance=instance,
                user=request.user,
                action="ASSIGNED",
                details=f"Assigned {definition.title}"
            )
            return Response(RequirementInstanceSerializer(instance).data, status=status.HTTP_201_CREATED)
            
        except (Student.DoesNotExist, RequirementDefinition.DoesNotExist):
            return Response({'error': 'Student or Definition not found'}, status=status.HTTP_404_NOT_FOUND)

class RequirementDefinitionViewSet(viewsets.ModelViewSet):
    queryset = RequirementDefinition.objects.all()
    serializer_class = RequirementDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]
