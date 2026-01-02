from django.urls import include, path
from rest_framework.routers import DefaultRouter

from sims_backend.attendance.input_views import (
    BiometricPunchAPIView,
    CSVDryRunAPIView,
    CSVCommitAPIView,
    LiveRosterAPIView,
    LiveSubmitAPIView,
    TickSheetCommitAPIView,
    TickSheetDryRunAPIView,
    TickSheetTemplateAPIView,
)
from .views import AttendanceViewSet

router = DefaultRouter()
router.register(r"attendance", AttendanceViewSet, basename="attendance")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/attendance-input/live/roster/", LiveRosterAPIView.as_view(), name="attendance_live_roster"),
    path("api/attendance-input/live/submit/", LiveSubmitAPIView.as_view(), name="attendance_live_submit"),
    path("api/attendance-input/csv/dry-run/", CSVDryRunAPIView.as_view(), name="attendance_csv_dry_run"),
    path("api/attendance-input/csv/commit/", CSVCommitAPIView.as_view(), name="attendance_csv_commit"),
    path("api/attendance-input/sheet/template/", TickSheetTemplateAPIView.as_view(), name="attendance_sheet_template"),
    path("api/attendance-input/sheet/dry-run/", TickSheetDryRunAPIView.as_view(), name="attendance_sheet_dry_run"),
    path("api/attendance-input/sheet/commit/", TickSheetCommitAPIView.as_view(), name="attendance_sheet_commit"),
    path("api/attendance-input/biometric/punches/", BiometricPunchAPIView.as_view(), name="attendance_biometric_punches"),
]
