from django.urls import path

from sims_backend.mobile.views import StudentHomeView

urlpatterns = [
    path("student/home/", StudentHomeView.as_view(), name="mobile-student-home"),
]
