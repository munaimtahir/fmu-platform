from rest_framework import serializers

from sims_backend.admissions.serializers import StudentSerializer

from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source="student", read_only=True)

    class Meta:
        model = Attendance
        fields = ["id", "section", "student", "student_detail", "date", "present", "reason"]
