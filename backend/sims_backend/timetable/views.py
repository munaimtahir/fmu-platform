from datetime import datetime, timedelta
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import in_group
from sims_backend.timetable.models import Session, WeeklyTimetable, TimetableCell
from sims_backend.timetable.serializers import (
    SessionSerializer, WeeklyTimetableSerializer, WeeklyTimetableListSerializer, TimetableCellSerializer
)


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related(
        'academic_period', 'group', 'faculty', 'department'
    ).all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_period', 'group', 'faculty', 'department']
    search_fields = ['department__name', 'group__name']
    ordering_fields = ['starts_at', 'ends_at']
    ordering = ['starts_at']

    def get_permissions(self):
        # OfficeAssistant, Faculty, Admin, Coordinator can CRUD sessions
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Allow OfficeAssistant, Faculty, Admin, Coordinator
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Faculty can see their own sessions
        if in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            queryset = queryset.filter(faculty=user)

        return queryset


class WeeklyTimetableViewSet(viewsets.ModelViewSet):
    queryset = WeeklyTimetable.objects.select_related(
        'academic_period', 'batch', 'batch__program', 'created_by'
    ).prefetch_related('cells').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['academic_period', 'batch', 'status', 'week_start_date']
    ordering_fields = ['week_start_date', 'created_at']
    ordering = ['-week_start_date']

    def get_serializer_class(self):
        """Use detailed serializer for retrieve, list serializer for list"""
        if self.action == 'list':
            return WeeklyTimetableListSerializer
        return WeeklyTimetableSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see published timetables
        if in_group(user, 'STUDENT') and not (in_group(user, 'ADMIN') or in_group(user, 'FACULTY')):
            queryset = queryset.filter(status='published')

        # Faculty can see their own timetables or all published ones
        elif in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            queryset = queryset.filter(
                Q(created_by=user) | Q(status='published')
            )

        return queryset

    def get_permissions(self):
        """Restrict create/update/delete to Faculty/Admin/Coordinator"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish']:
            # Only Faculty, Admin, Coordinator can modify
            return [IsAuthenticated()]
        # Anyone authenticated can view (subject to queryset filtering)
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a draft timetable - requires exactly 3 periods per day"""
        from rest_framework.exceptions import ValidationError
        
        timetable = self.get_object()
        
        if timetable.status == 'published':
            return Response(
                {'detail': 'Timetable is already published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has permission (faculty can only publish their own, admin/coordinator can publish any)
        user = request.user
        if in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            if timetable.created_by != user:
                return Response(
                    {'detail': 'You can only publish your own timetables'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # NEW VALIDATION: Check that we have exactly 3 filled periods per day
        cells = list(timetable.cells.all())
        
        # Group cells by day and count periods with content
        day_period_counts = {}
        for day in range(6):  # Monday to Saturday (0-5)
            filled_periods = 0
            for cell in cells:
                if cell.day_of_week == day:
                    # A period is "filled" if line1 has content
                    if cell.line1 and cell.line1.strip():
                        filled_periods += 1
            day_period_counts[day] = filled_periods
        
        # Check that each day has exactly 3 periods
        days_with_wrong_count = []
        for day, count in day_period_counts.items():
            if count != 3:
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
                days_with_wrong_count.append(f"{day_name} ({count} periods)")
        
        if days_with_wrong_count:
            return Response(
                {
                    'error': {
                        'code': 'INVALID_PERIOD_COUNT',
                        'message': f'Each day must have exactly 3 periods. Found: {", ".join(days_with_wrong_count)}',
                        'days_with_wrong_count': days_with_wrong_count,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        timetable.status = 'published'
        timetable.save()
        
        serializer = self.get_serializer(timetable)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a timetable (convert back to draft)"""
        timetable = self.get_object()
        
        if timetable.status == 'draft':
            return Response(
                {'detail': 'Timetable is already a draft'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only Admin/Coordinator can unpublish
        user = request.user
        if not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            return Response(
                {'detail': 'Only administrators can unpublish timetables'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        timetable.status = 'draft'
        timetable.save()
        
        serializer = self.get_serializer(timetable)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generate_weekly_templates(self, request):
        """Generate weekly timetable templates for all weeks in an academic period for a batch"""
        from datetime import timedelta
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError
        
        batch_id = request.data.get('batch')
        academic_period_id = request.data.get('academic_period')
        
        if not batch_id or not academic_period_id:
            return Response(
                {'detail': 'batch and academic_period are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from sims_backend.academics.models import Batch, AcademicPeriod
            batch = Batch.objects.get(pk=batch_id)
            academic_period = AcademicPeriod.objects.get(pk=academic_period_id)
        except (Batch.DoesNotExist, AcademicPeriod.DoesNotExist):
            return Response(
                {'detail': 'Invalid batch or academic_period'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not academic_period.start_date or not academic_period.end_date:
            return Response(
                {'detail': 'Academic period must have start_date and end_date to generate weekly templates'},
                status=status.HTTP_400_BAD_REQUEST
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
                    'status': 'draft',
                    'created_by': request.user,
                }
            )
            if created:
                created_count += 1
                created_timetables.append(timetable.id)
            else:
                existing_count += 1
        
        return Response({
            'detail': f'Generated {created_count} new templates, {existing_count} already existed',
            'created_count': created_count,
            'existing_count': existing_count,
            'total_weeks': len(week_dates),
            'created_ids': created_timetables,
        }, status=status.HTTP_201_CREATED)


class TimetableCellViewSet(viewsets.ModelViewSet):
    queryset = TimetableCell.objects.select_related('weekly_timetable').all()
    serializer_class = TimetableCellSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['weekly_timetable', 'day_of_week', 'time_slot']
    ordering_fields = ['day_of_week', 'time_slot']
    ordering = ['day_of_week', 'time_slot']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see cells from published timetables
        if in_group(user, 'STUDENT') and not (in_group(user, 'ADMIN') or in_group(user, 'FACULTY')):
            queryset = queryset.filter(weekly_timetable__status='published')

        # Faculty can see cells from their own timetables or published ones
        elif in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            queryset = queryset.filter(
                Q(weekly_timetable__created_by=user) | Q(weekly_timetable__status='published')
            )

        return queryset

    def get_permissions(self):
        """Restrict create/update/delete to Faculty/Admin/Coordinator, and only for draft timetables"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Ensure timetable is draft before adding cells"""
        weekly_timetable = serializer.validated_data['weekly_timetable']
        if weekly_timetable.status == 'published':
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Cannot add cells to a published timetable')
        
        # Verify user has permission
        user = self.request.user
        if in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            if weekly_timetable.created_by != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only modify your own timetables')
        
        serializer.save()

    def perform_update(self, serializer):
        """Ensure timetable is draft before updating cells"""
        weekly_timetable = serializer.instance.weekly_timetable
        if weekly_timetable.status == 'published':
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Cannot modify cells in a published timetable')
        
        # Verify user has permission
        user = self.request.user
        if in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            if weekly_timetable.created_by != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only modify your own timetables')
        
        serializer.save()

    def perform_destroy(self, instance):
        """Ensure timetable is draft before deleting cells"""
        weekly_timetable = instance.weekly_timetable
        if weekly_timetable.status == 'published':
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Cannot delete cells from a published timetable')
        
        # Verify user has permission
        user = self.request.user
        if in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            if weekly_timetable.created_by != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only modify your own timetables')
        
        instance.delete()

