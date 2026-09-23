from django.db import transaction
from django.db.models import Count, Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, inline_serializer
from rest_framework import serializers as api_serializers
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task
from sims_backend.audit.models import AuditLog
from sims_backend.common_permissions import in_group
from sims_backend.compliance.models import ComplianceActionLog, RequirementInstance, RequirementSubmission
from sims_backend.compliance.views import validate_document_upload
from sims_backend.students.models import LeavePeriod, Student
from sims_backend.students.onboarding import filter_onboarding_state, onboarding_status, synchronize_requirements
from sims_backend.students.serializers import (
    LeavePeriodSerializer,
    OnboardingProfileUpdateSerializer,
    StaffStudentProfileUpdateSerializer,
    StudentPlacementSerializer,
    StudentSerializer,
    StudentStatusSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = (
        Student.objects.select_related("program", "batch", "group", "person", "person__emergency_contact", "user")
        .prefetch_related(
            "leave_periods",
            "person__contact_info",
            "person__addresses",
            Prefetch(
                "compliance_requirements",
                queryset=RequirementInstance.objects.select_related("definition").prefetch_related(
                    "submissions", "definition__scopes"
                ),
            ),
        )
        .all()
    )
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["program", "batch", "group", "status", "reg_no"]
    search_fields = [
        "reg_no",
        "person__first_name",
        "person__middle_name",
        "person__last_name",
        "person__contact_info__value",
    ]
    ordering_fields = ["reg_no", "person__last_name", "person__first_name", "created_at", "enrollment_year"]
    ordering = ["reg_no"]
    required_tasks = ["students.students.view"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            # Unsupported generic writes consistently return 405; do not expose
            # retired create/delete task codes in role administration.
            return [IsAuthenticated()]
        if self.action in {"me", "my_onboarding", "update_my_profile", "submit_onboarding_document"}:
            # Self-service: any authenticated user may fetch their own linked
            # student record. This must not require the broad
            # "students.students.view" task, which is reserved for staff
            # views of other students' records.
            return [IsAuthenticated()]
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["students.students.view"]
        elif self.action == "staff_profile":
            self.required_tasks = ["students.students.manage_profile"]
        elif self.action == "onboarding":
            self.required_tasks = ["students.onboarding.view"]
        elif self.action == "set_status":
            self.required_tasks = ["students.students.manage_status"]
        elif self.action == "placement":
            self.required_tasks = ["students.students.manage_placement"]
        elif self.action == "stats":
            self.required_tasks = ["students.students.view"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view their own record."""
        qs = super().get_queryset()
        user = self.request.user

        # Faculty gradebook selectors expose only students in groups they
        # teach. This precedes the task check so the Faculty fallback never
        # becomes institution-wide student access.
        if in_group(user, "FACULTY") and not in_group(user, "ADMIN"):
            return qs.filter(group__sections__faculty=user).distinct()

        # If user has permission to view all, return all
        if has_permission_task(user, "students.students.view"):
            state = self.request.query_params.get("onboarding_state")
            if state:
                if not has_permission_task(user, "students.onboarding.view"):
                    from rest_framework.exceptions import PermissionDenied

                    raise PermissionDenied("Onboarding review permission is required")
                return filter_onboarding_state(qs, state)
            return qs

        # Otherwise, return only own student record
        if hasattr(user, "student"):
            return qs.filter(id=user.student.id)
        return qs.none()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Get current student's profile."""
        try:
            student = request.user.student
            serializer = self.get_serializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response({"error": "No student record linked to your account"}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request, *args, **kwargs):
        return Response(
            {"error": "Students must be provisioned through the canonical import workflow"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Student records cannot be hard-deleted; deactivate the account instead"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def update(self, request, *args, **kwargs):
        return Response(
            {"error": "Use the explicit profile, placement, or status action"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def _onboarding_payload(self, student):
        # Updates can leave prefetched contacts/requirements and reverse one-to-one
        # caches stale. Return one fresh, consistently prefetched server snapshot.
        student = self.queryset.get(pk=student.pk)
        person = student.person
        contacts = sorted(person.contact_info.all(), key=lambda item: (not item.is_primary, item.id))
        email = next((item for item in contacts if item.type == "email"), None)
        phone = next((item for item in contacts if item.type == "phone"), None)
        address = next(iter(sorted(person.addresses.all(), key=lambda item: (not item.is_primary, item.id))), None)
        emergency = getattr(person, "emergency_contact", None)
        return {
            "student": StudentSerializer(student, context=self.get_serializer_context()).data,
            "profile": {
                "first_name": person.first_name,
                "middle_name": person.middle_name,
                "last_name": person.last_name,
                "date_of_birth": person.date_of_birth,
                "gender": person.gender,
                "email": email.value if email else "",
                "mobile_number": phone.value if phone else "",
                "residential_address": {
                    "street": address.street,
                    "city": address.city,
                    "state": address.state,
                    "postal_code": address.postal_code,
                    "country": address.country,
                }
                if address
                else None,
                "emergency_contact_name": emergency.name if emergency else "",
                "emergency_contact_phone": emergency.phone if emergency else "",
                "emergency_contact_relationship": emergency.relationship if emergency else "",
            },
            "onboarding": onboarding_status(student),
        }

    @extend_schema(responses=OpenApiTypes.OBJECT)
    @action(detail=False, methods=["get"], url_path="me/onboarding")
    def my_onboarding(self, request):
        try:
            return Response(self._onboarding_payload(request.user.student))
        except (AttributeError, Student.DoesNotExist):
            return Response({"error": "No student record linked to your account"}, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(request=OnboardingProfileUpdateSerializer, responses=OpenApiTypes.OBJECT)
    @action(detail=False, methods=["patch"], url_path="me/onboarding/profile")
    @transaction.atomic
    def update_my_profile(self, request):
        try:
            student = request.user.student
        except (AttributeError, Student.DoesNotExist):
            return Response({"error": "No student record linked to your account"}, status=status.HTTP_404_NOT_FOUND)
        serializer = OnboardingProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update_student(student)
        AuditLog.objects.create(
            actor=request.user,
            method="PATCH",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="StudentProfile",
            entity_id=str(student.id),
            summary=f"Student {student.reg_no} updated onboarding profile",
            metadata={"fields": sorted(serializer.validated_data)},
        )
        return Response(self._onboarding_payload(student))

    @extend_schema(
        parameters=[OpenApiParameter("requirement_id", OpenApiTypes.INT, OpenApiParameter.PATH)],
        request=inline_serializer("OnboardingDocumentUpload", fields={"file": api_serializers.FileField()}),
        responses={201: OpenApiTypes.OBJECT},
    )
    @action(
        detail=False,
        methods=["post"],
        url_path=r"me/onboarding/documents/(?P<requirement_id>[^/.]+)/submit",
    )
    @transaction.atomic
    def submit_onboarding_document(self, request, requirement_id=None):
        try:
            instance = RequirementInstance.objects.select_for_update().get(
                id=requirement_id,
                student=request.user.student,
                is_active=True,
                definition__requirement_type="document",
                definition__is_active=True,
            )
        except (AttributeError, RequirementInstance.DoesNotExist):
            return Response({"error": "Requirement not found"}, status=status.HTTP_404_NOT_FOUND)
        if instance.status == RequirementInstance.STATUS_VERIFIED:
            return Response({"error": "A verified document cannot be replaced"}, status=status.HTTP_400_BAD_REQUEST)
        if instance.is_locked:
            return Response({"error": "Requirement is locked. Contact Registrar."}, status=status.HTTP_403_FORBIDDEN)
        upload = request.FILES.get("file")
        if not upload:
            return Response({"error": "A document file is required"}, status=status.HTTP_400_BAD_REQUEST)
        upload_error = validate_document_upload(upload)
        if upload_error:
            return Response({"error": upload_error}, status=status.HTTP_400_BAD_REQUEST)
        RequirementSubmission.objects.create(
            instance=instance,
            file=upload,
            original_filename=upload.name.rsplit("/", 1)[-1][:255],
            submitted_by=request.user,
        )
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save(update_fields=["status", "updated_at"])
        ComplianceActionLog.objects.create(instance=instance, user=request.user, action="SUBMITTED")
        return Response(self._onboarding_payload(request.user.student), status=status.HTTP_201_CREATED)

    @extend_schema(responses=OpenApiTypes.OBJECT)
    @action(detail=True, methods=["get"], url_path="onboarding")
    def onboarding(self, request, pk=None):
        return Response(self._onboarding_payload(self.get_object()))

    @extend_schema(request=StaffStudentProfileUpdateSerializer, responses=OpenApiTypes.OBJECT)
    @action(detail=True, methods=["patch"], url_path="profile")
    @transaction.atomic
    def staff_profile(self, request, pk=None):
        student = self.get_object()
        serializer = StaffStudentProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update_student(student)
        AuditLog.objects.create(
            actor=request.user,
            method="PATCH",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="StudentProfile",
            entity_id=str(student.id),
            summary=f"Corrected profile for student {student.reg_no}",
            metadata={"fields": sorted(serializer.validated_data)},
        )
        return Response(self._onboarding_payload(student))

    @extend_schema(request=StudentStatusSerializer, responses=StudentSerializer)
    @action(detail=True, methods=["patch"], url_path="status")
    @transaction.atomic
    def set_status(self, request, pk=None):
        student = self.get_object()
        serializer = StudentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student.status = serializer.validated_data["status"]
        student.user.is_active = student.status != Student.STATUS_INACTIVE
        student.user.save(update_fields=["is_active"])
        student.save(update_fields=["status", "updated_at"])
        AuditLog.objects.create(
            actor=request.user,
            method="PATCH",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="Student",
            entity_id=str(student.id),
            summary=f"Changed status for student {student.reg_no}",
            metadata={"status": student.status},
        )
        return Response(StudentSerializer(student).data)

    @extend_schema(request=StudentPlacementSerializer, responses=StudentSerializer)
    @action(detail=True, methods=["patch"], url_path="placement")
    @transaction.atomic
    def placement(self, request, pk=None):
        """Update student placement (Program/Batch/Group) - Requires manage_placement permission"""
        student = self.get_object()
        serializer = StudentPlacementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student.program = serializer.validated_data["program"]
        student.batch = serializer.validated_data["batch"]
        student.group = serializer.validated_data.get("group")
        student.save()
        synchronize_requirements(student)
        AuditLog.objects.create(
            actor=request.user,
            method="PATCH",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="Student",
            entity_id=str(student.id),
            summary=f"Updated placement for student {student.reg_no}",
            metadata={
                "program_id": student.program_id,
                "batch_id": student.batch_id,
                "group_id": student.group_id,
            },
        )

        return Response(StudentSerializer(student).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Aggregate student counts by status, computed in the database.

        Avoids paging through the full student list client-side just to
        derive a status breakdown (the default list endpoint returns a
        single page of results).
        """
        queryset = self.get_queryset()
        total = queryset.count()
        by_status = {row["status"]: row["count"] for row in queryset.values("status").annotate(count=Count("id"))}

        return Response(
            {
                "total": total,
                "by_status": by_status,
            },
            status=status.HTTP_200_OK,
        )


class LeavePeriodViewSet(viewsets.ModelViewSet):
    queryset = LeavePeriod.objects.select_related("student", "approved_by").all()
    serializer_class = LeavePeriodSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "type", "status", "start_date", "end_date"]
    search_fields = ["reason"]
    ordering_fields = ["start_date", "end_date"]
    ordering = ["-start_date"]
    required_tasks = ["students.leave_periods.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["students.leave_periods.view"]
        elif self.action == "create":
            self.required_tasks = ["students.leave_periods.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["students.leave_periods.update"]
        elif self.action == "destroy":
            self.required_tasks = ["students.leave_periods.delete"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view their own leave periods."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "students.leave_periods.view"):
            return qs

        # Otherwise, return only own leave periods
        if hasattr(user, "student"):
            return qs.filter(student=user.student)
        return qs.none()
