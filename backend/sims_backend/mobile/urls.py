from django.urls import path

from sims_backend.mobile.views import StudentHomeView, StudentTimetableView

urlpatterns = [
    path("student/home/", StudentHomeView.as_view(), name="mobile-student-home"),
    path("student/timetable/", StudentTimetableView.as_view(), name="mobile-student-timetable"),
]
