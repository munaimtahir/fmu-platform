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


class MobileTimetableSerializer(serializers.Serializer):
    status = serializers.CharField()
    reason = serializers.CharField(allow_null=True, required=False)


class MobileStudentHomeSerializer(serializers.Serializer):
    """Documented shape of GET /api/mobile/student/home/."""

    student = MobileStudentIdentitySerializer()
    academic_placement = MobileAcademicPlacementSerializer()
    attendance_summary = MobileAttendanceSummarySerializer()
    latest_results = MobileLatestResultSerializer(many=True)
    timetable = MobileTimetableSerializer()
