from datetime import timedelta

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired
from sims_backend.common_permissions import in_group
from sims_backend.timetable.models import Session, TimetableCell, TimetableEntry, WeeklyTimetable
from sims_backend.timetable.serializers import (
    SessionSerializer,
    TimetableCellSerializer,
    TimetableEntrySerializer,
    WeeklyTimetableListSerializer,
    WeeklyTimetableSerializer,
)


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related("academic_period", "group", "faculty", "department").all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["academic_period", "group", "faculty", "department"]
    search_fields = ["department__name", "group__name"]
    ordering_fields = ["starts_at", "ends_at"]
    ordering = ["starts_at"]
    required_tasks = ["timetable.sessions.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["timetable.sessions.view"]
        elif self.action == "create":
            self.required_tasks = ["timetable.sessions.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["timetable.sessions.update"]
        elif self.action == "destroy":
            self.required_tasks = ["timetable.sessions.delete"]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Faculty can see their own sessions
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            queryset = queryset.filter(faculty=user)

        return queryset


class WeeklyTimetableViewSet(viewsets.ModelViewSet):
    queryset = (
        WeeklyTimetable.objects.select_related("academic_period", "batch", "batch__program", "created_by")
        .prefetch_related("cells", "entries__section__course", "entries__section__faculty", "entries__group")
        .all()
    )
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["academic_period", "batch", "status", "week_start_date"]
    ordering_fields = ["week_start_date", "created_at"]
    ordering = ["-week_start_date"]
    required_tasks = ["timetable.weekly.view"]

    def get_serializer_class(self):
        """Use detailed serializer for retrieve, list serializer for list"""
        if self.action == "list":
            return WeeklyTimetableListSerializer
        return WeeklyTimetableSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see published timetables
        if in_group(user, "STUDENT") and not (in_group(user, "ADMIN") or in_group(user, "FACULTY")):
            queryset = queryset.filter(status="published")

        # Faculty can see their own timetables or all published ones
        elif in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            queryset = queryset.filter(Q(created_by=user) | Q(status="published"))

        return queryset

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["timetable.weekly.view"]
        elif self.action == "create":
            self.required_tasks = ["timetable.weekly.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["timetable.weekly.update"]
        elif self.action == "destroy":
            self.required_tasks = ["timetable.weekly.delete"]
        elif self.action in ["publish", "unpublish", "generate_weekly_templates"]:
            self.required_tasks = ["timetable.weekly.manage"]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish a draft timetable - requires exactly 3 periods per day"""

        timetable = self.get_object()

        if timetable.status == "published":
            return Response({"detail": "Timetable is already published"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify user has permission (faculty can only publish their own, admin/coordinator can publish any)
        user = request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if timetable.created_by != user:
                return Response(
                    {"detail": "You can only publish your own timetables"}, status=status.HTTP_403_FORBIDDEN
                )

        # VALIDATION: Check that we have exactly 3 scheduled periods per day.
        # Sourced from TimetableEntry (the normalized model) rather than the
        # legacy TimetableCell grid; CANCELLED entries don't count toward
        # the period total.
        entries = list(timetable.entries.exclude(status="CANCELLED"))

        # Group entries by day and count periods
        day_period_counts = {}
        for day in range(6):  # Monday to Saturday (0-5)
            day_period_counts[day] = sum(1 for entry in entries if entry.day_of_week == day)

        # Check that each day has exactly 3 periods
        days_with_wrong_count = []
        for day, count in day_period_counts.items():
            if count != 3:
                day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
                days_with_wrong_count.append(f"{day_name} ({count} periods)")

        if days_with_wrong_count:
            return Response(
                {
                    "error": {
                        "code": "INVALID_PERIOD_COUNT",
                        "message": f"Each day must have exactly 3 periods. Found: {', '.join(days_with_wrong_count)}",
                        "days_with_wrong_count": days_with_wrong_count,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        timetable.status = "published"
        timetable.save()

        serializer = self.get_serializer(timetable)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        """Unpublish a timetable (convert back to draft)"""
        timetable = self.get_object()

        if timetable.status == "draft":
            return Response({"detail": "Timetable is already a draft"}, status=status.HTTP_400_BAD_REQUEST)

        # Only Admin/Coordinator can unpublish
        user = request.user
        if not (user.is_superuser or in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            return Response(
                {"detail": "Only administrators can unpublish timetables"}, status=status.HTTP_403_FORBIDDEN
            )

        timetable.status = "draft"
        timetable.save()

        serializer = self.get_serializer(timetable)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def generate_weekly_templates(self, request):
        """Generate weekly timetable templates for all weeks in an academic period for a batch"""

        batch_id = request.data.get("batch")
        academic_period_id = request.data.get("academic_period")

        if not batch_id or not academic_period_id:
            return Response({"detail": "batch and academic_period are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from sims_backend.academics.models import AcademicPeriod, Batch

            batch = Batch.objects.get(pk=batch_id)
            academic_period = AcademicPeriod.objects.get(pk=academic_period_id)
        except (Batch.DoesNotExist, AcademicPeriod.DoesNotExist):
            return Response({"detail": "Invalid batch or academic_period"}, status=status.HTTP_404_NOT_FOUND)

        if not academic_period.start_date or not academic_period.end_date:
            return Response(
                {"detail": "Academic period must have start_date and end_date to generate weekly templates"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate all Mondays (week starts) between start_date and end_date
        start_date = academic_period.start_date
        end_date = academic_period.end_date

        # Find the first Monday on or before the start date
        days_until_monday = (start_date.weekday()) % 7
        if days_until_monday != 0:  # If not already Monday
            first_monday = start_date - timedelta(days=days_until_monday)
        else:
            first_monday = start_date

        # Generate templates for all weeks
        week_dates = []
        current_monday = first_monday

        while current_monday <= end_date:
            # Only create template if the week overlaps with the period
            week_end = current_monday + timedelta(days=5)  # Saturday
            if week_end >= start_date:  # Week overlaps with period
                week_dates.append(current_monday)
            current_monday += timedelta(days=7)

        # Create templates (only if they don't already exist)
        created_count = 0
        existing_count = 0
        created_timetables = []

        for week_start in week_dates:
            timetable, created = WeeklyTimetable.objects.get_or_create(
                batch=batch,
                academic_period=academic_period,
                week_start_date=week_start,
                defaults={
                    "status": "draft",
                    "created_by": request.user,
                },
            )
            if created:
                created_count += 1
                created_timetables.append(timetable.id)
            else:
                existing_count += 1

        return Response(
            {
                "detail": f"Generated {created_count} new templates, {existing_count} already existed",
                "created_count": created_count,
                "existing_count": existing_count,
                "total_weeks": len(week_dates),
                "created_ids": created_timetables,
            },
            status=status.HTTP_201_CREATED,
        )


class TimetableCellViewSet(viewsets.ModelViewSet):
    queryset = TimetableCell.objects.select_related("weekly_timetable").all()
    serializer_class = TimetableCellSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["weekly_timetable", "day_of_week", "time_slot"]
    ordering_fields = ["day_of_week", "time_slot"]
    ordering = ["day_of_week", "time_slot"]
    required_tasks = ["timetable.cells.view"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see cells from published timetables
        if in_group(user, "STUDENT") and not (in_group(user, "ADMIN") or in_group(user, "FACULTY")):
            queryset = queryset.filter(weekly_timetable__status="published")

        # Faculty can see cells from their own timetables or published ones
        elif in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            queryset = queryset.filter(Q(weekly_timetable__created_by=user) | Q(weekly_timetable__status="published"))

        return queryset

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["timetable.cells.view"]
        elif self.action == "create":
            self.required_tasks = ["timetable.cells.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["timetable.cells.update"]
        elif self.action == "destroy":
            self.required_tasks = ["timetable.cells.delete"]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Ensure timetable is draft before adding cells"""
        weekly_timetable = serializer.validated_data["weekly_timetable"]
        if weekly_timetable.status == "published":
            from rest_framework.exceptions import ValidationError

            raise ValidationError("Cannot add cells to a published timetable")

        # Verify user has permission
        user = self.request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if weekly_timetable.created_by != user:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("You can only modify your own timetables")

        serializer.save()

    def perform_update(self, serializer):
        """Ensure timetable is draft before updating cells"""
        weekly_timetable = serializer.instance.weekly_timetable
        if weekly_timetable.status == "published":
            from rest_framework.exceptions import ValidationError

            raise ValidationError("Cannot modify cells in a published timetable")

        # Verify user has permission
        user = self.request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if weekly_timetable.created_by != user:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("You can only modify your own timetables")

        serializer.save()

    def perform_destroy(self, instance):
        """Ensure timetable is draft before deleting cells"""
        weekly_timetable = instance.weekly_timetable
        if weekly_timetable.status == "published":
            from rest_framework.exceptions import ValidationError

            raise ValidationError("Cannot delete cells from a published timetable")

        # Verify user has permission
        user = self.request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if weekly_timetable.created_by != user:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("You can only modify your own timetables")

        instance.delete()


class TimetableEntryViewSet(viewsets.ModelViewSet):
    """CRUD for the normalized TimetableEntry model (see models.py docstring).

    Prefers cancellation (`cancel` action) over destructive deletion for
    published/live entries, consistent with the audit-trail expectation for
    staff-managed schedule changes; `destroy` remains available for
    correcting mistakes on entries that were never really valid.
    """

    queryset = TimetableEntry.objects.select_related(
        "weekly_timetable", "weekly_timetable__batch", "section", "section__course", "section__faculty", "group"
    ).all()
    serializer_class = TimetableEntrySerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["weekly_timetable", "section", "group", "day_of_week", "status"]
    ordering_fields = ["day_of_week", "start_time", "created_at"]
    ordering = ["day_of_week", "start_time"]
    required_tasks = ["timetable.entries.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["timetable.entries.view"]
        elif self.action == "create":
            self.required_tasks = ["timetable.entries.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["timetable.entries.update"]
        elif self.action == "destroy":
            self.required_tasks = ["timetable.entries.delete"]
        elif self.action == "cancel":
            self.required_tasks = ["timetable.entries.cancel"]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see entries from published timetables, scoped to
        # their own group (entries with group=None apply to the whole batch).
        student = getattr(user, "student", None)
        if in_group(user, "STUDENT") and not (in_group(user, "ADMIN") or in_group(user, "FACULTY")):
            queryset = queryset.filter(weekly_timetable__status="published")
            if student is not None:
                queryset = queryset.filter(Q(group__isnull=True) | Q(group=student.group)).filter(
                    weekly_timetable__batch=student.batch
                )
            else:
                queryset = queryset.none()

        # Faculty can see entries from their own draft timetables, entries
        # for sections they teach, or any published entry.
        elif in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            queryset = queryset.filter(
                Q(weekly_timetable__created_by=user)
                | Q(section__faculty=user)
                | Q(weekly_timetable__status="published")
            )

        return queryset

    def perform_create(self, serializer):
        weekly_timetable = serializer.validated_data["weekly_timetable"]
        if weekly_timetable.status == "published":
            raise ValidationError("Cannot add entries to a published timetable")

        user = self.request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if weekly_timetable.created_by != user:
                raise PermissionDenied("You can only modify your own timetables")

        serializer.save()

    def perform_update(self, serializer):
        weekly_timetable = serializer.instance.weekly_timetable
        if weekly_timetable.status == "published":
            raise ValidationError("Cannot modify entries in a published timetable; cancel or unpublish first")

        user = self.request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if weekly_timetable.created_by != user:
                raise PermissionDenied("You can only modify your own timetables")

        serializer.save()

    def perform_destroy(self, instance):
        weekly_timetable = instance.weekly_timetable
        if weekly_timetable.status == "published":
            raise ValidationError("Cannot delete entries from a published timetable; use cancel instead")

        user = self.request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if weekly_timetable.created_by != user:
                raise PermissionDenied("You can only modify your own timetables")

        instance.delete()

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Mark an entry cancelled without deleting it (audit-friendly)."""
        entry = self.get_object()

        user = request.user
        if in_group(user, "FACULTY") and not (in_group(user, "ADMIN") or in_group(user, "COORDINATOR")):
            if entry.weekly_timetable.created_by != user and entry.section.faculty_id != user.id:
                return Response(
                    {"detail": "You can only cancel your own entries"}, status=status.HTTP_403_FORBIDDEN
                )

        if entry.status == TimetableEntry.STATUS_CANCELLED:
            return Response({"detail": "Entry is already cancelled"}, status=status.HTTP_400_BAD_REQUEST)

        entry.status = TimetableEntry.STATUS_CANCELLED
        entry.save()

        serializer = self.get_serializer(entry)
        return Response(serializer.data)
