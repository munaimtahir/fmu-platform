"""Read-only response serializers for the frozen mobile student contract.

These are documentation/schema serializers for drf-spectacular; the view
builds the response dict directly rather than instantiating them, since the
payload is an aggregate assembled from several models, not one queryset.
"""

from rest_framework import serializers


class MobileStudentIdentitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    reg_no = serializers.CharField()
    display_name = serializers.CharField()


class MobileAcademicPlacementSerializer(serializers.Serializer):
    programme = serializers.CharField(allow_null=True)
    batch = serializers.CharField(allow_null=True)
    group = serializers.CharField(allow_null=True)
    status = serializers.CharField()


class MobileAttendanceSummarySerializer(serializers.Serializer):
    total = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    leave = serializers.IntegerField()
    percentage = serializers.FloatField()


class MobileLatestResultSerializer(serializers.Serializer):
    exam_id = serializers.IntegerField()
    exam_title = serializers.CharField()
    status = serializers.CharField()
    final_outcome = serializers.CharField(allow_null=True)
    total_obtained = serializers.CharField(allow_null=True)


class MobileScheduleEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.CharField()
    day_of_week = serializers.IntegerField()
    day_name = serializers.CharField(allow_null=True)
    start_time = serializers.CharField(allow_null=True)
    end_time = serializers.CharField(allow_null=True)
    time_slot = serializers.CharField(allow_null=True, required=False)
    course_code = serializers.CharField(allow_null=True)
    course_name = serializers.CharField(allow_null=True)
    faculty_name = serializers.CharField(allow_null=True)
    room = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    notes = serializers.CharField(allow_null=True)
    source = serializers.CharField()


class MobileTimetableSerializer(serializers.Serializer):
    """Freeze 01 shape retained for backward compatibility (unused since
    Freeze 02 replaced the BLOCKED_BY_DATA_MODEL stub with real data)."""

    status = serializers.CharField()
    reason = serializers.CharField(allow_null=True, required=False)


class MobileTodayScheduleSerializer(MobileScheduleEntrySerializer):
    """Alias for readability in the student-home payload."""


class MobileStudentHomeSerializer(serializers.Serializer):
    """Documented shape of GET /api/mobile/student/home/ (Mobile API Freeze 02)."""

    student = MobileStudentIdentitySerializer()
    academic_placement = MobileAcademicPlacementSerializer()
    attendance_summary = MobileAttendanceSummarySerializer()
    latest_results = MobileLatestResultSerializer(many=True)
    today_schedule = MobileTodayScheduleSerializer(many=True)


class MobileStudentTimetableSerializer(serializers.Serializer):
    """Documented shape of GET /api/mobile/student/timetable/."""

    week_start_date = serializers.CharField()
    entries = MobileScheduleEntrySerializer(many=True)
    source = serializers.CharField()
